import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Upload, ExternalLink } from "lucide-react";
import { WORK } from "@/lib/sst";
import { TIPOS_DOC_TERCEIRO } from "@/lib/terceiros";
import { uploadPrivado, linkTemporario } from "@/lib/privateFiles";

export default function DocumentoTerceiroForm({ aberto, empresaId, terceiraId, doc, onFechar, onSalvar }) {
  const [form, setForm] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (aberto) {
      setForm(doc ? { ...doc } : { terceira_id: terceiraId, company_id: empresaId, tipo: "contrato" });
      setPreviewUrl("");
      if (doc?.file_uri) linkTemporario(doc.file_uri).then(setPreviewUrl).catch(() => {});
    }
  }, [aberto, doc, terceiraId, empresaId]);

  if (!aberto) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const enviarArquivo = async (file) => {
    if (!file) return;
    setEnviando(true);
    try {
      const { file_uri, signed_url } = await uploadPrivado(file);
      setForm((f) => ({ ...f, file_uri }));
      setPreviewUrl(signed_url);
    } catch (e) {
      alert(e?.message || "Falha no upload.");
    } finally {
      setEnviando(false);
    }
  };

  const salvar = async () => {
    if (!form.nome?.trim()) return alert("Informe o nome do documento.");
    setSalvando(true);
    try {
      if (form.id) {
        await base44.entities.DocumentoTerceiro.update(form.id, { ...form });
      } else {
        await base44.entities.DocumentoTerceiro.create({ ...form });
      }
      onSalvar();
      onFechar();
    } catch (e) {
      alert(e?.message || "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const inp = "w-full px-3 py-2 rounded-lg border text-sm outline-none";
  const st = { background: WORK.bg, borderColor: WORK.border, color: WORK.text };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 md:p-6 overflow-y-auto" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-lg rounded-xl border my-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: WORK.border }}>
          <h3 className="font-semibold" style={{ color: WORK.text }}>{form.id ? "Editar documento" : "Novo documento"}</h3>
          <button onClick={onFechar} style={{ color: WORK.muted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block">
            <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Tipo *</span>
            <select className={inp} style={st} value={form.tipo || "outro"} onChange={(e) => set("tipo", e.target.value)}>
              {Object.keys(TIPOS_DOC_TERCEIRO).map((k) => <option key={k} value={k}>{TIPOS_DOC_TERCEIRO[k].label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Nome/descrição *</span>
            <input className={inp} style={st} value={form.nome || ""} onChange={(e) => set("nome", e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Emissão</span>
              <input type="date" className={inp} style={st} value={form.data_emissao || ""} onChange={(e) => set("data_emissao", e.target.value)} />
            </label>
            <label>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Validade</span>
              <input type="date" className={inp} style={st} value={form.data_validade || ""} onChange={(e) => set("data_validade", e.target.value)} />
            </label>
          </div>

          {/* Upload */}
          <div>
            <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Arquivo (privado)</span>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm" style={{ borderColor: WORK.border, background: WORK.bg, color: WORK.text }}>
              {enviando ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} style={{ color: WORK.accent }} />}
              <span className="flex-1 truncate">{form.file_uri ? "Arquivo anexado" : "Selecionar arquivo…"}</span>
              <input type="file" className="hidden" onChange={(e) => enviarArquivo(e.target.files?.[0])} />
            </label>
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs" style={{ color: WORK.accent }}>
                <ExternalLink size={12} /> Visualizar arquivo atual
              </a>
            )}
            <p className="text-[11px] mt-1" style={{ color: WORK.muted }}>
              Os arquivos são armazenados de forma privada — o acesso segue as permissões do app.
            </p>
          </div>

          <label className="block">
            <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Observação</span>
            <textarea rows={2} className={inp} style={st} value={form.observacao || ""} onChange={(e) => set("observacao", e.target.value)} />
          </label>
        </div>
        <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderColor: WORK.border }}>
          <button onClick={onFechar} className="px-3 py-2 rounded-lg text-sm" style={{ color: WORK.text, border: `1px solid ${WORK.border}` }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: WORK.accent }}>
            {salvando && <Loader2 size={14} className="animate-spin" />} Salvar
          </button>
        </div>
      </div>
    </div>
  );
}