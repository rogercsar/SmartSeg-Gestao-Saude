import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { WORK, STATUS_META, formatData, resolverAnexos } from "@/lib/suporte";
import { Botao, Campo } from "@/components/programas/ui";
import { ZoomIn, X } from "lucide-react";
import TicketTimeline from "./TicketTimeline";

function Dado({ label, valor }) {
  return (
    <div>
      <span className="text-xs" style={{ color: WORK.muted }}>{label}:</span>
      <p className="text-sm break-words" style={{ color: WORK.text }}>{valor || "—"}</p>
    </div>
  );
}

export default function N2TicketDetail({ ticket, onChanged }) {
  const [diag, setDiag] = useState(null);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [zoom, setZoom] = useState(null);
  const [imgsUrls, setImgsUrls] = useState([]);

  useEffect(() => {
    base44.entities.AiDiagnostico.filter({ ticket_id: ticket.id }).then((res) => {
      const arr = (res || []).slice().sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));
      setDiag(arr[0] || null);
    });
  }, [ticket.id]);

  useEffect(() => {
    let alive = true;
    resolverAnexos(imgs).then((u) => { if (alive) setImgsUrls(u); });
    return () => { alive = false; };
  }, [ticket.id, imgs.length]);

  const enviar = async () => {
    if (!reply.trim()) return;
    await base44.entities.TicketInteraction.create({ ticket_id: ticket.id, ticket_owner_id: ticket.created_by_id || "", author_type: "support_n2", message: reply.trim(), is_internal_note: internal });
    setReply("");
    onChanged();
  };
  const mudarStatus = async (s) => {
    await base44.entities.Ticket.update(ticket.id, { status: s });
    onChanged();
  };

  const imgs = Array.isArray(ticket.image_urls) ? ticket.image_urls : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: WORK.muted }}>Protocolo</span>
            <span className="text-sm font-semibold" style={{ color: WORK.accent }}>{ticket.protocol}</span>
          </div>
          <h3 className="font-semibold mb-1" style={{ color: WORK.text }}>{ticket.subject}</h3>
          <p className="text-xs mb-3" style={{ color: WORK.muted }}>{ticket.customer_name} · {ticket.customer_email || ticket.customer_phone || "—"} · {formatData(ticket.created_date)}</p>
          <p className="text-sm whitespace-pre-wrap" style={{ color: WORK.text }}>{ticket.description}</p>
        </div>
        <div className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <p className="text-xs mb-2" style={{ color: WORK.muted }}>Anexos ({imgs.length})</p>
          {imgs.length === 0 ? <p className="text-sm" style={{ color: WORK.muted }}>Sem anexos.</p> : (
            <div className="grid grid-cols-3 gap-2">
              {imgsUrls.map((u, i) => (
                <button key={i} onClick={() => setZoom(u)} className="relative group rounded-md overflow-hidden border" style={{ borderColor: WORK.border }}>
                  <img src={u} alt="print" className="w-full h-24 object-cover" />
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center"><ZoomIn size={16} className="opacity-0 group-hover:opacity-100 text-white" /></span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <p className="text-xs mb-2" style={{ color: WORK.muted }}>Responder / alterar status</p>
          <Campo label="Resposta" tipo="textarea" linhas={3} valor={reply} onChange={setReply} />
          <label className="flex items-center gap-2 text-xs mt-2" style={{ color: WORK.text }}>
            <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Nota interna (não visível ao cliente)
          </label>
          <div className="flex flex-wrap gap-2 mt-3">
            <Botao tipo="primario" onClick={enviar}>Enviar</Botao>
            <select value={ticket.status} onChange={(e) => mudarStatus(e.target.value)} className="px-2 py-2 rounded-lg border text-sm" style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}>
              {Object.keys(STATUS_META).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: WORK.text }}>Dossiê técnico (IA)</h3>
          {!diag ? <p className="text-sm" style={{ color: WORK.muted }}>Sem diagnóstico IA registrado.</p> : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: WORK.muted }}>Categoria:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: WORK.warn + "22", color: WORK.warn }}>{diag.error_category}</span>
              </div>
              <Dado label="Texto OCR" valor={diag.extracted_text_ocr} />
              <Dado label="IDs / protocolos" valor={diag.extracted_ids ? JSON.stringify(diag.extracted_ids) : "—"} />
              <Dado label="Ação tentada" valor={diag.action_triggered} />
              <Dado label="Resolução tentada" valor={diag.resolution_attempted ? "Sim" : "Não"} />
              {diag.failure_reason && <Dado label="Motivo de falha" valor={diag.failure_reason} />}
            </div>
          )}
        </div>
        <div className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: WORK.text }}>Timeline</h3>
          <TicketTimeline ticketId={ticket.id} showInternal={true} />
        </div>
      </div>

      {zoom && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => setZoom(null)}>
          <X className="absolute top-4 right-4 text-white" size={24} />
          <img src={zoom} alt="zoom" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}