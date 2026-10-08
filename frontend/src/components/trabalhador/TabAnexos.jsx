import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { uploadPrivado, linkTemporario } from "@/lib/privateFiles";
import { Upload, FileText, Trash2, Download, Loader2, Paperclip, X } from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

const CATEGORIAS = {
  aso: { label: "ASO", color: "#22c55e" },
  rg_cpf: { label: "RG / CPF", color: "#60a5fa" },
  ctps: { label: "CTPS", color: "#a78bfa" },
  comprovante_residencia: { label: "Comprovante de residência", color: "#fbbf24" },
  diploma: { label: "Diploma / Certificado", color: "#f472b6" },
  certificado_treinamento: { label: "Certificado de treinamento", color: "#22c55e" },
  documento_assinado: { label: "Documento assinado", color: "#94a3b8" },
  foto: { label: "Foto", color: "#fbbf24" },
  art_rrt: { label: "ART / RRT", color: "#60a5fa" },
  outro: { label: "Outro", color: "#94a3b8" },
};

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function TabAnexos({ trabalhador }) {
  const [anexos, setAnexos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoria: "aso", descricao: "" });
  const [file, setFile] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Anexo.filter({
        vinculo_tipo: "trabalhador",
        vinculo_id: trabalhador.id,
      });
      setAnexos(res || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [trabalhador.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await uploadPrivado(file);
      await base44.entities.Anexo.create({
        company_id: trabalhador.company_id,
        vinculo_tipo: "trabalhador",
        vinculo_id: trabalhador.id,
        categoria: form.categoria,
        nome: file.name,
        descricao: form.descricao,
        file_uri,
        mime: file.type,
        tamanho: file.size,
      });
      setShowForm(false);
      setForm({ categoria: "aso", descricao: "" });
      setFile(null);
      load();
    } catch (err) {
      alert("Erro ao enviar: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const download = async (a) => {
    try {
      const url = await linkTemporario(a.file_uri);
      window.open(url, "_blank");
    } catch (e) {
      alert("Erro ao abrir arquivo: " + e.message);
    }
  };

  const remove = async (a) => {
    if (!confirm(`Remover "${a.nome}"?`)) return;
    await base44.entities.Anexo.delete(a.id);
    setAnexos((list) => list.filter((x) => x.id !== a.id));
  };

  if (loading) return <div className="text-center py-8" style={{ color: WORK.muted }}>Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold" style={{ color: WORK.text }}>Documentos anexados</h2>
          <p className="text-xs" style={{ color: WORK.muted }}>ASO, RG, CPF, certificados e demais arquivos do trabalhador</p>
        </div>
        <button onClick={() => setShowForm(true)} className="text-xs flex items-center gap-1 px-3 py-2 rounded-lg" style={{ background: WORK.accent, color: "#FFFFFF" }}>
          <Upload size={14} /> Anexar
        </button>
      </div>

      {anexos.length === 0 ? (
        <div className="rounded-lg border p-8 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <Paperclip size={28} className="mx-auto mb-2" style={{ color: WORK.muted }} />
          <p className="text-sm" style={{ color: WORK.muted }}>Nenhum documento anexado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {anexos.map((a) => {
            const cat = CATEGORIAS[a.categoria] || CATEGORIAS.outro;
            return (
              <div key={a.id} className="rounded-lg border p-3 flex items-center gap-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(249,115,22,0.12)" }}>
                  <FileText size={18} style={{ color: WORK.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: WORK.text }}>{a.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${cat.color}22`, color: cat.color }}>{cat.label}</span>
                    <span className="text-xs" style={{ color: WORK.muted }}>{formatBytes(a.tamanho)}</span>
                    {a.descricao && <span className="text-xs truncate" style={{ color: WORK.muted }}>· {a.descricao}</span>}
                  </div>
                </div>
                <button onClick={() => download(a)} className="p-2 rounded-lg" style={{ color: WORK.accent }} title="Baixar">
                  <Download size={16} />
                </button>
                <button onClick={() => remove(a)} className="p-2 rounded-lg" style={{ color: WORK.muted }} title="Remover">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
          <div className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl border p-5" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: WORK.text }}>Anexar documento</h2>
              <button onClick={() => setShowForm(false)} style={{ color: WORK.muted }}><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Categoria</label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                >
                  {Object.entries(CATEGORIAS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Descrição (opcional)</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Ex: ASO admissional"
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Arquivo *</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-sm"
                  style={{ color: WORK.text }}
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: WORK.border, color: WORK.text }}>Cancelar</button>
                <button type="submit" disabled={uploading || !file} className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: WORK.accent, color: "#FFFFFF" }}>
                  {uploading ? <><Loader2 size={14} className="animate-spin" /> Enviando...</> : "Anexar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}