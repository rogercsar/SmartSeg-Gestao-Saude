import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { WORK } from "@/lib/sst";
import { brl } from "@/lib/dashboardData";
import { Wallet, Clock, ArrowRightLeft } from "lucide-react";

const FAIXAS = [
  { key: "emDia", label: "A vencer / em dia", cor: "#22C55E" },
  { key: "a30", label: "1 a 30 dias", cor: "#EAB308" },
  { key: "a60", label: "31 a 60 dias", cor: "#F97316" },
  { key: "mais60", label: "+60 dias (crítico)", cor: "#EF4444" },
];

export default function Caixa({ caixa }) {
  const data = FAIXAS.map((f) => ({ name: f.label, valor: caixa.aging[f.key], cor: f.cor }));
  const descompasso = caixa.dso - caixa.dpo;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="rounded-xl border p-4 lg:col-span-2" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={16} style={{ color: WORK.accent }} />
          <h3 className="text-sm font-semibold" style={{ color: WORK.text }}>Contas a receber — Aging list</h3>
        </div>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={WORK.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: WORK.muted }} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: WORK.muted }} tickFormatter={(v) => "R$" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)} />
              <Tooltip formatter={(v) => brl(v)} contentStyle={{ borderRadius: 8, border: `1px solid ${WORK.border}`, fontSize: 12 }} />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                {data.map((d, i) => <Cell key={i} fill={d.cor} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {FAIXAS.map((f) => (
            <span key={f.key} className="text-xs flex items-center gap-1" style={{ color: WORK.muted }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: f.cor }} /> {f.label}: <b style={{ color: WORK.text }}>{brl(caixa.aging[f.key])}</b>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} style={{ color: WORK.accent }} />
            <h3 className="text-sm font-semibold" style={{ color: WORK.text }}>Descompasso de prazos</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs" style={{ color: WORK.muted }}>DSO (recebimento)</div>
              <div className="text-lg font-bold" style={{ color: WORK.text }}>{Math.round(caixa.dso)} dias</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: WORK.muted }}>DPO (repasse)</div>
              <div className="text-lg font-bold" style={{ color: WORK.text }}>{Math.round(caixa.dpo)} dias</div>
            </div>
          </div>
          <div className="mt-3 rounded-lg p-2 text-xs flex items-start gap-2" style={{ background: (descompasso > 0 ? "#FEF3C7" : "#DCFCE7"), color: descompasso > 0 ? "#92400E" : "#166534" }}>
            <ArrowRightLeft size={14} className="mt-0.5 shrink-0" />
            <span>{descompasso > 0 ? `Você recebe em média ${Math.round(descompasso)} dia(s) depois de repassar ao prestador — risco de caixa.` : `Você repassa em média ${Math.round(-descompasso)} dia(s) depois de receber — folga de caixa.`}</span>
          </div>
        </div>
        <div className="rounded-xl border p-4 grid grid-cols-2 gap-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <div>
            <div className="text-xs" style={{ color: WORK.muted }}>Total a receber</div>
            <div className="text-lg font-bold" style={{ color: "#22C55E" }}>{brl(caixa.totalReceber)}</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: WORK.muted }}>Total a pagar</div>
            <div className="text-lg font-bold" style={{ color: "#F97316" }}>{brl(caixa.totalPagar)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}