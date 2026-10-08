import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { WORK } from "@/lib/sst";
import { brl } from "@/lib/dashboardData";
import { PieChart as PieIcon, AlertTriangle } from "lucide-react";

const CORES = ["#0B6FA8", "#22C55E", "#F97316", "#EAB308", "#8B5CF6"];

export default function Carteira({ carteira }) {
  const { top5, total, alertas } = carteira;
  return (
    <div className="rounded-xl border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
      <div className="flex items-center gap-2 mb-3">
        <PieIcon size={16} style={{ color: WORK.accent }} />
        <h3 className="text-sm font-semibold" style={{ color: WORK.text }}>Concentração de carteira — Top 5 clientes</h3>
      </div>
      {alertas.length > 0 && (
        <div className="rounded-lg p-2 mb-3 text-xs flex items-center gap-2" style={{ background: "#FEF3C7", color: "#92400E" }}>
          <AlertTriangle size={14} className="shrink-0" />
          <span>Concentração elevada: {alertas.map((c) => `${c.name} (${c.pct.toFixed(0)}%)`).join(", ")}. Diversifique a carteira para reduzir risco.</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div style={{ width: "100%", height: 220 }}>
          {top5.length === 0 ? <p className="text-sm" style={{ color: WORK.muted }}>Sem receita no período.</p> : (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={top5} dataKey="receita" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {top5.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => brl(v)} contentStyle={{ borderRadius: 8, border: `1px solid ${WORK.border}`, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="space-y-2">
          {top5.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CORES[i % CORES.length] }} />
              <span className="flex-1 text-sm truncate" style={{ color: WORK.text }}>{c.name}</span>
              <span className="text-sm font-medium" style={{ color: c.pct > 25 ? "#EF4444" : WORK.text }}>{c.pct.toFixed(1)}%</span>
              <span className="text-xs w-24 text-right" style={{ color: WORK.muted }}>{brl(c.receita)}</span>
            </div>
          ))}
          <div className="pt-2 border-t flex justify-between text-xs" style={{ borderColor: WORK.border, color: WORK.muted }}>
            <span>Receita total no período</span>
            <b style={{ color: WORK.text }}>{brl(total)}</b>
          </div>
        </div>
      </div>
    </div>
  );
}