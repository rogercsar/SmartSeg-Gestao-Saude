import React, { useState } from "react";
import { X, Loader2, Mail } from "lucide-react";

const WORK = { surface: "#FFFFFF", border: "#E3E8EE", accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368" };

// Modal para envio de um PDF de relatório por e-mail. onEnviar(email, mensagem) -> Promise.
export default function EmailModal({ aberto, titulo, emailPadrao, onEnviar, onFechar }) {
  const [para, setPara] = useState(emailPadrao || "");
  const [mensagem, setMensagem] = useState("Segue em anexo o relatório gerado pelo SmartSeg.");
  const [enviando, setEnviando] = useState(false);
  React.useEffect(() => { if (aberto) setPara(emailPadrao || ""); }, [aberto, emailPadrao]);
  if (!aberto) return null;
  const enviar = async () => {
    if (!para.trim()) return alert("Informe o destinatário.");
    setEnviando(true);
    try { await onEnviar(para.trim(), mensagem); onFechar(); }
    catch (e) { alert("Falha ao enviar: " + (e?.message || e)); }
    finally { setEnviando(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-xl border" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: WORK.border }}>
          <h3 className="font-semibold flex items-center gap-2" style={{ color: WORK.text }}><Mail size={16} /> Enviar relatório por e-mail</h3>
          <button onClick={onFechar} style={{ color: WORK.muted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm" style={{ color: WORK.muted }}>{titulo}</p>
          <label className="block">
            <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Destinatário (usuário do app)</span>
            <input className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: WORK.border, color: WORK.text }}
              value={para} onChange={(e) => setPara(e.target.value)} placeholder="email@exemplo.com" />
          </label>
          <label className="block">
            <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Mensagem</span>
            <textarea rows={3} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: WORK.border, color: WORK.text }}
              value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
          </label>
          <p className="text-[11px]" style={{ color: WORK.muted }}>O PDF será gerado agora e anexado à mensagem.</p>
        </div>
        <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderColor: WORK.border }}>
          <button onClick={onFechar} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: WORK.border, color: WORK.text }}>Cancelar</button>
          <button onClick={enviar} disabled={enviando} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50" style={{ background: WORK.accent, color: "#FFFFFF" }}>
            {enviando && <Loader2 size={14} className="animate-spin" />} Enviar PDF
          </button>
        </div>
      </div>
    </div>
);
}