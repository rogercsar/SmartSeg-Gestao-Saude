import React from "react";
import { WORK, formatBRL } from "@/lib/finance";
import { AlertTriangle, CalendarClock, TrendingDown, CheckCircle2 } from "lucide-react";

export default function AlertasFin({ alertas }) {
  const items = [];
  (alertas?.contratosVenc || []).forEach((c) => items.push({
    icon: CalendarClock, color: "#F97316",
    text: `Contrato vencendo: ${c.nome} (${c.contrato.vigencia_fim || "—"})`,
  }));
  (alertas?.clientesNeg || []).forEach((c) => items.push({
    icon: TrendingDown, color: WORK.neg,
    text: `Margem negativa: ${c.nome} (${formatBRL(c.margem)})`,
  }));
  (alertas?.vencidos || []).slice(0, 6).forEach((l) => items.push({
    icon: AlertTriangle, color: "#DC2626",
    text: `Vencido: ${l.categoria} — ${formatBRL(l.valor)} (${l.data_vencimento})`,
  }));

  return (
    <div className="rounded-lg border" style={{ background: WORK.surface, borderColor: WORK.border }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: WORK.border }}>
        <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>Alertas</h3>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-5 text-sm" style={{ color: WORK.muted }}>
          <CheckCircle2 size={16} style={{ color: WORK.pos }} /> Tudo certo neste mês.
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: WORK.border }}>
          {items.map((it, i) => {
            const I = it.icon;
            return (
              <div key={i} className="flex items-start gap-2 px-4 py-2.5">
                <I size={15} style={{ color: it.color }} className="mt-0.5" />
                <span className="text-sm" style={{ color: WORK.text }}>{it.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}