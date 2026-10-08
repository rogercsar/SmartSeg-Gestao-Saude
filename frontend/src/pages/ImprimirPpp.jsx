import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LOGO_SMARTSEG } from "@/lib/marca";
import { dataBR, hojeLocal } from "@/lib/sstGestao";

// Perfil Profissiográfico Previdenciário — modelo de formulário com dados do sistema.
// Desde 01/01/2023 o PPP de empregados é emitido em meio eletrônico a partir do eSocial (S-2240/S-2220);
// este documento atende períodos anteriores, conferência e instrução de processos.
const CSS = `
@page { size: A4; margin: 10mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.doc { background:#fff; color:#111; font-family: Arial, Helvetica, sans-serif; font-size: 8.6pt; max-width: 190mm; margin: 0 auto; padding: 12px; }
.topo { display:flex; align-items:center; gap:12px; border-bottom: 3px solid #0B6FA8; padding-bottom: 6px; margin-bottom: 8px }
.topo img { height: 48px } .topo h1 { font-size: 12.5pt; margin: 0; color:#0B6FA8 }
h2 { font-size: 9.5pt; background:#EAF4F8; padding:3px 6px; margin:8px 0 3px }
table { width:100%; border-collapse:collapse } th, td { border:1px solid #999; padding:3px 4px; text-align:left; vertical-align:top } th { background:#f6f9fb; font-weight:600 }
.n { width: 18px; text-align:center } .ass { margin-top: 26px; display:flex; gap:24px } .ass div { flex:1; border-top:1px solid #111; text-align:center; padding-top:3px }
.aviso { border:1px solid #E3A008; background:#FFF6DB; padding:5px 7px; margin:6px 0; font-size:8pt }
.barra { position: sticky; top: 0; background: #EAF4F8; border-bottom: 1px solid #E3E8EE; padding: 10px; display: flex; justify-content: center; z-index: 5 }
.barra button { background: #0B6FA8; color: #fff; border: 0; padding: 8px 16px; border-radius: 8px; font-weight: 700 }
@media print { .barra, .aviso.tela { display:none } .doc { padding:0 } }
`;
const TIPO_PPP = { fisico: "F", quimico: "Q", biologico: "B", ergonomico: "E", acidente: "M", psicossocial: "E" };
const sn = (v) => (v === true ? "S" : v === false ? "N" : "—");

export default function ImprimirPpp() {
  const [params] = useSearchParams();
  const [d, setD] = useState(null);
  useEffect(() => {
    (async () => {
      const t = await base44.entities.Trabalhador.get(params.get("trabalhador"));
      const [empresa, cargos, setores, riscos, lot, programas, ocorrencias] = await Promise.all([
        base44.entities.Company.get(t.company_id),
        base44.entities.CargoFuncao.filter({ company_id: t.company_id }).catch(() => []),
        base44.entities.Setor.filter({ company_id: t.company_id }).catch(() => []),
        base44.entities.Risco.filter({ company_id: t.company_id }).catch(() => []),
        base44.entities.LotacaoHistorico.filter({ trabalhador_id: t.id }, "data_inicio").catch(() => []),
        base44.entities.ProgramaSST.filter({ company_id: t.company_id }, "data_emissao").catch(() => []),
        base44.entities.OcorrenciaAcidente.filter({ trabalhador_id: t.id }).catch(() => []),
      ]);
      // Períodos de lotação: histórico de movimentações ou, na falta dele, o cargo atual desde a admissão
      const cargoDe = (id) => cargos.find((c) => c.id === id);
      let periodos = lot.filter((l) => l.cargo_id || l.setor_id).map((l, i, arr) => ({ inicio: l.data_inicio, fim: l.data_fim || (arr[i + 1] ? arr[i + 1].data_inicio : t.data_demissao || ""), cargo: cargoDe(l.cargo_id || t.cargo_id), setor_id: l.setor_id || t.setor_id }));
      if (!periodos.length) periodos = [{ inicio: t.data_admissao || "", fim: t.data_demissao || "", cargo: cargoDe(t.cargo_id), setor_id: t.setor_id || cargoDe(t.cargo_id)?.setor_id }];
      const exposicoes = periodos.flatMap((p) => riscos.filter((r) => p.cargo && (r.cargo_ids || []).includes(p.cargo.id) && r.tipo !== "psicossocial").map((r) => ({ p, r })));
      const ltcat = programas.filter((pr) => ["ltcat", "pgr"].includes(pr.tipo) && pr.responsavel?.nome);
      setD({ t, empresa, periodos, exposicoes, setores, ltcat, ocorrencias });
    })().catch((e) => setD({ erro: e.message }));
  }, [params]);

  if (!d) return <div style={{ padding: 40, color: "#5F6368" }}>Gerando PPP…</div>;
  if (d.erro) return <div style={{ padding: 40 }}>Não foi possível gerar: {d.erro}</div>;
  const { t, empresa, periodos, exposicoes, setores, ltcat, ocorrencias } = d;
  const setorNome = (id) => setores.find((s) => s.id === id)?.nome || "—";
  const gfip = (p) => (exposicoes.some((x) => x.p === p && x.r.aposentadoria_especial?.enquadra) ? "04" : "—");
  const per = (p) => `${dataBR(p.inicio) || "—"} a ${p.fim ? dataBR(p.fim) : "atual"}`;

  return (
    <div style={{ background: "#e5e7eb", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div className="barra"><button onClick={() => window.print()}>Imprimir / Salvar em PDF</button></div>
      <div className="doc">
        <div className="topo"><img src={LOGO_SMARTSEG} alt="SmartSeg" /><div><h1>PERFIL PROFISSIOGRÁFICO PREVIDENCIÁRIO — PPP</h1><div>Lei 8.213/1991, art. 58, § 4º · IN PRES/INSS nº 128/2022</div></div></div>
        <div className="aviso tela">Desde 01/01/2023 o PPP de empregados é gerado em meio eletrônico a partir das informações enviadas ao eSocial (S-2240 e S-2220). Use este formulário para períodos anteriores, conferência e processos. Confira cada campo antes de assinar; campos sem dado no sistema saem em branco para preenchimento.</div>

        <h2>SEÇÃO I — DADOS ADMINISTRATIVOS</h2>
        <table><tbody>
          <tr><th className="n">1</th><th>CNPJ do domicílio tributário / CEI</th><td>{empresa.cnpj || ""}</td><th className="n">2</th><th>Nome empresarial</th><td>{empresa.razao_social}</td><th className="n">3</th><th>CNAE</th><td>{empresa.cnae || ""}</td></tr>
          <tr><th className="n">4</th><th>Nome do trabalhador</th><td colSpan={4}>{t.nome}</td><th className="n">5</th><th>BR/PDH</th><td>NA</td></tr>
          <tr><th className="n">6</th><th>NIT</th><td>{t.nit || ""}</td><th className="n">7</th><th>Data do nascimento</th><td>{dataBR(t.data_nascimento)}</td><th className="n">8</th><th>Sexo (F/M)</th><td>{t.sexo || ""}</td></tr>
          <tr><th className="n">9</th><th>CTPS (nº, série, UF)</th><td>{t.ctps || ""}</td><th className="n">10</th><th>Data de admissão</th><td>{dataBR(t.data_admissao)}</td><th className="n">11</th><th>Regime de revezamento</th><td>{t.regime_revezamento || ""}</td></tr>
          <tr><th className="n">—</th><th>CPF</th><td>{t.cpf || ""}</td><th className="n">—</th><th>Matrícula</th><td colSpan={4}>{t.matricula || ""}</td></tr>
        </tbody></table>

        <h2>12 — CAT REGISTRADA</h2>
        <table><thead><tr><th>Data do registro</th><th>Número da CAT</th></tr></thead><tbody>
          {ocorrencias.filter((o) => o.cat_numero).length === 0 && <tr><td colSpan={2}>Nenhuma CAT registrada no sistema.</td></tr>}
          {ocorrencias.filter((o) => o.cat_numero).map((o) => <tr key={o.id}><td>{dataBR(o.cat_data || (o.data_hora || "").slice(0, 10))}</td><td>{o.cat_numero}</td></tr>)}
        </tbody></table>

        <h2>13 — LOTAÇÃO E ATRIBUIÇÃO</h2>
        <table><thead><tr><th>Período</th><th>CNPJ/CEI</th><th>Setor</th><th>Cargo</th><th>Função</th><th>CBO</th><th>Cód. GFIP</th></tr></thead><tbody>
          {periodos.map((p, i) => <tr key={i}><td>{per(p)}</td><td>{empresa.cnpj || ""}</td><td>{setorNome(p.setor_id)}</td><td>{p.cargo?.nome_cargo || ""}</td><td>{p.cargo?.nome_cargo || ""}</td><td>{p.cargo?.cbo || ""}</td><td>{gfip(p)}</td></tr>)}
        </tbody></table>

        <h2>14 — PROFISSIOGRAFIA</h2>
        <table><thead><tr><th style={{ width: "22%" }}>Período</th><th>Descrição das atividades</th></tr></thead><tbody>
          {periodos.map((p, i) => <tr key={i}><td>{per(p)}</td><td>{p.cargo?.atividades || ""}</td></tr>)}
        </tbody></table>

        <h2>SEÇÃO II — SEÇÃO DE REGISTROS AMBIENTAIS</h2>
        <h2>15 — EXPOSIÇÃO A FATORES DE RISCOS</h2>
        <table><thead><tr><th>Período</th><th>Tipo</th><th>Fator de risco</th><th>Intensidade / concentração</th><th>Técnica utilizada</th><th>EPC eficaz (S/N)</th><th>EPI eficaz (S/N)</th><th>CA EPI</th></tr></thead><tbody>
          {exposicoes.length === 0 && <tr><td colSpan={8}>Sem exposição a fatores de risco registrada para o cargo.</td></tr>}
          {exposicoes.map(({ p, r }, i) => {
            const epc = (r.epc || []).length ? (r.epc || []).every((e) => e.eficaz) : null;
            const epi = (r.epi || []).length ? (r.epi || []).every((e) => e.eficaz) : null;
            return <tr key={i}><td>{per(p)}</td><td>{TIPO_PPP[r.tipo] || ""}</td><td>{r.agente}{r.codigo_esocial ? ` (${r.codigo_esocial})` : ""}</td><td>{r.intensidade ? `${r.intensidade} ${r.unidade_medida || ""}` : "Qualitativo"}</td><td>{r.tecnica_medicao || (r.tipo_avaliacao === "qualitativa" ? "Avaliação qualitativa" : "")}</td><td>{sn(epc)}</td><td>{sn(epi)}</td><td>{(r.epi || []).map((e) => e.ca).filter(Boolean).join(", ")}</td></tr>;
          })}
        </tbody></table>
        <p style={{ fontSize: "7.8pt", margin: "3px 0" }}>Para o agente ruído, a declaração de eficácia do EPI não descaracteriza o tempo especial (STF, ARE 664.335 — Tema 555).</p>

        <h2>16 — RESPONSÁVEL PELOS REGISTROS AMBIENTAIS</h2>
        <table><thead><tr><th>Período</th><th>CPF / NIT</th><th>Registro conselho de classe</th><th>Nome do profissional legalmente habilitado</th></tr></thead><tbody>
          {ltcat.length === 0 && <tr><td colSpan={4}>Sem responsável técnico registrado nos programas (PGR/LTCAT).</td></tr>}
          {ltcat.map((pr) => <tr key={pr.id}><td>{dataBR(pr.data_emissao)} a {pr.vigencia_ate ? dataBR(pr.vigencia_ate) : "atual"}</td><td>{pr.responsavel?.cpf || ""}</td><td>{[pr.responsavel?.conselho, pr.responsavel?.numero, pr.responsavel?.uf].filter(Boolean).join(" ")}</td><td>{pr.responsavel?.nome}</td></tr>)}
        </tbody></table>

        <h2>SEÇÃO III — RESPONSÁVEIS PELAS INFORMAÇÕES</h2>
        <p style={{ fontSize: "8pt" }}>Declaramos, para todos os fins de direito, que as informações prestadas neste documento são verídicas e foram transcritas fielmente dos registros administrativos, das demonstrações ambientais e dos programas médicos de responsabilidade da empresa.</p>
        <table><tbody><tr><th>Data de emissão do PPP</th><td>{dataBR(hojeLocal())}</td><th>Representante legal da empresa (nome, NIT/CPF)</th><td style={{ width: "35%" }}>&nbsp;</td></tr></tbody></table>
        <div className="ass"><div>Carimbo e assinatura do representante legal</div><div>Ciente do trabalhador: {t.nome}</div></div>
      </div>
    </div>
  );
}
