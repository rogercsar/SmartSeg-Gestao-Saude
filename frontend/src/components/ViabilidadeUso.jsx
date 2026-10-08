import React, { useState } from "react";
import { WORK } from "@/lib/sst";
import { brl, num, PLANOS_USO } from "@/lib/precos";
import { Cartao } from "@/components/programas/ui";

// Simulador de viabilidade da cobrança pelo uso (só para o dono do produto)
export default function ViabilidadeUso() {
  const [v, setV] = useState({
    custo_fixo: 18000, custo_credito: 0.08, gateway_pct: 3.5, impostos_pct: 11.33,
    tecnico: 100, consultoria: 60, clinica: 20,
    extras_tecnico: 50, extras_consultoria: 300, extras_clinica: 200,
    uso_tecnico: 0.6, uso_consultoria: 0.8, uso_clinica: 0.7, asos_clinica: 600,
  });
  const n = (k) => Number(String(v[k]).replace(",", ".")) || 0;
  const campo = (k, l, passo = "1") => (
    <label key={k} className="text-[11px]" style={{ color: WORK.muted }}>{l}
      <input type="number" step={passo} value={v[k]} onChange={(e) => setV((x) => ({ ...x, [k]: e.target.value }))} className="block w-full mt-0.5 px-2 py-1.5 rounded border text-sm" style={{ borderColor: WORK.border, color: WORK.text }} />
    </label>
  );

  const linhas = ["tecnico", "consultoria", "clinica"].map((k) => {
    const p = PLANOS_USO[k];
    const clientes = n(k), extras = n("extras_" + k), aproveit = Math.min(1, n("uso_" + k));
    const asos = k === "clinica" ? n("asos_clinica") : 0;
    const receita = clientes * (p.base + extras * p.excedente + asos * p.aso);
    const creditosConsumidos = clientes * (p.creditos * aproveit + extras); // franquia usada + extras
    const custoIa = creditosConsumidos * n("custo_credito");
    return { k, nome: p.nome, clientes, receita, custoIa, porCliente: clientes ? receita / clientes : 0 };
  });
  const receita = linhas.reduce((s, l) => s + l.receita, 0);
  const custoIa = linhas.reduce((s, l) => s + l.custoIa, 0);
  const taxas = receita * (n("gateway_pct") + n("impostos_pct")) / 100;
  const margemContrib = receita - custoIa - taxas;
  const resultado = margemContrib - n("custo_fixo");
  const clientes = linhas.reduce((s, l) => s + l.clientes, 0);
  const mcCliente = clientes ? margemContrib / clientes : 0;
  const equilibrio = mcCliente > 0 ? Math.ceil(n("custo_fixo") / mcCliente) : null;

  return (
    <Cartao titulo="Viabilidade econômica — cobrança pelo uso" className="mt-4">
      <p className="text-xs mb-3" style={{ color: WORK.muted }}>Altere as premissas e veja o resultado mensal. Custo por crédito: use o valor real da tabela de uso de IA depois de 30 dias de operação (estimativa inicial: R$ 0,05 a 0,10).</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {campo("custo_fixo", "Custo fixo mensal (R$)", "100")}{campo("custo_credito", "Custo de IA por crédito (R$)", "0.01")}
        {campo("gateway_pct", "Taxa do gateway (%)", "0.1")}{campo("impostos_pct", "Impostos sobre receita (%)", "0.1")}
        {campo("tecnico", "Clientes Técnico")}{campo("consultoria", "Clientes Consultoria")}{campo("clinica", "Clientes Clínica")}{campo("asos_clinica", "ASOs por clínica/mês", "10")}
        {campo("extras_tecnico", "Créditos extras/mês (Técnico)", "10")}{campo("extras_consultoria", "Créditos extras/mês (Consultoria)", "10")}{campo("extras_clinica", "Créditos extras/mês (Clínica)", "10")}
        {campo("uso_consultoria", "Uso médio da franquia (0 a 1)", "0.1")}
      </div>
      <table className="w-full text-sm mb-3" style={{ color: WORK.text }}>
        <thead><tr className="text-xs" style={{ color: WORK.muted }}><th className="text-left p-2">Plano</th><th className="p-2 text-right">Clientes</th><th className="p-2 text-right">Ticket médio</th><th className="p-2 text-right">Receita</th><th className="p-2 text-right">Custo de IA</th></tr></thead>
        <tbody>{linhas.map((l) => <tr key={l.k} className="border-t" style={{ borderColor: WORK.border }}><td className="p-2">{l.nome}</td><td className="p-2 text-right">{num(l.clientes)}</td><td className="p-2 text-right">{brl(l.porCliente)}</td><td className="p-2 text-right">{brl(l.receita)}</td><td className="p-2 text-right">{brl(l.custoIa)}</td></tr>)}</tbody>
      </table>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div className="rounded-lg p-3" style={{ background: WORK.bg }}>Receita<br /><b>{brl(receita)}</b></div>
        <div className="rounded-lg p-3" style={{ background: WORK.bg }}>IA + taxas + impostos<br /><b>{brl(custoIa + taxas)}</b> <span className="text-xs" style={{ color: WORK.muted }}>({receita ? Math.round(((custoIa + taxas) / receita) * 100) : 0}%)</span></div>
        <div className="rounded-lg p-3" style={{ background: WORK.bg }}>Resultado após custo fixo<br /><b style={{ color: resultado >= 0 ? "#146C43" : "#B42318" }}>{brl(resultado)}</b></div>
        <div className="rounded-lg p-3" style={{ background: WORK.bg }}>Ponto de equilíbrio<br /><b>{equilibrio ? `${num(equilibrio)} clientes` : "—"}</b> <span className="text-xs" style={{ color: WORK.muted }}>no mix atual</span></div>
      </div>
    </Cartao>
  );
}
