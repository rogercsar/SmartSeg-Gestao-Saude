import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { simularFap } from "@/lib/fap";
import { padraoSimulacao, brl, f4, pct } from "@/components/atestados/SimuladorFap";

const CSS = `
@page { size: A4; margin: 16mm 14mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.doc { background:#fff; color:#111; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; max-width: 190mm; margin: 0 auto; padding: 18px; }
.doc h1 { font-size: 20pt; margin: 0 } .doc h2 { font-size: 13pt; margin: 22px 0 8px; border-bottom: 3px solid #0B6FA8; padding-bottom: 3px }
.sub { color: #555; margin: 4px 0 16px } .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px }
.card { border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px } .card small { color: #666; display: block } .card b { font-size: 17pt; display: block; margin-top: 2px }
.destaque { border: 2px solid #16a34a; background: #f0fdf4 } .destaque b { color: #15803d; font-size: 22pt }
table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 6px } th, td { border: 1px solid #ccc; padding: 5px 7px; text-align: left } th { background: #f3f4f6 }
.bar { height: 16px; border-radius: 4px } .nota { font-size: 8.5pt; color: #555; margin-top: 18px; text-align: justify }
.barra { position: sticky; top: 0; background: #EAF4F8; border-bottom: 1px solid #E3E8EE; padding: 10px; display: flex; justify-content: center; z-index: 5 }
.barra button { background: #0B6FA8; color: #FFFFFF; border: 0; padding: 8px 16px; border-radius: 8px; font-weight: 700 }
@media print { .barra { display: none } .doc { padding: 0 } }
`;

export default function ImprimirSimulacaoFap() {
  const [params] = useSearchParams();
  const [empresa, setEmpresa] = useState(null);
  useEffect(() => { base44.entities.Company.get(params.get("empresa")).then(setEmpresa).catch(() => setEmpresa(false)); }, [params]);
  if (empresa === false) return <div style={{ padding: 40 }}>Empresa não encontrada.</div>;
  if (!empresa) return <div style={{ padding: 40, color: "#94A3B8" }}>Gerando apresentação…</div>;

  const sim = padraoSimulacao(empresa);
  const r = simularFap(sim);
  const max = Math.max(r.atual.valor, r.simulado.valor, r.minimo.valor, 1);
  const linha = (l, a, s) => <tr><td>{l}</td><td>{a}</td><td>{s}</td></tr>;

  return (
    <div style={{ background: "#e5e7eb", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div className="barra"><button onClick={() => window.print()}>Imprimir / Salvar em PDF</button></div>
      <div className="doc">
        <h1>Simulação do FAP e da contribuição GILRAT</h1>
        <p className="sub"><b>{empresa.razao_social}</b> — CNPJ {empresa.cnpj || "—"} — CNAE {empresa.cnae || "—"} · RAT {sim.rat}% · Folha anual considerada {brl(Number(sim.folha_anual))}</p>

        <div className="grid">
          <div className="card"><small>Índice FAP</small><b>{f4(r.atual.fap)} → {f4(r.simulado.fap)}</b><small>{r.atual.faixa} → {r.simulado.faixa}</small></div>
          <div className="card"><small>GILRAT ajustado (RAT × FAP)</small><b>{pct(r.atual.rat_ajustado, 4)} → {pct(r.simulado.rat_ajustado, 4)}</b></div>
          <div className="card"><small>Contribuição RAT atual (ano)</small><b>{brl(r.atual.valor)}</b></div>
          <div className="card"><small>Contribuição RAT simulada (ano)</small><b>{brl(r.simulado.valor)}</b></div>
          <div className="card"><small>Contribuição mínima possível (ano)</small><b>{brl(r.minimo.valor)}</b><small>{r.minimo.limitado_por_trava ? "FAP 1,0000 — limitada por trava" : "FAP 0,5000"}</small></div>
          <div className="card destaque"><small>Possível economia anual</small><b>{brl(r.economia_simulada)}</b><small>até {brl(r.economia_maxima)} no cenário mínimo</small></div>
        </div>

        <h2>Comparativo</h2>
        {[["Atual", r.atual.valor, "#dc2626"], ["Simulado", r.simulado.valor, "#108EAA"], ["Mínimo possível", r.minimo.valor, "#16a34a"]].map(([l, v, c]) => (
          <div key={l} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt" }}><span>{l}</span><b>{brl(v)}</b></div>
            <div className="bar" style={{ width: `${(v / max) * 100}%`, background: c }} />
          </div>
        ))}

        <h2>Insumos</h2>
        <table><thead><tr><th>Item</th><th>Atual</th><th>Simulado</th></tr></thead><tbody>
          {linha("Percentil de gravidade (peso 50%)", sim.atual.pg, sim.cenario.pg)}
          {linha("Percentil de frequência (peso 35%)", sim.atual.pf, sim.cenario.pf)}
          {linha("Percentil de custo (peso 15%)", sim.atual.pc, sim.cenario.pc)}
          {linha("Índice composto (IC)", f4(r.atual.ic), f4(r.simulado.ic))}
          {linha("Rotatividade média", pct(Number(sim.atual.rotatividade) || 0, 1), pct(Number(sim.cenario.rotatividade) || 0, 1))}
          {linha("Morte/invalidez no período", sim.atual.trava_morte ? "Sim" : "Não", sim.cenario.trava_morte ? "Sim" : "Não")}
        </tbody></table>

        <h2>Como reduzir o FAP</h2>
        <ul>
          <li>Prevenir afastamentos acidentários acima de 15 dias (B91), que pesam na frequência, gravidade e custo.</li>
          <li>Registrar corretamente acidentes de trajeto, que são excluídos do cálculo.</li>
          <li>Contestar nexos técnicos epidemiológicos (NTEP) indevidos com base no PGR, no PCMSO e nos laudos.</li>
          <li>Conferir o extrato anual do FAP e contestar erros no prazo administrativo.</li>
          <li>Controlar a rotatividade e prevenir eventos graves, que bloqueiam a bonificação.</li>
        </ul>

        <p className="nota">Metodologia conforme a Resolução CNP nº 1.329/2017: IC = (0,50 × percentil de gravidade + 0,35 × percentil de frequência + 0,15 × percentil de custo) × 0,02; FAP = 0,5 + 0,5 × IC na faixa de bônus e FAP = IC na faixa de malus; empresas com morte ou invalidez permanente (exceto trajeto) ou rotatividade acima de 75% não recebem bônus. Contribuição = folha × RAT × FAP. Os percentis são relativos às demais empresas da mesma subclasse CNAE; a simulação é estimativa e o FAP oficial é o publicado pela Previdência. Emitido em {new Date().toLocaleDateString("pt-BR")}.</p>
      </div>
    </div>
  );
}
