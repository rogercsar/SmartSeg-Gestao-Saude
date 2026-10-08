import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Printer, Save, RotateCcw } from "lucide-react";
import { WORK } from "@/lib/sst";
import { simularFap, calcularFap, percentilOrdem, CENARIOS } from "@/lib/fap";
import { Botao, Campo, Cartao, Etiqueta } from "@/components/programas/ui";

export const brl = (v) => (v === null || v === undefined || isNaN(v) ? "—" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }));
export const f4 = (v) => (v === null || v === undefined || isNaN(v) ? "—" : Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }));
export const pct = (v, d = 2) => (v === null || v === undefined || isNaN(v) ? "—" : `${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d })}%`);

export function padraoSimulacao(empresa) {
  const s = empresa.fap_simulacao || {};
  const atual = s.atual || { pg: 50, pf: 50, pc: 50, trava_morte: false, rotatividade: 0 };
  return {
    atual,
    cenario: s.cenario || { ...atual },
    rat: s.rat ?? empresa.rat ?? 3,
    folha_anual: s.folha_anual ?? (empresa.folha_mensal ? Math.round(empresa.folha_mensal * 13.33) : ""),
  };
}

function Slider({ label, valor, onChange, ajuda }) {
  return (
    <label className="block">
      <div className="flex justify-between text-xs mb-1" style={{ color: WORK.muted }}><span>{label}</span><b style={{ color: WORK.text }}>{Number(valor || 0).toFixed(1)}</b></div>
      <input type="range" min={0} max={100} step={0.5} value={valor || 0} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-orange-500" />
      {ajuda && <span className="text-[10px]" style={{ color: WORK.muted }}>{ajuda}</span>}
    </label>
  );
}

function CalcPercentil({ onUsar }) {
  const [o, setO] = useState({ ordem: "", total: "" });
  const p = percentilOrdem(o.ordem, o.total);
  return (
    <details className="text-xs" style={{ color: WORK.muted }}>
      <summary className="cursor-pointer">O extrato mostra nº de ordem e total de empresas? Calcule o percentil</summary>
      <div className="flex flex-wrap items-end gap-2 mt-2">
        <Campo label="Nº de ordem" tipo="number" valor={o.ordem} onChange={(v) => setO({ ...o, ordem: v })} />
        <Campo label="Total na subclasse CNAE" tipo="number" valor={o.total} onChange={(v) => setO({ ...o, total: v })} />
        <span className="pb-2" style={{ color: WORK.text }}>= {p.toFixed(2)}</span>
        {["pg", "pf", "pc"].map((k) => <Botao key={k} onClick={() => onUsar(k, Number(p.toFixed(4)))}>usar em {{ pg: "gravidade", pf: "frequência", pc: "custo" }[k]}</Botao>)}
      </div>
    </details>
  );
}

export default function SimuladorFap({ d, recarregar }) {
  const [sim, setSim] = useState(() => padraoSimulacao(d.empresa));
  const [salvando, setSalvando] = useState(false);
  const setAtual = (k, v) => setSim((s) => ({ ...s, atual: { ...s.atual, [k]: v } }));
  const setCen = (k, v) => setSim((s) => ({ ...s, cenario: { ...s.cenario, [k]: v } }));
  const r = useMemo(() => simularFap(sim), [sim]);
  const fapInformado = Number(d.empresa.fap) || null;
  const divergente = fapInformado && Math.abs(calcularFap(sim.atual).fap - fapInformado) > 0.0005;

  const salvar = async () => {
    setSalvando(true);
    try {
      await base44.entities.Company.update(d.empresa.id, { fap_simulacao: { ...sim, atualizado_em: new Date().toISOString() }, rat: Number(sim.rat) || null });
      recarregar();
    } finally { setSalvando(false); }
  };

  const cards = [
    ["Índice FAP", `${f4(r.atual.fap)} → ${f4(r.simulado.fap)}`, `IC ${f4(r.atual.ic)} → ${f4(r.simulado.ic)} · ${r.simulado.faixa}${r.simulado.travado ? ` (trava: ${r.simulado.motivo_trava})` : ""}`],
    ["GILRAT ajustado", `${pct(r.atual.rat_ajustado, 4)} → ${pct(r.simulado.rat_ajustado, 4)}`, `RAT ${sim.rat}% × FAP`],
    ["Contribuição RAT atual", brl(r.atual.valor), "por ano"],
    ["Contribuição RAT simulada", brl(r.simulado.valor), `${r.reducao_pct >= 0 ? "−" : "+"}${pct(Math.abs(r.reducao_pct), 1)} em relação à atual`],
    ["Contribuição mínima possível", brl(r.minimo.valor), r.minimo.limitado_por_trava ? "FAP 1,0000 (limitada por trava)" : "FAP 0,5000"],
    ["Possível economia anual", brl(r.economia_simulada), `até ${brl(r.economia_maxima)} no cenário mínimo`],
  ];
  const maxBar = Math.max(r.atual.valor, r.simulado.valor, r.minimo.valor, 1);

  return (
    <div className="space-y-4">
      <Cartao titulo="1. Situação atual (dados do extrato do FAP)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <Slider label="Percentil de gravidade (peso 50%)" valor={sim.atual.pg} onChange={(v) => setAtual("pg", v)} />
          <Slider label="Percentil de frequência (peso 35%)" valor={sim.atual.pf} onChange={(v) => setAtual("pf", v)} />
          <Slider label="Percentil de custo (peso 15%)" valor={sim.atual.pc} onChange={(v) => setAtual("pc", v)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
          <Campo label="RAT (%)" tipo="select" opcoes={{ 1: "1%", 2: "2%", 3: "3%" }} valor={String(sim.rat || "")} onChange={(v) => setSim((s) => ({ ...s, rat: Number(v) || 0 }))} />
          <Campo label="Folha anual (base, R$)" tipo="number" valor={sim.folha_anual} onChange={(v) => setSim((s) => ({ ...s, folha_anual: v }))} />
          <Campo label="Rotatividade média (%)" tipo="number" valor={sim.atual.rotatividade} onChange={(v) => setAtual("rotatividade", v)} />
          <Campo tipo="checkbox" label="Teve morte/invalidez (não trajeto)" valor={sim.atual.trava_morte} onChange={(v) => setAtual("trava_morte", v)} />
        </div>
        <div className="mt-3"><CalcPercentil onUsar={setAtual} /></div>
        <p className="text-xs mt-3" style={{ color: WORK.text }}>
          FAP calculado: <b>{f4(r.atual.fap)}</b> ({r.atual.faixa}{r.atual.travado ? `, trava por ${r.atual.motivo_trava}` : ""})
          {fapInformado ? <> · FAP informado na aba: <b>{f4(fapInformado)}</b></> : null}
        </p>
        {divergente && <p className="text-xs mt-1" style={{ color: "#EAB308" }}>O FAP calculado difere do informado — confira os percentis no extrato (o FAP oficial é arredondado e pode ter sido revisto em contestação).</p>}
        <p className="text-[11px] mt-1" style={{ color: WORK.muted }}>Folha anual sugerida = folha mensal × 13,33 (12 meses + 13º + 1/3 de férias). Ajuste se necessário.</p>
      </Cartao>

      <Cartao titulo="2. Cenário simulado" acoes={<Botao onClick={() => setSim((s) => ({ ...s, cenario: { ...s.atual } }))}><RotateCcw size={14} /> Igualar ao atual</Botao>}>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(CENARIOS).map(([k, c]) => <Botao key={k} onClick={() => setSim((s) => ({ ...s, cenario: c.fn(s.atual) }))}>{c.label}</Botao>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <Slider label="Gravidade" valor={sim.cenario.pg} onChange={(v) => setCen("pg", v)} ajuda="B91 0,10 · B92 0,30 · B93 0,50 · B94 0,10" />
          <Slider label="Frequência" valor={sim.cenario.pf} onChange={(v) => setCen("pf", v)} ajuda="CATs + benefícios acidentários sem CAT (sem trajeto)" />
          <Slider label="Custo" valor={sim.cenario.pc} onChange={(v) => setCen("pc", v)} ajuda="valor pago pelo INSS nos benefícios" />
        </div>
        <div className="grid grid-cols-2 gap-2 items-end">
          <Campo label="Rotatividade no cenário (%)" tipo="number" valor={sim.cenario.rotatividade} onChange={(v) => setCen("rotatividade", v)} />
          <Campo tipo="checkbox" label="Trava por morte/invalidez" valor={sim.cenario.trava_morte} onChange={(v) => setCen("trava_morte", v)} />
        </div>
      </Cartao>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {cards.map(([l, v, s], i) => (
          <div key={l} className="rounded-lg border p-3" style={{ background: WORK.surface, borderColor: i === 5 ? "#22C55E" : WORK.border }}>
            <p className="text-xs" style={{ color: WORK.muted }}>{l}</p>
            <p className="text-lg font-bold" style={{ color: i === 5 ? (r.economia_simulada >= 0 ? "#22C55E" : "#EF4444") : WORK.text }}>{v}</p>
            <p className="text-[11px]" style={{ color: WORK.muted }}>{s}</p>
          </div>
        ))}
      </div>

      <Cartao titulo="Comparativo anual">
        {[["Atual", r.atual.valor, "#EF4444"], ["Simulado", r.simulado.valor, WORK.accent], ["Mínimo possível", r.minimo.valor, "#22C55E"]].map(([l, v, c]) => (
          <div key={l} className="mb-2">
            <div className="flex justify-between text-xs" style={{ color: WORK.text }}><span>{l}</span><b>{brl(v)}</b></div>
            <div className="h-3 rounded mt-1" style={{ background: WORK.bg }}><div className="h-full rounded" style={{ width: `${(v / maxBar) * 100}%`, background: c }} /></div>
          </div>
        ))}
        {!Number(sim.folha_anual) && <p className="text-xs" style={{ color: "#EAB308" }}>Informe a folha anual para ver os valores em reais.</p>}
      </Cartao>

      <div className="flex flex-wrap gap-2 justify-end">
        <Botao onClick={salvar} carregando={salvando}><Save size={14} /> Salvar simulação</Botao>
        <Botao tipo="primario" onClick={async () => { const w = window.open("about:blank", "_blank"); await salvar(); const url = `/atestados/fap-simulacao?empresa=${d.empresa.id}`; if (w) w.location.href = url; else window.location.href = url; }}><Printer size={14} /> Apresentação para o cliente (PDF)</Botao>
      </div>
      <p className="text-[11px]" style={{ color: WORK.muted }}>
        Metodologia da Resolução CNP nº 1.329/2017: IC = (0,50 × percentil gravidade + 0,35 × frequência + 0,15 × custo) × 0,02; bônus: FAP = 0,5 + 0,5 × IC; malus: FAP = IC.
        Os percentis são posições relativas às demais empresas da mesma subclasse CNAE — reduzir eventos baixa o percentil, mas o valor exato depende do desempenho do setor. <Etiqueta cor={WORK.muted}>simulação</Etiqueta>
      </p>
    </div>
  );
}
