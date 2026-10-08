import React from "react";
import { WORK, formatBRL, formatPct } from "@/lib/finance";
import { Wallet, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";

function Card({ titulo, valor, sub, icone: Icon, cor }) {
  return (
    <div className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: WORK.muted }}>{titulo}</span>
        <Icon size={16} style={{ color: cor }} />
      </div>
      <p className="text-xl font-bold" style={{ color: WORK.text }}>{valor}</p>
      {sub && <p className="text-xs mt-1" style={{ color: WORK.muted }}>{sub}</p>}
    </div>
  );
}

export default function DashboardCards({ d }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card titulo="Faturamento realizado" valor={formatBRL(d.receitaRealizada)}
        sub={`Previsto ${formatBRL(d.receitaPrevista)} · Pend. ${formatBRL(d.pendenteReceber)}`}
        icone={Wallet} cor={WORK.accent} />
      <Card titulo="Custos do mês" valor={formatBRL(d.totalCustos)}
        sub={`Pagos ${formatBRL(d.custosPagos)} · Folha ${formatBRL(d.folha)} · Pend. ${formatBRL(d.pendentePagar)}`}
        icone={ArrowDownRight} cor="#DC2626" />
      <Card titulo="Margem do mês" valor={formatBRL(d.margem)}
        sub={`${formatPct(d.margemPct)} sobre a receita`}
        icone={PiggyBank} cor={d.margem >= 0 ? WORK.pos : WORK.neg} />
      <Card titulo="Crescimento (vs mês ant.)" valor={formatPct(d.crescReceita)}
        sub={`Exames ${d.nExames} (${formatPct(d.crescExames)}) · Docs ${d.nDocs}`}
        icone={ArrowUpRight} cor={d.crescReceita >= 0 ? WORK.pos : WORK.neg} />
    </div>
  );
}