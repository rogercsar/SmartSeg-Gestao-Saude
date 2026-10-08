import React from "react";
import { WORK, formatBRL } from "@/lib/finance";

export default function TopClientes({ topClientes }) {
  return (
    <div className="rounded-lg border" style={{ background: WORK.surface, borderColor: WORK.border }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: WORK.border }}>
        <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>Clientes por margem</h3>
      </div>
      <div className="px-4 py-2 grid grid-cols-3 gap-2 text-[11px] border-b" style={{ color: WORK.muted, borderColor: WORK.border }}>
        <span>Receita</span>
        <span className="text-right">Custos diretos</span>
        <span className="text-right">Margem</span>
      </div>
      {(!topClientes || topClientes.length === 0) ? (
        <p className="text-sm py-6 text-center" style={{ color: WORK.muted }}>Sem receita registrada no mês.</p>
      ) : (
        <div className="divide-y" style={{ borderColor: WORK.border }}>
          {topClientes.slice(0, 8).map((c) => (
            <div key={c.id} className="px-4 py-2.5">
              <p className="text-sm truncate mb-1" style={{ color: WORK.text }}>{c.nome}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span style={{ color: WORK.muted }}>{formatBRL(c.receita)}</span>
                <span className="text-right" style={{ color: WORK.muted }}>{formatBRL(c.custos)}</span>
                <span className="text-right font-medium" style={{ color: c.margem >= 0 ? WORK.pos : WORK.neg }}>{formatBRL(c.margem)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}