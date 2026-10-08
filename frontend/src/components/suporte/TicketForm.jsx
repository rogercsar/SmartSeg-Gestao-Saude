import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { WORK, gerarProtocolo } from "@/lib/suporte";
import { Botao, Campo, Modal } from "@/components/programas/ui";
import { Loader2 } from "lucide-react";
import AnexoUpload from "./AnexoUpload";

export default function TicketForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ customer_name: "", customer_email: "", customer_phone: "", subject: "", description: "", image_urls: [] });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.subject || !form.description) { alert("Preencha nome, assunto e descrição."); return; }
    setSaving(true); setStage("Abrindo chamado…");
    try {
      const protocol = gerarProtocolo();
      const ticket = await base44.entities.Ticket.create({ ...form, protocol, status: "open" });
      await base44.entities.TicketInteraction.create({ ticket_id: ticket.id, ticket_owner_id: ticket.created_by_id || (await base44.auth.me())?.id, author_type: "customer", message: form.description, is_internal_note: false });
      setStage("Analisando com a IA (Gemini)…");
      const resp = await base44.functions.invoke("diagnosticar-ticket", { ticket_id: ticket.id });
      onSaved(ticket, resp?.data);
    } catch (err) { alert(err.message); }
    setSaving(false); setStage("");
  };

  return (
    <Modal titulo="Abrir chamado de suporte" aberto onFechar={onClose} largura="max-w-2xl"
      rodape={<><Botao onClick={onClose}>Cancelar</Botao><Botao tipo="primario" onClick={submit} disabled={saving}>{saving ? stage : "Enviar e analisar"}</Botao></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Campo label="Nome *" valor={form.customer_name} onChange={(v) => set("customer_name", v)} />
        <Campo label="E-mail" valor={form.customer_email} onChange={(v) => set("customer_email", v)} />
        <Campo label="Telefone / contato" valor={form.customer_phone} onChange={(v) => set("customer_phone", v)} />
        <Campo label="Assunto *" valor={form.subject} onChange={(v) => set("subject", v)} />
        <div className="md:col-span-2"><Campo label="Descrição do problema *" tipo="textarea" linhas={4} valor={form.description} onChange={(v) => set("description", v)} /></div>
        <div className="md:col-span-2">
          <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Anexos (prints de tela)</span>
          <AnexoUpload value={form.image_urls} onChange={(urls) => set("image_urls", urls)} />
        </div>
      </div>
      {saving && <div className="flex items-center gap-2 mt-3 text-sm" style={{ color: WORK.accent }}><Loader2 size={14} className="animate-spin" /> {stage}</div>}
    </Modal>
  );
}