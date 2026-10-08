import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LOGO_SMARTSEG } from "@/lib/marca";
import { hojeLocal, dataBR, addDias } from "@/lib/sstGestao";
import { situacaoTreinamentos } from "@/pages/Treinamentos";
import { situacaoEpiColaborador } from "@/pages/Epi";

// Dossiê da Fiscalização: visão consolidada do cumprimento das NRs de uma empresa, para apresentar à inspeção do trabalho.
const CSS = `
@page { size: A4; margin: 12mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.doc { background:#fff; color:#111; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; max-width: 190mm; margin: 0 auto; padding: 14px; }
.topo { display:flex; align-items:center; gap:14px; border-bottom: 3px solid #0B6FA8; padding-bottom: 8px; margin-bottom: 10px }
.topo img { height: 54px } .topo h1 { font-size: 15pt; margin: 0; color:#0B6FA8 }
h2 { font-size: 10.5pt; background:#EAF4F8; padding:4px 6px; margin:12px 0 4px }
table { width:100%; border-collapse:collapse } td, th { border:1px solid #bbb; padding:4px 6px; text-align:left; vertical-align:top } th { background:#f6f9fb; width:46% }
.ok { color:#146C43; font-weight:700 } .at { color:#8A5A00; font-weight:700 } .no { color:#B42318; font-weight:700 }
.resumo { display:grid; grid-template-columns: repeat(3,1fr); gap:6px; margin:8px 0 } .resumo div { border:1px solid #ccc; border-radius:6px; padding:6px; text-align:center } .resumo b { display:block; font-size:16pt }
.barra { position: sticky; top: 0; background: #EAF4F8; border-bottom: 1px solid #E3E8EE; padding: 10px; display: flex; gap: 8px; justify-content: center; z-index: 5 }
.barra select, .barra button { padding: 8px 12px; border-radius: 8px; border: 1px solid #0B6FA8; font-size: 14px } .barra button { background:#0B6FA8; color:#fff; font-weight:700 }
@media print { .barra { display:none } .doc { padding:0 } }
`;
const S = { ok: ["✔ Conforme", "ok"], at: [" Atenção", "at"], no: ["✖ Pendente", "no"] };
const DOCS = { pgr: "PGR (NR-1)", pcmso: "PCMSO (NR-7)", ltcat: "LTCAT", insalubridade: "Laudo de insalubridade (NR-15)", periculosidade: "Laudo de periculosidade (NR-16)" };

export default function Dossie() {
  const [params, setParams] = useSearchParams();
  const [empresas, setEmpresas] = useState([]);
  const [d, setD] = useState(null);
  const id = params.get("empresa") || "";
  useEffect(() => { base44.entities.Company.list("razao_social", 1000).then((l) => { setEmpresas(l); if (!id && l[0]) setParams({ empresa: l[0].id }); }).catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!id) return;
    setD(null);
    (async () => {
      const f = (e, o) => base44.entities[e].filter({ company_id: id }, o, 5000).catch(() => []);
      const [emp, trabs, riscos, programas, medicoes, matriz, treinos, entregas, mandatos, reunioes, inspecoes, acoes, psico] = await Promise.all([
        base44.entities.Company.get(id), f("Trabalhador"), f("Risco"), f("ProgramaSST"), f("Medicao"), f("MatrizTreinamento"), f("Treinamento"), f("EntregaEpi"),
        f("MandatoCipa", "-inicio"), f("ReuniaoCipa"), f("InspecaoChecklist", "-data"), f("PlanoAcao"), f("AplicacaoPsicossocial", "-created_date"),
      ]);
      const asos = await base44.functions.invoke("organizacao", { action: "dossie_asos", company_id: id }).then((r) => r.data).catch(() => null);
      setD({ emp, trabs: trabs.filter((t) => t.status !== "inativo"), riscos, programas, medicoes, matriz, treinos, entregas, mandatos, reunioes, inspecoes, acoes, psico, asos });
    })();
  }, [id]);

  const barra = (
    <div className="barra">
      <select value={id} onChange={(e) => setParams({ empresa: e.target.value })}>{empresas.map((e) => <option key={e.id} value={e.id}>{e.razao_social}</option>)}</select>
      <button onClick={() => window.print()}>Imprimir / Salvar em PDF</button>
    </div>
);
  if (!d) return <div style={{ background: "#e5e7eb", minHeight: "100vh" }}><style>{CSS}</style>{barra}<div style={{ padding: 40, color: "#5F6368" }}>Montando o dossiê…</div></div>;

  const h = hojeLocal();
  const prog = (t) => d.programas.find((p) => p.tipo === t);
  const docSit = (p) => (!p ? "no" : p.status !== "emitido" ? "at" : p.vigencia_ate && p.vigencia_ate < h ? "no" : p.vigencia_ate && p.vigencia_ate < addDias(h, 30) ? "at" : "ok");
  const revisados = d.riscos.filter((r) => r.revisado).length;
  const psicoRiscos = d.riscos.filter((r) => r.tipo === "psicossocial").length;
  const abertas = d.acoes.filter((a) => a.status !== "concluida"), atrasadas = abertas.filter((a) => a.prazo && a.prazo < h);
  const acoesRisco = d.riscos.flatMap((r) => r.plano_acao || []);
  const sitTrein = situacaoTreinamentos(d.trabs, d.matriz, d.treinos);
  const exig = sitTrein.reduce((n, s) => n + s.itens.length, 0), emDia = sitTrein.reduce((n, s) => n + s.itens.filter((i) => i.sit.k === "ok" || i.sit.k === "vence").length, 0);
  const epi = d.trabs.map((t) => situacaoEpiColaborador(t, d.riscos, d.entregas));
  const epiPend = epi.filter((x) => x.pendentes.length).length;
  const assinadas = d.entregas.filter((e) => e.assinatura_uri).length;
  const mandato = d.mandatos.find((m) => m.status === "vigente");
  const reunRealizadas = mandato ? d.reunioes.filter((r) => r.mandato_id === mandato.id && r.status === "realizada") : [];
  const semAta = reunRealizadas.filter((r) => !r.ata).length;
  const insp = d.inspecoes.filter((i) => i.status === "concluida");
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
  const pctTrein = pct(emDia, exig);
  const linha = (rotulo, sit, texto) => <tr><th>{rotulo}</th><td><span className={S[sit][1]}>{S[sit][0]}</span> — {texto}</td></tr>;

  const itens = [
    docSit(prog("pgr")), revisados === d.riscos.length && d.riscos.length ? "ok" : "at", psicoRiscos || d.psico.length ? "ok" : "no", atrasadas.length ? "no" : "ok",
    docSit(prog("pcmso")), d.asos ? (d.asos.pct_em_dia >= 95 ? "ok" : d.asos.pct_em_dia >= 80 ? "at" : "no") : "at", pctTrein === null ? "at" : pctTrein >= 95 ? "ok" : pctTrein >= 80 ? "at" : "no", epiPend ? "no" : "ok",
  ];
  const conformes = itens.filter((x) => x === "ok").length;

  return (
    <div style={{ background: "#e5e7eb", minHeight: "100vh" }}>
      <style>{CSS}</style>
      {barra}
      <div className="doc">
        <div className="topo"><img src={LOGO_SMARTSEG} alt="SmartSeg" /><div><h1>Dossiê de Conformidade em SST</h1><div>{d.emp.razao_social} · CNPJ {d.emp.cnpj || "—"} · CNAE {d.emp.cnae || "—"} · Grau de risco {d.emp.grau_de_risco || "—"}</div><div>Gerado em {dataBR(h)} · {d.trabs.length} colaboradores ativos</div></div></div>
        <div className="resumo">
          <div><b className={conformes === itens.length ? "ok" : conformes >= itens.length - 2 ? "at" : "no"}>{conformes}/{itens.length}</b>itens-chave conformes</div>
          <div><b className={atrasadas.length ? "no" : "ok"}>{atrasadas.length}</b>ações atrasadas</div>
          <div><b>{pctTrein === null ? "—" : pctTrein + "%"}</b>treinamentos em dia</div>
        </div>

        <h2>1. Gerenciamento de riscos — NR-1 (GRO/PGR)</h2>
        <table><tbody>
          {linha("PGR", docSit(prog("pgr")), prog("pgr") ? `${prog("pgr").status === "emitido" ? "emitido" : "em rascunho"}${prog("pgr").data_emissao ? " em " + dataBR(prog("pgr").data_emissao) : ""}${prog("pgr").vigencia_ate ? ", revisão até " + dataBR(prog("pgr").vigencia_ate) : ""}${prog("pgr").autenticacao_codigo ? " · código de autenticidade " + prog("pgr").autenticacao_codigo : ""}` : "não elaborado")}
          {linha("Inventário de riscos", d.riscos.length && revisados === d.riscos.length ? "ok" : "at", `${d.riscos.length} riscos identificados, ${revisados} revisados por profissional`)}
          {linha("Fatores de riscos psicossociais (obrigatório desde 26/05/2026)", psicoRiscos || d.psico.length ? "ok" : "no", d.psico.length ? `${d.psico.length} pesquisa(s) aplicada(s); ${psicoRiscos} risco(s) psicossocial(is) no inventário` : psicoRiscos ? `${psicoRiscos} risco(s) no inventário` : "não avaliados")}
          {linha("Plano de ação", atrasadas.length ? "no" : abertas.length ? "at" : "ok", `${acoesRisco.length} ações no inventário; ${abertas.length} abertas em inspeções/planos, ${atrasadas.length} atrasadas`)}
          {linha("Avaliações quantitativas (NR-9)", d.medicoes.length ? "ok" : "at", `${d.medicoes.length} medição(ões) registrada(s) com equipamento e critério (NR × NHO)`)}
        </tbody></table>

        <h2>2. Saúde ocupacional — NR-7 (PCMSO)</h2>
        <table><tbody>
          {linha("PCMSO", docSit(prog("pcmso")), prog("pcmso") ? `${prog("pcmso").status === "emitido" ? "emitido" : "em rascunho"}${prog("pcmso").medico_coordenador?.nome ? " · coordenador " + prog("pcmso").medico_coordenador.nome : ""}${prog("pcmso").vigencia_ate ? " · até " + dataBR(prog("pcmso").vigencia_ate) : ""}` : "não elaborado")}
          {d.asos ? linha("ASOs em dia", d.asos.pct_em_dia >= 95 ? "ok" : d.asos.pct_em_dia >= 80 ? "at" : "no", `${d.asos.em_dia} de ${d.asos.total} colaboradores com exame periódico em dia (${d.asos.pct_em_dia}%); ${d.asos.sem_aso} sem ASO registrado no sistema`) : linha("ASOs em dia", "at", "sem dados da clínica no sistema")}
        </tbody></table>

        <h2>3. Capacitação, EPI e CIPA</h2>
        <table><tbody>
          {linha("Treinamentos exigidos por cargo", pctTrein === null ? "at" : pctTrein >= 95 ? "ok" : pctTrein >= 80 ? "at" : "no", exig ? `${emDia} de ${exig} exigências em dia (${pctTrein}%)` : "matriz de treinamentos não definida")}
          {linha("EPI (NR-6)", epiPend ? "no" : "ok", `${epiPend} colaborador(es) com EPI exigido no PGR e não entregue; ${assinadas} entregas com assinatura do colaborador`)}
          {linha("CIPA / designado (NR-5)", mandato ? (semAta ? "at" : "ok") : "no", mandato ? `${mandato.tipo === "designado" ? "designado" : "CIPA"} com mandato até ${dataBR(mandato.fim)}; ${reunRealizadas.length} reunião(ões) realizada(s), ${semAta} sem ata` : "sem mandato vigente registrado")}
          {linha("Inspeções de segurança", insp.length ? "ok" : "at", insp.length ? `${insp.length} inspeção(ões); última em ${dataBR(insp[0].data)} com ${insp[0].conformidade_pct ?? "—"}% de conformidade` : "nenhuma inspeção registrada")}
        </tbody></table>

        <h2>4. Laudos</h2>
        <table><tbody>
          {["ltcat", "insalubridade", "periculosidade"].map((t) => <React.Fragment key={t}>{linha(DOCS[t], prog(t) ? docSit(prog(t)) : "at", prog(t) ? `${prog(t).status === "emitido" ? "emitido" : "em rascunho"}${prog(t).data_emissao ? " em " + dataBR(prog(t).data_emissao) : ""}${prog(t).autenticacao_codigo ? " · código " + prog(t).autenticacao_codigo : ""}` : "não elaborado (avaliar se aplicável)")}</React.Fragment>)}
        </tbody></table>

        <p style={{ fontSize: "8.5pt", color: "#444", marginTop: 12 }}>Este dossiê consolida as informações registradas no sistema na data de geração. Os documentos citados com código de autenticidade podem ser conferidos pelo QR Code impresso em cada um. Itens marcados como pendentes devem ser regularizados ou justificados pelo responsável técnico.</p>
      </div>
    </div>
);
}
