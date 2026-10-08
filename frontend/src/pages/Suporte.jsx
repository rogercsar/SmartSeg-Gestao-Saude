import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { WORK, STATUS_META, formatData } from "@/lib/suporte";
import TicketForm from "@/components/suporte/TicketForm";
import TicketTimeline from "@/components/suporte/TicketTimeline";
import { Plus, ArrowLeft, LifeBuoy } from "lucide-react";

export default function Suporte() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sel, setSel] = useState(null);

  const load = async () => {
    const me = await base44.auth.me().catch(() => null);
    const res = await base44.entities.Ticket.filter({ created_by_id: me?.id }).catch(() => []);
    setTickets((res || []).slice().sort((a, b) => (b.created_date || "").localeCompare(a.created_date || "")));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (sel) {
    const meta = STATUS_META[sel.status] || { label: sel.status, color: WORK.muted };
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <button onClick={() => { setSel(null); load(); }} className="flex items-center gap-1 text-sm mb-4" style={{ color: WORK.muted }}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="rounded-lg border p-5 mb-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold" style={{ color: WORK.text }}>{sel.subject}</h1>
              <p className="text-xs" style={{ color: WORK.muted }}>Protocolo {sel.protocol} · {formatData(sel.created_date)}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: meta.color + "22", color: meta.color }}>{meta.label}</span>
          </div>
        </div>
        <div className="rounded-lg border p-5" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: WORK.text }}>Acompanhamento</h3>
          <TicketTimeline ticketId={sel.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>Suporte Inteligente</h1>
          <p className="text-sm" style={{ color: WORK.muted }}>Triagem visual com IA e transbordo seguro para N2.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: WORK.accent, color: "#fff" }}>
          <Plus size={16} /> Abrir chamado
        </button>
      </header>

      {loading ? <p className="text-sm" style={{ color: WORK.muted }}>Carregando…</p> :
        tickets.length === 0 ? (
          <div className="rounded-lg border p-8 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <LifeBuoy size={28} className="mx-auto mb-2" style={{ color: WORK.accent }} />
            <p className="text-sm" style={{ color: WORK.muted }}>Nenhum chamado aberto ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => {
              const m = STATUS_META[t.status] || { label: t.status, color: WORK.muted };
              return (
                <button key={t.id} onClick={() => setSel(t)} className="w-full text-left rounded-lg border p-4 flex items-center gap-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: WORK.text }}>{t.subject}</p>
                    <p className="text-xs" style={{ color: WORK.muted }}>{t.protocol} · {formatData(t.created_date)}</p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: m.color + "22", color: m.color }}>{m.label}</span>
                </button>
              );
            })}
          </div>
        )}

      {showForm && <TicketForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}