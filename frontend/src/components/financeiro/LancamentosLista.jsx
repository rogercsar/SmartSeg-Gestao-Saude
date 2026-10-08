import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { WORK, formatBRL, rangeMes, hoje } from "@/lib/finance";

export default function LancamentosLista({ mesAno, reloadKey }) {
  const [lancs, setLancs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { start, end } = rangeMes(mesAno);
    const res = await base44.entities.LancamentoFinanceiro.filter({ data_vencimento: { $gte: start, $lt: end } }).catch(() => []);
    const arr = (res || []).slice().sort((a, b) => (a.data_vencimento || "").localeCompare(b.data_vencimento || ""));
    setLancs(arr);
    setLoading(false);
  };
  useEffect(() => { load(); }, [mesAno, reloadKey]);

  const marcar = async (l) => {
    if (l.status === "pago") {
      await base44.entities.LancamentoFinanceiro.update(l.id, { status: "pendente", data_pagamento: null });
    } else {
      await base44.entities.LancamentoFinanceiro.update(l.id, { status: "pago", data_pagamento: hoje() });
    }
    load();
  };
  const excluir = async (l) => {
    if (!confirm("Excluir lançamento?")) return;
    await base44.entities.LancamentoFinanceiro.delete(l.id);
    load();
  };

  if (loading) return <p className="text-sm py-4" style={{ color: WORK.muted }}>Carregando lançamentos…</p>;

  return (
    <div className="rounded-lg border" style={{ background: WORK.surface, borderColor: WORK.border }}>
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: WORK.border }}>
        <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>Lançamentos do mês</h3>
        <span className="text-xs" style={{ color: WORK.muted }}>{lancs.length} registros</span>
      </div>
      {lancs.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: WORK.muted }}>Nenhum lançamento neste mês.</p>
      ) : (
        <div className="divide-y" style={{ borderColor: WORK.border }}>
          {lancs.map((l) => (
            <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: l.tipo === "receber" ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)", color: l.tipo === "receber" ? WORK.pos : WORK.neg }}>
                {l.tipo === "receber" ? "Receber" : "Pagar"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: WORK.text }}>{l.categoria}{l.descricao ? ` — ${l.descricao}` : ""}</p>
                <p className="text-xs" style={{ color: WORK.muted }}>
                  Venc. {l.data_vencimento}{l.data_pagamento ? ` · pago ${l.data_pagamento}` : ""}{l.recorrencia === "mensal" ? " · recorrente" : ""}
                </p>
              </div>
              <span className="text-sm font-medium" style={{ color: l.tipo === "receber" ? WORK.pos : WORK.neg }}>{formatBRL(l.valor)}</span>
              <button onClick={() => marcar(l)} className="text-xs px-2 py-1 rounded border"
                style={{ borderColor: WORK.border, color: l.status === "pago" ? WORK.muted : WORK.accent }}>
                {l.status === "pago" ? "Estornar" : "Pagar"}
              </button>
              <button onClick={() => excluir(l)} className="text-xs" style={{ color: WORK.muted }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}