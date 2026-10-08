import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Syringe, Stethoscope, X } from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

const VACINAS = ["tétano", "hepatite_b", "influenza", "covid19", "febre_amarela", "sarampo", "tuberculose", "outra"];
const DOSES = ["1", "2", "3", "reforco", "dose_unica"];

export default function TabSaude({ trabalhador, cargo }) {
  const [exames, setExames] = useState([]);
  const [vacinas, setVacinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVacina, setShowVacina] = useState(false);
  const [form, setForm] = useState({ vacina: "tétano", dose: "1", data_aplicacao: "", proxima_dose: "", lote: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ex, vc] = await Promise.all([
        base44.entities.ExamePcmso.filter({ company_id: trabalhador.company_id, cargo_id: trabalhador.cargo_id }),
        base44.entities.Vacina.filter({ trabalhador_id: trabalhador.id }),
      ]);
      setExames(ex || []);
      setVacinas(vc || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [trabalhador.id]);

  const addVacina = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.Vacina.create({
        ...form,
        company_id: trabalhador.company_id,
        trabalhador_id: trabalhador.id,
        trabalhador_nome: trabalhador.nome,
      });
      setForm({ vacina: "tétano", dose: "1", data_aplicacao: "", proxima_dose: "", lote: "" });
      setShowVacina(false);
      load();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const removeVacina = async (v) => {
    if (!confirm("Remover esta vacina?")) return;
    await base44.entities.Vacina.delete(v.id);
    load();
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-orange-500";

  if (loading) return <div className="text-center py-8" style={{ color: WORK.muted }}>Carregando...</div>;

  return (
    <div className="space-y-5">
      {/* Exames do cargo */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Stethoscope size={16} style={{ color: WORK.accent }} />
          <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>Exames médicos (PCMSO) — vinculados ao cargo</h3>
        </div>
        {exames.length === 0 ? (
          <div className="rounded-lg border p-4 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <p className="text-sm" style={{ color: WORK.muted }}>Nenhum exame cadastrado para o cargo {cargo?.nome_cargo || "—"}.</p>
            <p className="text-xs mt-1" style={{ color: WORK.muted }}>Cadastre exames no módulo PGR/PCMSO.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {exames.map((ex) => (
              <div key={ex.id} className="rounded-lg border p-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: WORK.text }}>{ex.exame}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.12)", color: WORK.accent }}>
                    {ex.periodicidade_meses || 12} meses
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {ex.momentos?.map((m) => (
                    <span key={m} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(11,111,168,0.06)", color: WORK.muted }}>{m}</span>
                  ))}
                  {ex.codigo_esocial && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(11,111,168,0.06)", color: WORK.muted }}>eSocial: {ex.codigo_esocial}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vacinas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Syringe size={16} style={{ color: WORK.accent }} />
            <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>Vacinas aplicadas</h3>
          </div>
          <button onClick={() => setShowVacina(true)} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-md" style={{ background: "rgba(249,115,22,0.12)", color: WORK.accent }}>
            <Plus size={14} /> Registrar
          </button>
        </div>

        {showVacina && (
          <form onSubmit={addVacina} className="rounded-lg border p-4 mb-3 space-y-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: WORK.text }}>Registrar vacina</span>
              <button type="button" onClick={() => setShowVacina(false)} style={{ color: WORK.muted }}><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Vacina *</label>
                <select className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.vacina} onChange={(e) => setForm((f) => ({ ...f, vacina: e.target.value }))} required>
                  {VACINAS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Dose</label>
                <select className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.dose} onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))}>
                  {DOSES.map((d) => <option key={d} value={d}>{d === "dose_unica" ? "Dose única" : d === "reforco" ? "Reforço" : `${d}ª dose`}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Data de aplicação *</label>
                <input type="date" className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.data_aplicacao} onChange={(e) => setForm((f) => ({ ...f, data_aplicacao: e.target.value }))} required />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Próxima dose</label>
                <input type="date" className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.proxima_dose} onChange={(e) => setForm((f) => ({ ...f, proxima_dose: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Lote</label>
              <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.lote} onChange={(e) => setForm((f) => ({ ...f, lote: e.target.value }))} />
            </div>
            <button type="submit" disabled={saving} className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: WORK.accent, color: "#FFFFFF" }}>
              {saving ? "Salvando..." : "Salvar vacina"}
            </button>
          </form>
        )}

        {vacinas.length === 0 ? (
          <div className="rounded-lg border p-4 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <p className="text-sm" style={{ color: WORK.muted }}>Nenhuma vacina registrada.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vacinas.map((v) => (
              <div key={v.id} className="rounded-lg border p-3 flex items-center justify-between" style={{ background: WORK.surface, borderColor: WORK.border }}>
                <div>
                  <span className="text-sm font-medium" style={{ color: WORK.text }}>{v.vacina}</span>
                  <span className="text-xs ml-2" style={{ color: WORK.muted }}>
                    {v.dose === "dose_unica" ? "Dose única" : v.dose === "reforco" ? "Reforço" : `${v.dose}ª dose`} · {new Date(v.data_aplicacao).toLocaleDateString("pt-BR")}
                  </span>
                  {v.proxima_dose && (
                    <span className="text-xs block mt-0.5" style={{ color: "#fbbf24" }}>Próxima: {new Date(v.proxima_dose).toLocaleDateString("pt-BR")}</span>
                  )}
                </div>
                <button onClick={() => removeVacina(v)} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}