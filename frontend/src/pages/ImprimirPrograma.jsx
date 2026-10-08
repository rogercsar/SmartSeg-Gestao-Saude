import QrAutenticidade from "@/components/QrAutenticidade";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { DOCUMENTOS, TIPOS_RISCO, EXPOSICAO, MATRIZES, NIVEIS, NR15_ANEXOS, NR16_ANEXOS, GRAUS_INSALUBRIDADE, MOMENTOS_EXAME, avaliar } from "@/lib/sst";
import { conclusaoCargo } from "@/components/programas/Laudos";
import { TIPOS_MEDICAO } from "@/lib/calculos";
import { descEquip } from "@/components/programas/Medicoes";
import { CATEGORIAS_ANEXO } from "@/components/programas/Anexos";
import { linkTemporario } from "@/lib/privateFiles";
import { pendenciasPgr } from "@/lib/pgrConformidade";

const ENT = { unidades: "Unidade", setores: "Setor", cargos: "CargoFuncao", trabalhadores: "Trabalhador", riscos: "Risco", exames: "ExamePcmso", programas: "ProgramaSST", medicoes: "Medicao", anexos: "Anexo" };
const dataBR = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—");

const CSS = `
@page { size: A4; margin: 18mm 15mm; }
.doc { background:#fff; color:#111; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; max-width: 190mm; margin: 0 auto; padding: 16px; }
.doc h1 { font-size: 20pt; margin: 0 0 6px } .doc h2 { font-size: 13pt; margin: 22px 0 8px; border-bottom: 3px solid #0B6FA8; padding-bottom: 3px }
.doc h3 { font-size: 11.5pt; margin: 14px 0 6px } .doc p { margin: 0 0 8px; text-align: justify; white-space: pre-line }
.doc table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; font-size: 9pt } .doc th, .doc td { border: 1px solid #999; padding: 4px 5px; vertical-align: top; text-align: left }
.doc th { background: #f1f1f1 } .capa { min-height: 240mm; display: flex; flex-direction: column; justify-content: center; text-align: center; page-break-after: always }
.quebra { page-break-before: always } .assin { margin-top: 50px; text-align: center } .assin div { border-top: 1px solid #111; width: 70%; margin: 0 auto; padding-top: 4px }
.barra { position: sticky; top: 0; background: #EAF4F8; border-bottom: 1px solid #E3E8EE; padding: 10px; display: flex; gap: 8px; justify-content: center; z-index: 5 }
.barra button { background: #0B6FA8; color: #FFFFFF; border: 0; padding: 8px 16px; border-radius: 8px; font-weight: 700 }
@media print { .barra { display: none } .doc { padding: 0 } body { background: #fff } }
`;

function Textos({ t = {}, campo, titulo }) {
  return t[campo] ? <><h2>{titulo}</h2><p>{t[campo]}</p></> : null;
}

function Assinatura({ p, img }) {
  const r = p.responsavel || {};
  return (
    <div className="assin">
      {img && <img src={img} alt="" style={{ height: 60, display: "block", margin: "0 auto 2px" }} />}
      <div>{r.nome || "Responsável técnico"}<br />{r.formacao || ""} {r.conselho ? `— ${r.conselho} ${r.numero || ""}/${r.uf || ""}` : ""}</div>
    </div>
  );
}

function Identificacao({ d }) {
  const e = d.empresa;
  return (
    <>
      <h2>1. Identificação da empresa</h2>
      <table><tbody>
        <tr><th>Razão social</th><td>{e.razao_social}</td><th>CNPJ</th><td>{e.cnpj || "—"}</td></tr>
        <tr><th>CNAE</th><td>{e.cnae || "—"}</td><th>Grau de risco</th><td>{e.grau_de_risco || "—"}</td></tr>
        <tr><th>Atividade</th><td colSpan={3}>{e.setor_descricao || "—"}</td></tr>
      </tbody></table>
      <h3>Estabelecimentos</h3>
      <table><thead><tr><th>Unidade</th><th>Inscrição</th><th>Endereço</th><th>Trabalhadores</th></tr></thead><tbody>
        {d.unidades.map((u) => <tr key={u.id}><td>{u.nome}</td><td>{String(u.tipo_inscricao || "").toUpperCase()} {u.numero_inscricao}</td><td>{u.endereco} {u.municipio}/{u.uf}</td><td>{u.num_trabalhadores || "—"}</td></tr>)}
      </tbody></table>
    </>
  );
}

function MedicoesSec({ d, titulo, tipos }) {
  const lista = d.medicoes.filter((m) => !tipos || tipos.includes(m.tipo));
  if (!lista.length) return null;
  return (
    <>
      <h2>{titulo}</h2>
      <table><thead><tr><th>Avaliação</th><th>Setor / avaliado</th><th>Data</th><th>Equipamento e calibração</th><th>Metodologia</th><th>Resultado</th><th>Limite</th><th>Conclusão</th></tr></thead><tbody>
        {lista.map((m) => {
          const e = d.equipamentos.find((x) => x.id === m.equipamento_id);
          const r = m.resultado || {};
          return (
            <tr key={m.id}>
              <td>{TIPOS_MEDICAO[m.tipo]?.label}{m.agente ? " — " + m.agente : ""}</td>
              <td>{d.setores.find((s) => s.id === m.setor_id)?.nome || ""}{m.avaliado ? " / " + m.avaliado : ""}</td>
              <td>{dataBR(m.data)}</td>
              <td>{e ? `${descEquip(e)}; cert. ${e.certificado_numero || "—"} (${e.laboratorio || ""}), válido até ${dataBR(e.validade_calibracao)}` : "—"}</td>
              <td>{m.metodologia}</td>
              <td>{r.nr15 ? `Dose NR-15 ${r.nr15.dose_pct}% / NE ${r.nr15.ne_8h} dB(A)` : ""}{r.nho01 ? ` · NEN ${r.nho01.nen} dB(A) (dose ${r.nho01.dose_pct}%)` : ""}{!r.nr15 && !r.nho01 ? `${r.valor ?? "—"} ${r.unidade || ""}` : ""}</td>
              <td>{r.limite}</td>
              <td>{r.conclusao}</td>
            </tr>
          );
        })}
      </tbody></table>
    </>
  );
}

function AnexosSec({ d, p }) {
  const lista = d.anexos.filter((a) => a.incluir_no_documento !== false && a.categoria !== "documento_assinado" && (a.vinculo_tipo !== "programa" || a.vinculo_id === p.id));
  if (!lista.length) return null;
  return (
    <>
      <h2>Anexos</h2>
      <table><thead><tr><th>#</th><th>Documento</th><th>Categoria</th><th>Descrição</th></tr></thead><tbody>
        {lista.map((a, i) => <tr key={a.id}><td>{i + 1}</td><td>{a.nome}</td><td>{CATEGORIAS_ANEXO[a.categoria] || a.categoria}</td><td>{a.descricao}</td></tr>)}
      </tbody></table>
    </>
  );
}

function Capa({ d, p, info }) {
  return (
    <div className="capa">
      <p style={{ textAlign: "center", fontSize: "12pt", color: "#0B6FA8", fontWeight: 700 }}>{info.label}</p>
      <h1>{info.nome}</h1>
      <p style={{ textAlign: "center" }}>{info.base}</p>
      <p style={{ textAlign: "center", fontSize: "14pt", marginTop: 30 }}><b>{d.empresa.razao_social}</b><br />CNPJ {d.empresa.cnpj || "—"}</p>
      <p style={{ textAlign: "center", marginTop: 30 }}>Versão {p.versao || "1.0"} · Emissão {dataBR(p.data_emissao)} · Vigência até {dataBR(p.vigencia_ate)}</p>
      {(p.status !== "emitido" || (p.tipo === "pgr" && (!p.documento_assinado?.file_uri || pendenciasPgr(d, p).length > 0))) && <p style={{ textAlign: "center", color: "#b91c1c", fontWeight: 700 }}>RASCUNHO — NÃO VÁLIDO COMO DOCUMENTO OFICIAL</p>}
    </div>
  );
}

function MatrizCriterios({ matriz }) {
  const m = MATRIZES[matriz];
  const n = m.n;
  return (
    <>
      <p>Matriz {matriz}: nível de risco = severidade × probabilidade.</p>
      <table style={{ width: "auto" }}><tbody>
        {Array.from({ length: n }, (_, i) => n - i).map((pp) => (
          <tr key={pp}><th>{pp} · {m.probabilidade[pp - 1]}</th>
            {Array.from({ length: n }, (_, j) => j + 1).map((s) => {
              const nv = NIVEIS[m.classificar(s * pp)];
              return <td key={s} style={{ background: nv.cor, textAlign: "center", width: 48 }}>{s * pp}</td>;
            })}</tr>
        ))}
        <tr><th />{m.severidade.map((s, i) => <th key={i} style={{ fontSize: "7.5pt" }}>{i + 1} · {s}</th>)}</tr>
      </tbody></table>
      <table><thead><tr><th>Nível</th><th>Ação requerida</th></tr></thead><tbody>
        {Object.values(NIVEIS).map((nv) => <tr key={nv.label}><td style={{ background: nv.cor }}>{nv.label}</td><td>{nv.acao}</td></tr>)}
      </tbody></table>
    </>
  );
}

function Pgr({ d, p, img }) {
  const matriz = p.matriz || "5x5";
  const acoes = d.riscos.flatMap((r) => (r.plano_acao || []).map((a) => ({ ...a, risco: r.agente })));
  return (
    <>
      <Identificacao d={d} />
      <Textos t={p.textos} campo="introducao" titulo="2. Introdução e objetivo" />
      <Textos t={p.textos} campo="responsabilidades" titulo="3. Responsabilidades" />
      <h2>4. Metodologia e critérios de avaliação</h2>
      {p.textos?.metodologia && <p>{p.textos.metodologia}</p>}
      <MatrizCriterios matriz={matriz} />
      <h2 className="quebra">5. Inventário de riscos</h2>
      <p>O inventário deve ser revisto de forma contínua, ao menos a cada dois anos ou quando ocorrerem mudanças, acidentes, falha de medidas, alterações legais ou avaliação de risco residual (NR-01, 1.5.4.4.6). O histórico de atualizações deve ser preservado por, no mínimo, 20 anos (1.5.7.3.3.1).</p>
      {d.setores.map((s) => {
        const riscos = d.riscos.filter((r) => r.setor_id === s.id);
        const cargos = d.cargos.filter((c) => c.setor_id === s.id);
        return (
          <div key={s.id}>
            <h3>Setor: {s.nome}</h3>
            {s.descricao_ambiente && <p><b>Ambiente:</b> {s.descricao_ambiente}</p>}
            {cargos.map((c) => <p key={c.id}><b>{c.nome_cargo}</b> (CBO {c.cbo || "—"}{c.quantidade_funcionarios ? `, ${c.quantidade_funcionarios} trab.` : ""}): {c.atividades || "—"}</p>)}
            <table><thead><tr><th>Tipo</th><th>Perigo/agente</th><th>Grupo exposto</th><th>Fonte</th><th>Danos</th><th>Exposição</th><th>Controles</th><th>S</th><th>P</th><th>Nível</th></tr></thead><tbody>
              {riscos.length === 0 && <tr><td colSpan={10}>Nenhum risco identificado.</td></tr>}
              {riscos.map((r) => {
                const av = avaliar(r, matriz);
                return (
                  <tr key={r.id}>
                    <td>{TIPOS_RISCO[r.tipo]?.label}</td><td>{r.agente}{r.codigo_esocial ? ` (${r.codigo_esocial})` : ""}{r.intensidade ? ` — ${r.intensidade} ${r.unidade_medida || ""}` : ""}</td>
                    <td>{(r.cargo_ids || []).map((id) => d.cargos.find((c) => c.id === id)?.nome_cargo).filter(Boolean).join(", ") || "—"}</td><td>{r.fonte_geradora}</td><td>{r.possiveis_danos}</td><td>{EXPOSICAO[r.exposicao] || ""}</td>
                    <td>{[...(r.medidas_existentes || []), ...(r.epc || []).map((e) => "EPC: " + e.nome), ...(r.epi || []).map((e) => `EPI: ${e.nome}${e.ca ? " CA " + e.ca : ""}`)].join("; ")}</td>
                    <td>{av?.s || ""}</td><td>{av?.p || ""}</td><td style={{ background: av?.cor || "transparent" }}>{av?.label || "—"}{r.criterio_avaliacao ? ` · ${r.criterio_avaliacao}` : ""}{r.data_avaliacao ? ` · Avaliado em ${dataBR(r.data_avaliacao)}` : ""}</td>
                  </tr>
                );
              })}
            </tbody></table>
          </div>
        );
      })}
      <MedicoesSec d={d} titulo="5.1 Avaliações quantitativas" />
      <h2>6. Plano de ação</h2>
      <table><thead><tr><th>Ação / prioridade</th><th>Risco</th><th>Responsável</th><th>Prazo</th><th>Acompanhamento</th><th>Aferição / implementação</th><th>Situação</th></tr></thead><tbody>
        {acoes.length === 0 && <tr><td colSpan={7}>Sem ações cadastradas.</td></tr>}
        {acoes.map((a, i) => <tr key={i}><td>{a.acao} · {a.tipo_medida || "tipo não informado"}</td><td>{a.risco}</td><td>{a.responsavel}</td><td>{dataBR(a.prazo)}</td><td>{a.acompanhamento || "—"}</td><td>{a.afericao_resultado || "—"}{a.registro_implementacao ? ` · ${a.registro_implementacao}` : ""}</td><td>{a.status}</td></tr>)}
      </tbody></table>
      <Textos t={p.textos} campo="conclusao" titulo="7. Conclusão" />
      <Textos t={p.textos} campo="revisao" titulo="8. Revisão" />
      <AnexosSec d={d} p={p} />
      <Assinatura p={p} img={img} />
      {p.status === "emitido" && <QrAutenticidade codigo={p.autenticacao_codigo} />}
    </>
  );
}

function Pcmso({ d, p, img }) {
  const med = p.medico_coordenador || {};
  return (
    <>
      <Identificacao d={d} />
      <h2>2. Médico coordenador</h2>
      <p>{med.nome || "—"} — CRM {med.crm || "—"}/{med.uf || ""}</p>
      <Textos t={p.textos} campo="introducao" titulo="3. Introdução e objetivo" />
      <Textos t={p.textos} campo="metodologia" titulo="4. Diretrizes" />
      <h2 className="quebra">5. Riscos e exames por cargo</h2>
      {d.cargos.map((c) => {
        const riscos = d.riscos.filter((r) => (r.cargo_ids || []).includes(c.id));
        const exames = d.exames.filter((e) => e.cargo_id === c.id && e.ativo !== false);
        return (
          <div key={c.id}>
            <h3>{c.nome_cargo} — {d.setores.find((s) => s.id === c.setor_id)?.nome || ""}</h3>
            <p><b>Riscos:</b> {riscos.map((r) => `${r.agente} (${TIPOS_RISCO[r.tipo]?.label})`).join("; ") || "Ausência de riscos ocupacionais específicos"}</p>
            <table><thead><tr><th>Exame</th>{Object.values(MOMENTOS_EXAME).map((m) => <th key={m}>{m}</th>)}<th>Periodicidade</th></tr></thead><tbody>
              {exames.map((e) => (
                <tr key={e.id}><td>{e.exame}{e.codigo_esocial ? ` (${e.codigo_esocial})` : ""}</td>
                  {Object.keys(MOMENTOS_EXAME).map((k) => <td key={k} style={{ textAlign: "center" }}>{(e.momentos || []).includes(k) ? "X" : ""}</td>)}
                  <td>{e.periodicidade_meses || 12} meses</td></tr>
              ))}
            </tbody></table>
          </div>
        );
      })}
      <Textos t={p.textos} campo="responsabilidades" titulo="6. Responsabilidades" />
      <Textos t={p.textos} campo="conclusao" titulo="7. Considerações finais" />
      <AnexosSec d={d} p={p} />
      <div className="assin">{img && <img src={img} alt="" style={{ height: 60, display: "block", margin: "0 auto 2px" }} />}<div>{med.nome || "Médico coordenador"}<br />CRM {med.crm || ""}/{med.uf || ""}</div></div>
    </>
  );
}

function LaudoPorCargo({ d, p, tipo, img }) {
  return (
    <>
      <Identificacao d={d} />
      <Textos t={p.textos} campo="introducao" titulo="2. Objetivo e base legal" />
      <Textos t={p.textos} campo="metodologia" titulo="3. Metodologia" />
      <h2 className="quebra">4. Avaliação por cargo</h2>
      {d.cargos.map((c) => {
        const riscos = d.riscos.filter((r) => (r.cargo_ids || []).includes(c.id));
        const k = conclusaoCargo(riscos);
        return (
          <div key={c.id}>
            <h3>{c.nome_cargo} (CBO {c.cbo || "—"}) — {d.setores.find((s) => s.id === c.setor_id)?.nome || ""}</h3>
            <p><b>Atividades:</b> {c.atividades || "—"}</p>
            <table><thead><tr><th>Agente</th><th>Exposição</th><th>Avaliação</th><th>EPC/EPI</th><th>Enquadramento</th><th>Fundamentação</th></tr></thead><tbody>
              {riscos.length === 0 && <tr><td colSpan={6}>Não foram identificados agentes nocivos.</td></tr>}
              {riscos.map((r) => {
                const enq = tipo === "insalubridade" ? (r.insalubridade?.caracteriza ? `${NR15_ANEXOS[r.insalubridade.anexo] || ""} — ${GRAUS_INSALUBRIDADE[r.insalubridade.grau] || ""}` : "Não caracteriza")
                  : tipo === "periculosidade" ? (r.periculosidade?.caracteriza ? NR16_ANEXOS[r.periculosidade.anexo] || "" : "Não caracteriza")
                    : (r.aposentadoria_especial?.enquadra ? `Anexo IV — código ${r.aposentadoria_especial.codigo_anexo_iv || ""}` : "Não enquadra");
                const fund = tipo === "insalubridade" ? r.insalubridade?.fundamentacao : tipo === "periculosidade" ? r.periculosidade?.fundamentacao : r.aposentadoria_especial?.fundamentacao;
                return (
                  <tr key={r.id}>
                    <td>{r.agente}{r.codigo_esocial ? ` (${r.codigo_esocial})` : ""}</td><td>{EXPOSICAO[r.exposicao] || ""}</td>
                    <td>{r.tipo_avaliacao === "quantitativa" ? `${r.intensidade || "?"} ${r.unidade_medida || ""} (LT ${r.limite_tolerancia || "?"}; ${r.tecnica_medicao || ""})` : "Qualitativa"}</td>
                    <td>{[...(r.epc || []).map((e) => `${e.nome}${e.eficaz ? " (eficaz)" : ""}`), ...(r.epi || []).map((e) => `${e.nome} CA ${e.ca || "?"}${e.eficaz ? " (eficaz)" : ""}`)].join("; ") || "—"}</td>
                    <td>{enq}</td><td>{fund || ""}</td>
                  </tr>
                );
              })}
            </tbody></table>
            <p><b>Conclusão:</b>{" "}
              {tipo === "insalubridade" && (k.insalubre ? `atividade INSALUBRE em grau ${GRAUS_INSALUBRIDADE[k.grau] || "a definir"}.` : "atividade NÃO insalubre.")}
              {tipo === "periculosidade" && (k.perigoso ? "atividade PERIGOSA, com direito ao adicional de 30% (CLT art. 193)." : "atividade NÃO perigosa.")}
              {tipo === "ltcat" && (k.aposentadoria ? "há exposição a agente nocivo que enseja aposentadoria especial." : "não há exposição a agente nocivo que enseje aposentadoria especial.")}
            </p>
          </div>
        );
      })}
      {tipo !== "periculosidade" && <MedicoesSec d={d} titulo="5. Avaliações quantitativas" tipos={["ruido", "ruido_impacto", "calor", "frio", "vibracao", "quimico"]} />}
      <Textos t={p.textos} campo="conclusao" titulo="6. Conclusão geral" />
      <AnexosSec d={d} p={p} />
      <Assinatura p={p} img={img} />
      {p.status === "emitido" && <QrAutenticidade codigo={p.autenticacao_codigo} />}
    </>
  );
}

export default function ImprimirPrograma() {
  const [params] = useSearchParams();
  const empresaId = params.get("empresa");
  const tipo = params.get("tipo");
  const [d, setD] = useState(null);
  const [img, setImg] = useState(null);

  useEffect(() => {
    (async () => {
      const empresa = await base44.entities.Company.get(empresaId);
      const listas = await Promise.all(Object.values(ENT).map((e) => base44.entities[e].filter({ company_id: empresaId }).catch(() => [])));
      const dd = { empresa };
      Object.keys(ENT).forEach((k, i) => { dd[k] = listas[i]; });
      dd.equipamentos = await base44.entities.Equipamento.list("modelo", 200).catch(() => []);
      const prog = dd.programas.find((x) => x.tipo === tipo);
      if (prog?.assinatura?.modo === "imagem" && prog.assinatura.file_uri) {
        setImg(await linkTemporario(prog.assinatura.file_uri, 3600).catch(() => null));
      }
      setD(dd);
    })();
  }, [empresaId, tipo]);

  if (!d) return <div style={{ padding: 40, color: "#94A3B8" }}>Carregando documento…</div>;
  const info = DOCUMENTOS[tipo];
  const p = d.programas.find((x) => x.tipo === tipo) || {};
  if (!info) return <div style={{ padding: 40 }}>Documento inválido.</div>;

  return (
    <div style={{ background: "#e5e7eb", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div className="barra"><button onClick={() => window.print()}>Imprimir / Salvar em PDF</button></div>
      <div className="doc">
        <Capa d={d} p={p} info={info} />
        {tipo === "pgr" && <>
          {pendenciasPgr(d, p).length > 0 && <div style={{ border: "2px solid #b91c1c", padding: 12 }}><b>Pendências documentais NR-01 — não emitir como PGR final:</b><ul>{pendenciasPgr(d, p).map((item, i) => <li key={i}>{item}</li>)}</ul></div>}
          <Pgr d={d} p={p} img={img} />
        </>}
        {tipo === "pcmso" && <Pcmso d={d} p={p} img={img} />}
        {["ltcat", "insalubridade", "periculosidade"].includes(tipo) && <LaudoPorCargo d={d} p={p} tipo={tipo} img={img} />}
        {tipo === "insalubridade" && (
          <p style={{ fontSize: "9pt", marginTop: 10, padding: 8, border: "1px solid #bbb", background: "#f6f9fb" }}>
            Disponibilidade: conforme o item 15.4.1.3 da NR-15 (Portaria MTE nº 2.021/2025, em vigor desde 03/04/2026), este laudo caracterizador
            de insalubridade está disponível aos trabalhadores, aos sindicatos das categorias profissionais e à inspeção do trabalho.
          </p>
        )}
      </div>
    </div>
  );
}