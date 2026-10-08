import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { WORK, formatData } from "@/lib/suporte";
import { Bot } from "lucide-react";

const AUTHOR = {
  customer: { label: "Cliente", color: "#64748B" },
  ai: { label: "IA (Gemini)", color: "#0B6FA8" },
  support_n2: { label: "Suporte N2", color: "#F97316" },
};

export default function TicketTimeline({ ticketId, showInternal = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await base44.entities.TicketInteraction.filter({ ticket_id: ticketId }).catch(() => []);
    setItems((res || []).slice().sort((a, b) => (a.created_date || "").localeCompare(b.created_date || "")));
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true); load();
    const unsub = base44.entities.TicketInteraction.subscribe(() => { load(); });
    return unsub;
  }, [ticketId]);

  const msgs = items.filter((i) => showInternal || !i.is_internal_note);

  if (loading) return <p className="text-sm" style={{ color: WORK.muted }}>Carregando…</p>;

  return (
    <div className="space-y-3">
      {msgs.length === 0 && <p className="text-sm" style={{ color: WORK.muted }}>Sem interações ainda.</p>}
      {msgs.map((m) => {
        const a = AUTHOR[m.author_type] || { label: "—", color: WORK.muted };
        return (
          <div key={m.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: a.color + "22", color: a.color }}>
              {m.author_type === "ai" ? <Bot size={15} /> : <span className="text-xs font-semibold">{a.label[0]}</span>}
            </div>
            <div className="flex-1 rounded-lg border p-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold" style={{ color: a.color }}>{a.label}</span>
                {m.is_internal_note && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#D97706" }}>Interno</span>}
                <span className="text-[10px] ml-auto" style={{ color: WORK.muted }}>{formatData(m.created_date)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap" style={{ color: WORK.text }}>{m.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}