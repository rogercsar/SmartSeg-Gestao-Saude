import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, X, FileClock, CheckCircle2, AlertCircle, Clock, Send } from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

const EVENTOS = {
  "S-2200": { label: "S-2200 · Admissão", color: "#22c55e" },
  "S-2205": { label: "S-2205 · Alteração cadastral", color: "#60a5fa" },
  "S-2206": { label: "S-2206 · Alteração de contrato", color: "#60a5fa" },
  "S-2221": { label: "S-2221 · Exame toxicológico (motorista)", color: "#7C3AED" },
  "S-2230": { label: "S-2230 · Afastamento temporário", color: "#fbbf24" },
  "S-2210": { label: "S-2210 · Acidente de trabalho (CAT)", color: "#ef4444" },
  "S-2220": { label: "S-2220 · Monitoramento da saúde (ASO)", color: "#13A89E" },
  "S-2240": { label: "S-2240 · Condições ambientais", color: "#f472b6" },
  "S-2298": { label: "S-2298 · Reintegração", color: "#22c55e" },
  "S-2299": { label: "S-2299 · Desligamento", color: "#ef4444" },
  "S-2300": { label: "S-2300 · Trabalhador sem vínculo", color: "#94a3b8" },
};

const STATUS = {
  rascunho: { label: "Rascunho", icon: Clock, color: "#94a3b8" },
  transmitido: { label: "Transmitido", icon: Send, color: "#fbbf24" },
  processado: { label: "Processado", icon: CheckCircle2, color: "#22c55e" },
  erro: { label: "Erro", icon: AlertCircle, color: "#ef4444" },
};

export default function TabEsocial({ trabalhador }) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo_evento: "S-2200", data_evento: "", descricao: "", recibo: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.EventoEsocial.filter({ trabalhador_id: trabalhador.id });
      setEventos(res || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [trabalhador.id]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await base44.entities.EventoEsocial.create({
        company_id: trabalhador.company_id,
        trabalhador_id: trabalhador.id,
        trabalhador_nome: trabalhador.nome,
        tipo_evento: form.tipo_evento,
        data_evento: form.data_evento,
        descricao: form.descricao,
        recibo: form.recibo,
        status: "rascunho",
      });
      setShowForm(false);
      setForm({ tipo_evento: "S-2200", data_evento: "", descricao: "", recibo: "" });
      load();
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  const cycleStatus = async (ev) => {
    const order = ["rascunho", "transmitido", "processado", "erro"];
    const next = order[(order.indexOf(ev.status) + 1) % order.length];
    await base44.entities.EventoEsocial.update(ev.id, { status: next });
    setEventos((list) => list.map((x) => (x.id === ev.id ? { ...x, status: next } : x)));
  };

  const remove = async (ev) => {
    if (!confirm("Remover este evento?")) return;
    await base44.entities.EventoEsocial.delete(ev.id);
    setEventos((list) => list.filter((x) => x.id !== ev.id));
  };

  if (loading) return <div className="text-center py-8" style={{ color: WORK.muted }}>Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold" style={{ color: WORK.text }}>Eventos eSocial</h2>
          <p className="text-xs" style={{ color: WORK.muted }}>Registro de eventos enviados ao eSocial</p>
        </div>
        <button onClick={() => setShowForm(true)} className="text-xs flex items-center gap-1 px-3 py-2 rounded-lg" style={{ background: WORK.accent, color: "#FFFFFF" }}>
          <Plus size={14} /> Novo evento
        </button>
      </div>

      {eventos.length === 0 ? (
        <div className="rounded-lg border p-8 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <FileClock size={28} className="mx-auto mb-2" style={{ color: WORK.muted }} />
          <p className="text-sm" style={{ color: WORK.muted }}>Nenhum evento eSocial registrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {eventos.map((ev) => {
            const meta = EVENTOS[ev.tipo_evento] || { label: ev.tipo_evento, color: "#94a3b8" };
            const st = STATUS[ev.status] || STATUS.rascunho;
            const SIcon = st.icon;
            return (
              <div key={ev.id} className="rounded-lg border p-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: meta.color }}>{meta.label}</span>
                      <button onClick={() => cycleStatus(ev)} className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: `${st.color}22`, color: st.color }}>
                        <SIcon size={10} /> {st.label}
                      </button>
                    </div>
                    <p className="text-xs mt-1" style={{ color: WORK.muted }}>
                      {ev.data_evento ? new Date(ev.data_evento).toLocaleDateString("pt-BR") : "—"}
                      {ev.recibo && ` · Recibo: ${ev.recibo}`}
                    </p>
                    {ev.descricao && <p className="text-sm mt-1" style={{ color: WORK.text }}>{ev.descricao}</p>}
                  </div>
                  <button onClick={() => remove(ev)} className="p-1.5 rounded-lg shrink-0" style={{ color: WORK.muted }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
          <div className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl border p-5" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: WORK.text }}>Novo evento eSocial</h2>
              <button onClick={() => setShowForm(false)} style={{ color: WORK.muted }}><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Tipo de evento *</label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                  value={form.tipo_evento}
                  onChange={(e) => setForm((f) => ({ ...f, tipo_evento: e.target.value }))}
                >
                  {Object.entries(EVENTOS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Data do evento *</label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                  value={form.data_evento}
                  onChange={(e) => setForm((f) => ({ ...f, data_evento: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Descrição</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Ex: Afastamento por motivo de doença"
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Nº do recibo eSocial</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                  value={form.recibo}
                  onChange={(e) => setForm((f) => ({ ...f, recibo: e.target.value }))}
                  placeholder="Preencher após transmissão"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: WORK.border, color: WORK.text }}>Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: WORK.accent, color: "#FFFFFF" }}>Salvar evento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}