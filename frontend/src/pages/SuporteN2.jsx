import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { WORK, STATUS_META } from "@/lib/suporte";
import N2TicketDetail from "@/components/suporte/N2TicketDetail";
import { Headset, Filter } from "lucide-react";

export default function SuporteN2() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("escalated_n2");
  const [sel, setSel] = useState(null);

  const load = async () => {
    const res = await base44.entities.Ticket.filter({}).catch(() => []);
    setTickets((res || []).slice().sort((a, b) => (b.created_date || "").localeCompare(a.created_date || "")));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const lista = filtro === "all" ? tickets : tickets.filter((t) => t.status === filtro);
  const refreshSel = async () => {
    await load();
    if (sel) {
      const t = await base44.entities.Ticket.get(sel.id).catch(() => null);
      if (t) setSel(t);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="flex items-center gap-3 mb-5">
        <Headset size={22} style={{ color: WORK.accent }} />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>Painel Suporte N2</h1>
          <p className="text-sm" style={{ color: WORK.muted }}>Casos escalonados para análise humana.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} style={{ color: WORK.muted }} />
            <select value={filtro} onChange={(e) => { setFiltro(e.target.value); setSel(null); }} className="px-2 py-1.5 rounded-lg border text-sm" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
              <option value="escalated_n2">Escalonados N2</option>
              <option value="open">Abertos</option>
              <option value="analyzing">Analisando</option>
              <option value="resolved_ai">Resolvidos IA</option>
              <option value="resolved_n2">Resolvidos N2</option>
              <option value="all">Todos</option>
            </select>
          </div>
          {loading ? <p className="text-sm" style={{ color: WORK.muted }}>Carregando…</p> :
            lista.length === 0 ? <p className="text-sm py-4" style={{ color: WORK.muted }}>Nenhum ticket neste filtro.</p> : (
              <div className="space-y-2">
                {lista.map((t) => {
                  const m = STATUS_META[t.status] || { label: t.status, color: WORK.muted };
                  const active = sel?.id === t.id;
                  return (
                    <button key={t.id} onClick={() => setSel(t)} className="w-full text-left rounded-lg border p-3" style={{ background: active ? "rgba(11,111,168,0.06)" : WORK.surface, borderColor: active ? WORK.accent : WORK.border }}>
                      <p className="text-sm font-medium truncate" style={{ color: WORK.text }}>{t.subject}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs" style={{ color: WORK.muted }}>{t.protocol}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: m.color + "22", color: m.color }}>{m.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
        </div>
        <div className="lg:col-span-2">
          {sel ? <N2TicketDetail ticket={sel} onChanged={refreshSel} /> : (
            <div className="rounded-lg border p-8 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
              <p className="text-sm" style={{ color: WORK.muted }}>Selecione um ticket para detalhar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}