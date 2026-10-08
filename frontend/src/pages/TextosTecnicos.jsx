import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Trash2, FileText, X, Copy, Check, Pencil, Library } from "lucide-react";

const COLORS = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  borderInput: "#D1D5DB",
  text: "#1F2937",
  textSecondary: "#6B7280",
  accent: "#195383",
  accentLight: "#EFF6FF",
  green: "#059669",
  amber: "#F59E0B",
  red: "#EF4444",
};

const TIPO_LABEL = {
  pgr: "PGR", pcmso: "PCMSO", ltcat: "LTCAT",
  lti: "LTI (Insalubridade)", ltp: "LTP (Periculosidade)",
  ficha_epi: "Ficha de EPI", ordem_servico: "Ordem de Serviço",
  auto_infracao: "Auto de Infração", geral: "Geral",
};

const CATEGORIA_LABEL = {
  caracterizacao_risco: "Caracterização de riscos",
  caracterizacao_insalubridade: "Caracterização de insalubridade",
  caracterizacao_periculosidade: "Caracterização de periculosidade",
  fundamentacao: "Fundamentação",
  introducao: "Introdução",
  metodologia: "Metodologia",
  conclusao: "Conclusão",
  responsabilidades: "Responsabilidades",
  revisao: "Revisão",
  medida_controle: "Medida de controle",
  outro: "Outro",
};

const RISCO_LABEL = {
  fisico: "Físico", quimico: "Químico", biologico: "Biológico",
  ergonomico: "Ergonômico", acidente: "Acidente", psicossocial: "Psicossocial",
};

const TIPO_COLOR = {
  pgr: "#195383", pcmso: "#059669", ltcat: "#7C3AED",
  lti: "#EF4444", ltp: "#F59E0B",
  ficha_epi: "#0891B2", ordem_servico: "#0D9488",
  auto_infracao: "#DC2626", geral: "#6B7280",
};

export default function TextosTecnicos() {
  const [textos, setTextos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCat, setFiltroCat] = useState("");
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [copiadoId, setCopiadoId] = useState(null);

  const carregar = async () => {
    setLoading(true);
    const query = {};
    if (filtroTipo) query.tipo_documento = filtroTipo;
    if (filtroCat) query.categoria = filtroCat;
    if (busca.trim()) query.titulo = { $regex: busca.trim(), $options: "i" };
    try {
      const res = await base44.entities.TextoTecnico.filter(query, { sort: "-created_date", limit: 200 });
      setTextos(res.items || res || []);
    } catch {
      setTextos([]);
    }
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [filtroTipo, filtroCat]);

  const salvar = async (dados) => {
    if (editando) {
      await base44.entities.TextoTecnico.update(editando.id, dados);
    } else {
      await base44.entities.TextoTecnico.create(dados);
    }
    setShowForm(false);
    setEditando(null);
    carregar();
  };

  const remover = async (t) => {
    if (!confirm("Remover este texto?")) return;
    await base44.entities.TextoTecnico.delete(t.id);
    carregar();
  };

  const copiar = async (t) => {
    await navigator.clipboard.writeText(t.texto);
    setCopiadoId(t.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  return (
    <div className="min-h-full p-4 md:p-8" style={{ background: COLORS.bg }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: COLORS.accent }}>
              <Library size={20} color="#fff" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: COLORS.text, fontFamily: "Inter, sans-serif" }}>
                Biblioteca de textos técnicos
              </h1>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                Textos padronizados para caracterização de riscos e fundamentação de laudos
              </p>
            </div>
          </div>
          <button
            onClick={() => { setEditando(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
            style={{ background: COLORS.accent, color: "#fff" }}
          >
            <Plus size={16} /> Novo texto
          </button>
        </div>

        {/* Filtros — card branco */}
        <div className="rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-center" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          <div className="flex-1 min-w-[220px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") carregar(); }}
              placeholder="Buscar por título..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "#F9FAFB", border: `1px solid ${COLORS.borderInput}`, color: COLORS.text }}
            />
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "#F9FAFB", border: `1px solid ${COLORS.borderInput}`, color: COLORS.text }}
          >
            <option value="">Todos os documentos</option>
            {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select
            value={filtroCat}
            onChange={(e) => setFiltroCat(e.target.value)}
            className="px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "#F9FAFB", border: `1px solid ${COLORS.borderInput}`, color: COLORS.text }}
          >
            <option value="">Todas as categorias</option>
            {Object.entries(CATEGORIA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
            {textos.length} {textos.length === 1 ? "texto" : "textos"}
          </span>
        </div>

        {/* Lista — cards */}
        {loading ? (
          <div className="rounded-lg p-12 text-center" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>Carregando...</p>
          </div>
        ) : textos.length === 0 ? (
          <div className="rounded-lg p-12 text-center" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <FileText size={36} className="mx-auto mb-3" style={{ color: COLORS.textSecondary }} />
            <p className="text-sm font-medium mb-1" style={{ color: COLORS.text }}>Nenhum texto cadastrado</p>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>Clique em "Novo texto" para criar o primeiro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {textos.map((t) => {
              const cor = TIPO_COLOR[t.tipo_documento] || COLORS.accent;
              return (
                <div key={t.id} className="rounded-lg p-5 flex flex-col" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${cor}15`, color: cor }}>
                          {TIPO_LABEL[t.tipo_documento]}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: COLORS.textSecondary }}>
                          {CATEGORIA_LABEL[t.categoria]}
                        </span>
                        {t.risco_tipo && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: COLORS.textSecondary }}>
                            {RISCO_LABEL[t.risco_tipo]}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold leading-snug" style={{ color: COLORS.text }}>{t.titulo}</h3>
                      {t.agente && <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>Agente: {t.agente}</p>}
                    </div>
                  </div>

                  <p className="text-sm whitespace-pre-wrap line-clamp-4 flex-1 mb-3" style={{ color: COLORS.textSecondary, lineHeight: 1.6 }}>
                    {t.texto}
                  </p>

                  {t.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {t.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#F3F4F6", color: COLORS.textSecondary }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <button
                      onClick={() => copiar(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: copiadoId === t.id ? `${COLORS.green}15` : "#F3F4F6", color: copiadoId === t.id ? COLORS.green : COLORS.textSecondary }}
                    >
                      {copiadoId === t.id ? <Check size={13} /> : <Copy size={13} />}
                      {copiadoId === t.id ? "Copiado" : "Copiar"}
                    </button>
                    <button
                      onClick={() => { setEditando(t); setShowForm(true); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: COLORS.accentLight, color: COLORS.accent }}
                    >
                      <Pencil size={13} /> Editar
                    </button>
                    <button
                      onClick={() => remover(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ml-auto transition-colors"
                      style={{ background: "#FEF2F2", color: COLORS.red }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <TextoForm
          texto={editando}
          onSave={salvar}
          onClose={() => { setShowForm(false); setEditando(null); }}
        />
      )}
    </div>
  );
}

function TextoForm({ texto, onSave, onClose }) {
  const [form, setForm] = useState({
    tipo_documento: texto?.tipo_documento || "pgr",
    categoria: texto?.categoria || "caracterizacao_risco",
    titulo: texto?.titulo || "",
    texto: texto?.texto || "",
    risco_tipo: texto?.risco_tipo || "",
    agente: texto?.agente || "",
    tags: texto?.tags?.join(", ") || "",
  });
  const [salvando, setSalvando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.texto.trim()) return;
    setSalvando(true);
    try {
      await onSave({
        ...form,
        risco_tipo: form.risco_tipo || "",
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
    } finally {
      setSalvando(false);
    }
  };

  const inputStyle = { background: "#F9FAFB", border: `1px solid ${COLORS.borderInput}`, color: COLORS.text };
  const labelStyle = { color: COLORS.textSecondary, fontSize: "13px", fontWeight: 500, marginBottom: "6px", display: "block" };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4">
      <form
        onSubmit={submit}
        className="w-full md:max-w-2xl rounded-t-2xl md:rounded-lg max-h-[92vh] overflow-y-auto"
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <h2 className="font-semibold text-base" style={{ color: COLORS.text }}>
            {texto ? "Editar texto técnico" : "Novo texto técnico"}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100" style={{ color: COLORS.textSecondary }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Documento</label>
              <select
                value={form.tipo_documento}
                onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              >
                {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              >
                {Object.entries(CATEGORIA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Título</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex: Caracterização de ruído — NR-15 Anexo I"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Tipo de risco (opcional)</label>
              <select
                value={form.risco_tipo}
                onChange={(e) => setForm({ ...form, risco_tipo: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              >
                <option value="">—</option>
                {Object.entries(RISCO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Agente (opcional)</label>
              <input
                value={form.agente}
                onChange={(e) => setForm({ ...form, agente: e.target.value })}
                placeholder="Ex: ruído, benzeno..."
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Texto</label>
            <textarea
              value={form.texto}
              onChange={(e) => setForm({ ...form, texto: e.target.value })}
              rows={10}
              placeholder="Escreva o texto padronizado..."
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-y"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Tags (separadas por vírgula)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Ex: ruído, anexo1, nr15"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ color: COLORS.textSecondary, border: `1px solid ${COLORS.borderInput}` }}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: COLORS.accent, color: "#fff" }}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}