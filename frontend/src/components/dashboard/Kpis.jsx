import React from "react";
import { WORK } from "@/lib/sst";
import { brl, pct } from "@/lib/dashboardData";
import { TrendingUp, TrendingDown, DollarSign, Receipt, Percent, AlertCircle, Ticket } from "lucide-react";

function Card({ icon, cor, label, valor, sub, destaque }) {
  const Icon = icon;
  return (
    <div className="rounded-xl border p-4" style={{ background: WORK.surface, borderColor: destaque ? cor + "66" : WORK.border, boxShadow: destaque ? `0 0 0 1px ${cor}33` : "none" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cor + "1A" }}><Icon size={16} style={{ color: cor }} /></div>
        <span className="text-xs font-medium" style={{ color: WORK.muted }}>{label}</span>
      </div>
      <div className="text-xl font-bold" style={{ color: WORK.text }}>{valor}</div>
      {sub && <div className="text-xs mt-1" style={{ color: WORK.muted }}>{sub}</div>}
    </div>
  );
}

export default function Kpis({ kpis, ticketCat }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card icon={DollarSign} cor="#22C55E" label="Receita bruta" valor={brl(kpis.revenue)} sub={`${kpis.totalExecucoes} execuções concluídas`} />
        <Card icon={Receipt} cor="#F97316" label="Custo de prestadores" valor={brl(kpis.cost)} sub={`${kpis.revenue > 0 ? pct(kpis.cost / kpis.revenue * 100) : "0%"} da receita`} />
        <Card icon={kpis.margin >= 0 ? TrendingUp : TrendingDown} cor={kpis.margin >= 0 ? "#0EA5E9" : "#EF4444"} label="Margem de contribuição" valor={brl(kpis.margin)} sub={`${pct(kpis.marginPct)} de lucro`} destaque />
        <Card icon={Percent} cor="#8B5CF6" label="Ticket médio global" valor={brl(kpis.avgTicket)} sub="por execução concluída" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card icon={AlertCircle} cor="#EF4444" label="Taxa de no-show" valor={pct(kpis.noShowRate)} sub="agendamentos não realizados" />
        {ticketCat.map((c) => (
          <Card key={c.id} icon={Ticket} cor="#0B6FA8" label={`Ticket · ${c.name}`} valor={brl(c.ticket)} sub={`${c.count} concluída(s)`} />
        )).slice(0, 3)}
      </div>
    </div>
  );
}