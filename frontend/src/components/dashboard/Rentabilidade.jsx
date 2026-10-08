import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { WORK } from "@/lib/sst";
import { brl, TIPO_SERVICO } from "@/lib/dashboardData";
import { BarChart3, Award } from "lucide-react";

function Bloco({ titulo, icon, children }) {
  const Icon = icon;
  return (
    <div className="rounded-xl border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} style={{ color: WORK.accent }} />
        <h3 className="text-sm font-semibold" style={{ color: WORK.text }}>{titulo}</h3>
      </div>
      {children}
    </div>
  );
}

export default function Rentabilidade({ porCategoria, ranking }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Bloco titulo="Receita x Custos x Margem por categoria" icon={BarChart3}>
        {porCategoria.length === 0 ? <p className="text-sm" style={{ color: WORK.muted }}>Sem dados no período.</p> : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={porCategoria} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={WORK.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: WORK.muted }} />
                <YAxis tick={{ fontSize: 11, fill: WORK.muted }} tickFormatter={(v) => "R$" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)} />
                <Tooltip formatter={(v) => brl(v)} contentStyle={{ borderRadius: 8, border: `1px solid ${WORK.border}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="receita" name="Receita" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="custo" name="Custo" fill="#F97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="margem" name="Margem" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Bloco>

      <Bloco titulo="Ranking de prestadores parceiros" icon={Award}>
        {ranking.length === 0 ? <p className="text-sm" style={{ color: WORK.muted }}>Sem prestadores com execuções no período.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs" style={{ color: WORK.muted, borderBottom: `1px solid ${WORK.border}` }}>
                  <th className="py-2 pr-2">Prestador</th>
                  <th className="py-2 px-2 text-center">Volume</th>
                  <th className="py-2 px-2 text-right">Custo</th>
                  <th className="py-2 px-2 text-right">Margem</th>
                  <th className="py-2 pl-2 text-right">Prazo méd.</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${WORK.border}` }}>
                    <td className="py-2 pr-2">
                      <span className="font-medium" style={{ color: WORK.text }}>{r.name}</span>
                      <span className="block text-[11px]" style={{ color: WORK.muted }}>{TIPO_SERVICO[r.serviceType] || r.serviceType}</span>
                    </td>
                    <td className="py-2 px-2 text-center" style={{ color: WORK.text }}>{r.volume}</td>
                    <td className="py-2 px-2 text-right" style={{ color: WORK.text }}>{brl(r.custo)}</td>
                    <td className="py-2 px-2 text-right" style={{ color: r.margem >= 0 ? "#22C55E" : "#EF4444" }}>{brl(r.margem)}</td>
                    <td className="py-2 pl-2 text-right text-xs" style={{ color: WORK.muted }}>{Math.round(r.prazoMedio)}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Bloco>
    </div>
  );
}