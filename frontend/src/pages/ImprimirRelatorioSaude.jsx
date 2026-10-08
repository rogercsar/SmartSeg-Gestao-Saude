import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { perfilEpidemiologico, CAPITULOS_CID } from "@/lib/epidemiologia";
import { dataBR } from "@/lib/afastamentos";
import { MOMENTOS_EXAME } from "@/lib/sst";
import { TIPOS_RELATORIO } from "@/components/atestados/Relatorios";
import { fmt, nomeMes } from "@/components/atestados/PerfilEpidemiologico";

const CSS = `
@page { size: A4; margin: 16mm 14mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.doc { background:#fff; color:#111; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.45; max-width: 190mm; margin: 0 auto; padding: 16px; }
.doc h1 { font-size: 17pt; margin: 0 0 4px } .doc h2 { font-size: 12.5pt; margin: 20px 0 8px; border-bottom: 3px solid #0B6FA8; padding-bottom: 3px }
.doc p { margin: 0 0 7px; text-align: justify; white-space: pre-line } .doc table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; font-size: 9pt }
.doc th, .doc td { border: 1px solid #aaa; padding: 3px 5px; text-align: left; vertical-align: top } .doc th { background: #f1f1f1 }
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 8px 0 }
.card { border: 1px solid #ccc; border-radius: 6px; padding: 6px 8px } .card b { font-size: 14pt; display: block } .card span { font-size: 8pt; color: #555 }
.bar { height: 8px; background: #0B6FA8; border-radius: 3px } .serie { display: flex; align-items: flex-end; gap: 3px; height: 110px; margin: 10px 0 }
.serie div { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; height: 100%; font-size: 7pt; color: #555 }
.serie i { display: block; width: 100%; background: #0B6FA8; border-radius: 2px 2px 0 0 }
.aviso { border: 1px solid #F97316; background: #FFF7ED; padding: 6px 8px; border-radius: 6px; margin: 6px 0 }
.conf { font-size: 8pt; color: #b91c1c; text-align: center; margin-bottom: 8px }
.barra { position: sticky; top: 0; background: #EAF4F8; border-bottom: 1px solid #E3E8EE; padding: 10px; display: flex; justify-content: center; z-index: 5 }
.barra button { background: #0B6FA8; color: #FFFFFF; border: 0; padding: 8px 16px; border-radius: 8px; font-weight: 700 }
@media print { .barra { display: none } .doc { padding: 0 } }
`;

// No relatório para a gestão, grupos com menos de 3 pessoas são agregados para não identificar ninguém
function anonimizar(linhas) {
  const ok = linhas.filter((l) => l.pessoas >= 3);
  const resto = linhas.filter((l) => l.pessoas < 3);
  if (!resto.length) return ok;
  return [...ok, resto.reduce((a, l) => ({ ...a, atestados: a.atestados + l.atestados, dias: a.dias + l.dias, pessoas: a.pessoas + l.pessoas, pct_dias: a.pct_dias + l.pct_dias }), { chave: "Outros (grupos com menos de 3 pessoas)", atestados: 0, dias: 0, pessoas: 0, pct_dias: 0 })];
}

function Tabela({ titulo, linhas, rotulo = (k) => k }) {
  if (!linhas.length) return null;
  const top = Math.max(...linhas.map((l) => l.dias), 1);
  return (
    <>
      <h3 style={{ fontSize: "10.5pt", margin: "10px 0 4px" }}>{titulo}</h3>
      <table><thead><tr><th>Grupo</th><th style={{ width: 55 }}>Atestados</th><th style={{ width: 55 }}>Dias</th><th style={{ width: 55 }}>Pessoas</th><th style={{ width: 45 }}>% dias</th><th style={{ width: 110 }} /></tr></thead><tbody>
        {linhas.map((l) => (
          <tr key={l.chave}><td>{rotulo(l.chave)}</td><td>{l.atestados}</td><td>{l.dias}</td><td>{l.pessoas}</td><td>{fmt(l.pct_dias, 1, "%")}</td>
            <td><div className="bar" style={{ width: `${(l.dias / top) * 100}%` }} /></td></tr>
        ))}
      </tbody></table>
    </>
  );
}

const linhasTexto = (t) => String(t || "").split("\n").map((x) => x.replace(/^[-•\d.)\s]+/, "").trim()).filter(Boolean);

export default function ImprimirRelatorioSaude() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const rel = await base44.entities.RelatorioSaude.get(id);
        const cid = rel.company_id;
        const f = (e) => base44.entities[e].filter({ company_id: cid }).catch(() => []);
        const [empresa, atestados, trabalhadores, cargos, setores, cats, exames, programas] = await Promise.all([
          base44.entities.Company.get(cid), f("Atestado"), f("Trabalhador"), f("CargoFuncao"), f("Setor"), f("OcorrenciaAcidente"), f("ExamePcmso"), f("ProgramaSST"),
        ]);
        const perfil = perfilEpidemiologico({ atestados, trabalhadores, cargos, setores, cats, empresa, inicio: rel.inicio, fim: rel.fim, setorId: rel.setor_id || "" });
        setDados({ rel, empresa, perfil, cargos, exames, pcmso: programas.find((p) => p.tipo === "pcmso") });
      } catch (e) { setErro("Não foi possível carregar o relatório."); }
    })();
  }, [id]);

  if (erro) return <div style={{ padding: 40 }}>{erro}</div>;
  if (!dados) return <div style={{ padding: 40, color: "#94A3B8" }}>Gerando relatório…</div>;

  const { rel, empresa, perfil, cargos, exames, pcmso } = dados;
  const gestor = rel.tipo === "gestor";
  const i = perfil.indicadores;
  const an = rel.analise || {};
  const G = (l) => (gestor ? anonimizar(l) : l);
  const topMes = Math.max(...perfil.meses.map((m) => m.dias), 1);
  const alertas = gestor ? perfil.alertas.filter((a) => !a.includes("NTEP")) : perfil.alertas;
  let n = 0;
  const sec = (t) => `${++n}. ${t}`;

  return (
    <div style={{ background: "#e5e7eb", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div className="barra"><button onClick={() => window.print()}>Imprimir / Salvar em PDF</button></div>
      <div className="doc">
        <p className="conf">{gestor ? "Documento interno — dados agregados, sem identificação individual" : "CONFIDENCIAL — contém dados de saúde (LGPD, art. 11). Acesso restrito ao SESMT/serviço médico."}</p>
        <h1>{TIPOS_RELATORIO[rel.tipo]?.label}</h1>
        <p><b>{empresa.razao_social}</b> — CNPJ {empresa.cnpj || "—"} — CNAE {empresa.cnae || "—"}<br />
          Período: {dataBR(rel.inicio)} a {dataBR(rel.fim)} · Setor: {perfil.setor} · Efetivo considerado: {perfil.efetivo}</p>
        {rel.tipo === "analitico_pcmso" && <p>Elaborado conforme a NR-7 (relatório analítico do PCMSO), para discussão com o empregador e a CIPA{pcmso?.medico_coordenador?.nome ? `. Médico coordenador: ${pcmso.medico_coordenador.nome} — CRM ${pcmso.medico_coordenador.crm || ""}/${pcmso.medico_coordenador.uf || ""}` : ""}.</p>}

        {an.sintese && <><h2>{sec("Síntese")}</h2><p>{an.sintese}</p></>}

        <h2>{sec("Indicadores do período")}</h2>
        <div className="cards">
          {[["Taxa de absenteísmo", fmt(i.taxa_absenteismo, 2, "%"), "dias perdidos ÷ (efetivo × dias)"], ["Dias perdidos", i.dias_perdidos, `${fmt(i.dias_por_colaborador, 1)} por colaborador`],
            ["Atestados", i.atestados, `frequência ${fmt(i.indice_frequencia, 2)} por colaborador`], ["Prevalência", fmt(i.prevalencia, 1, "%"), `${i.colaboradores_afastados} colaboradores afastados`],
            ["Duração média", fmt(i.duracao_media, 1, " dias"), `${i.afastamentos_longos} afastamento(s) > 15 dias`], ["Ocupacionais", i.ocupacionais, `${i.dias_ocupacionais} dias · ${i.cats} CAT(s)`]]
            .map(([l, v, s]) => <div key={l} className="card">{l}<b>{v}</b><span>{s}</span></div>)}
        </div>

        <h2>{sec("Evolução mensal")}</h2>
        <div className="serie">{perfil.meses.map((m) => <div key={m.mes}>{m.dias || ""}<i style={{ height: `${(m.dias / topMes) * 80}%` }} />{nomeMes(m.mes)}</div>)}</div>
        <table><thead><tr><th>Mês</th>{perfil.meses.map((m) => <th key={m.mes}>{nomeMes(m.mes)}</th>)}</tr></thead><tbody>
          <tr><td>Atestados</td>{perfil.meses.map((m) => <td key={m.mes}>{m.atestados}</td>)}</tr>
          <tr><td>Dias</td>{perfil.meses.map((m) => <td key={m.mes}>{m.dias}</td>)}</tr>
          <tr><td>Taxa %</td>{perfil.meses.map((m) => <td key={m.mes}>{fmt(m.taxa, 2)}</td>)}</tr>
        </tbody></table>

        <h2>{sec("Perfil de morbidade")}</h2>
        <Tabela titulo="Por grupo de doença (capítulo CID-10)" linhas={G(perfil.por_capitulo)} />
        {!gestor && <Tabela titulo="CIDs mais frequentes (categoria de 3 caracteres)" linhas={perfil.por_cid} rotulo={(k) => `${k} — ${CAPITULOS_CID[k[0]] || ""}`} />}
        <Tabela titulo="Por natureza do afastamento" linhas={G(perfil.por_motivo)} />
        <Tabela titulo="Por duração" linhas={G(perfil.por_duracao)} />

        <h2>{sec("Distribuição por população")}</h2>
        <Tabela titulo="Por setor" linhas={G(perfil.por_setor)} />
        <Tabela titulo="Por cargo" linhas={G(perfil.por_cargo)} />
        <Tabela titulo="Por sexo" linhas={G(perfil.por_sexo)} />
        <Tabela titulo="Por faixa etária" linhas={G(perfil.por_faixa)} />
        <p style={{ fontSize: "8.5pt", color: "#555" }}>População do período — sexo: {perfil.populacao.sexo.map((x) => `${x.chave} ${x.n}`).join(", ") || "—"}; faixa etária: {perfil.populacao.faixa.map((x) => `${x.chave} ${x.n}`).join(", ") || "—"}.</p>

        {alertas.length > 0 && <><h2>{sec("Alertas epidemiológicos")}</h2>{alertas.map((a, k) => <div key={k} className="aviso">{a}</div>)}</>}

        {!gestor && perfil.reincidentes.length > 0 && (
          <><h2>{sec("Colaboradores reincidentes (3+ atestados)")}</h2>
            <table><thead><tr><th>Colaborador</th><th>Cargo</th><th>Atestados</th><th>Dias</th></tr></thead><tbody>
              {perfil.reincidentes.map((r) => <tr key={r.nome}><td>{r.nome}</td><td>{r.cargo}</td><td>{r.atestados}</td><td>{r.dias}</td></tr>)}
            </tbody></table></>
        )}

        {rel.tipo === "analitico_pcmso" && (
          <><h2>{sec("Exames previstos no PCMSO por cargo")}</h2>
            <table><thead><tr><th>Cargo</th><th>Exame</th><th>Momentos</th><th>Periodicidade</th></tr></thead><tbody>
              {cargos.flatMap((c) => exames.filter((e) => e.cargo_id === c.id && e.ativo !== false).map((e) => (
                <tr key={e.id}><td>{c.nome_cargo}</td><td>{e.exame}</td><td>{(e.momentos || []).map((m) => MOMENTOS_EXAME[m]).join(", ")}</td><td>{e.periodicidade_meses || 12} meses</td></tr>
              )))}
            </tbody></table>
            <p style={{ fontSize: "8.5pt", color: "#555" }}>A NR-7 também pede o número e o tipo de exames realizados e de resultados alterados no período. Esses dados virão do registro de ASOs; enquanto isso, complemente manualmente se necessário.</p></>
        )}

        {linhasTexto(an.achados).length > 0 && <><h2>{sec("Principais achados")}</h2><ul>{linhasTexto(an.achados).map((t, k) => <li key={k}>{t}</li>)}</ul></>}
        {linhasTexto(an.recomendacoes).length > 0 && <><h2>{sec("Recomendações")}</h2><ol>{linhasTexto(an.recomendacoes).map((t, k) => <li key={k}>{t}</li>)}</ol></>}
        {an.conclusao && <><h2>{sec("Conclusão")}</h2><p>{an.conclusao}</p></>}

        <h2>{sec("Metodologia")}</h2>
        <p style={{ fontSize: "9pt" }}>Fonte: atestados registrados no SmartSeg no período (dias recortados ao período). Taxa de absenteísmo = dias perdidos ÷ (efetivo × dias corridos) × 100. Índice de frequência = atestados ÷ efetivo. Prevalência = colaboradores com ao menos um atestado ÷ efetivo × 100. Duração média = dias ÷ atestados. Agrupamento de morbidade pelos capítulos da CID-10. {i.cobertura_cid !== null ? `${fmt(i.cobertura_cid, 0, "%")} dos atestados tinham CID informado.` : ""}{gestor ? " Grupos com menos de 3 pessoas foram agregados para preservar a privacidade." : ""}</p>

        <div style={{ marginTop: 50, textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #111", width: "65%", margin: "0 auto", paddingTop: 4 }}>{rel.responsavel?.nome || "Responsável técnico"}<br />{rel.responsavel?.registro || ""}</div>
          <p style={{ textAlign: "center", fontSize: "8pt", color: "#555", marginTop: 8 }}>Emitido em {new Date().toLocaleDateString("pt-BR")}</p>
        </div>
      </div>
    </div>
  );
}