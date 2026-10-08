import React, { useState } from "react";
import { invokeAI } from "@/lib/ai";
import { Sparkles, Plus, Trash2, Loader2 } from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

const SEVERITY = [1, 2, 3, 4, 5];
const PROBABILITY = [1, 2, 3, 4, 5];
const SEV_LABEL = { 1: "Leve", 2: "Moderado", 3: "Alto", 4: "Crítico", 5: "Catastrófico" };
const PROB_LABEL = { 1: "Raro", 2: "Improvável", 3: "Possível", 4: "Provável", 5: "Frequente" };

function riskLevel(score) {
  if (score >= 15) return { label: "Crítico", color: "#ef4444" };
  if (score >= 9) return { label: "Alto", color: "#F97316" };
  if (score >= 4) return { label: "Médio", color: "#EAB308" };
  return { label: "Baixo", color: "#22C55E" };
}

export default function PgrForm({ formData, setFormData }) {
  const [suggesting, setSuggesting] = useState(false);
  const riscos = formData.riscos || [];

  const set = (k, v) => setFormData((f) => ({ ...f, [k]: v }));

  const suggest = async () => {
    if (!formData.atividades) { alert("Descreva as atividades primeiro."); return; }
    setSuggesting(true);
    try {
      const res = await invokeAI("pgr_riscos", {
        prompt: `Você é um especialista em PGR/APR. Com base nos dados abaixo, sugira perigos, riscos e medidas de controle. Para cada risco, classifique severidade (1-5) e probabilidade (1-5). Retorne apenas JSON.\n\nSetor: ${formData.setor || "não informado"}\nCargo: ${formData.cargo || "não informado"}\nAtividades: ${formData.atividades}`,
        response_json_schema: {
          type: "object",
          properties: {
            riscos: { type: "array", items: { type: "object", properties: {
              perigo: { type: "string" }, risco: { type: "string" },
              severidade: { type: "number" }, probabilidade: { type: "number" },
              medidas: { type: "array", items: { type: "string" } },
            } } },
          },
        },
      });
      const data = typeof res === "object" ? res : JSON.parse(res);
      const suggested = (data.riscos || []).map((r) => ({ ...r, ia_sugestao: true }));
      set("riscos", [...riscos, ...suggested]);
    } catch { alert("Erro ao sugerir. Tente novamente."); }
    finally { setSuggesting(false); }
  };

  const addRow = () => {
    set("riscos", [...riscos, { perigo: "", risco: "", severidade: 3, probabilidade: 3, medidas: [], ia_sugestao: false }]);
  };

  const updateRow = (i, field, value) => {
    set("riscos", riscos.map((r, j) => (j === i ? { ...r, [field]: value } : r)));
  };

  const removeRow = (i) => {
    set("riscos", riscos.filter((_, j) => j !== i));
  };

  const inputCls = "w-full px-2.5 py-2 rounded-md border text-sm outline-none focus:border-orange-500";

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Setor</label>
        <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={formData.setor || ""} onChange={(e) => set("setor", e.target.value)} placeholder="Ex: Produção" />
      </div>
      <div>
        <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Atividades *</label>
        <textarea rows={2} className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={formData.atividades || ""} onChange={(e) => set("atividades", e.target.value)} placeholder="Ex: Soldagem em estrutura metálica, trabalho em altura..." />
      </div>
      <button onClick={suggest} disabled={suggesting} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: "rgba(249,115,22,0.12)", color: WORK.accent, border: `1px solid ${WORK.border}` }}>
        {suggesting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} {suggesting ? "Sugerindo..." : "Sugerir riscos com IA"}
      </button>

      {riscos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: WORK.muted }}>Matriz 5×5 (severidade × probabilidade)</p>
            <button onClick={addRow} className="text-xs flex items-center gap-1" style={{ color: WORK.accent }}><Plus size={13} /> Linha</button>
          </div>
          {riscos.map((r, i) => {
            const score = (r.severidade || 1) * (r.probabilidade || 1);
            const lvl = riskLevel(score);
            return (
              <div key={i} className="rounded-lg border p-3 space-y-2" style={{ background: WORK.bg, borderColor: WORK.border }}>
                <div className="flex items-start justify-between gap-2">
                  <input className={inputCls + " flex-1"} style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }} value={r.perigo} onChange={(e) => updateRow(i, "perigo", e.target.value)} placeholder="Perigo" />
                  <button onClick={() => removeRow(i)} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
                </div>
                <input className={inputCls} style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }} value={r.risco} onChange={(e) => updateRow(i, "risco", e.target.value)} placeholder="Risco associado" />
                <div className="grid grid-cols-2 gap-2">
                  <select className={inputCls} style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }} value={r.severidade} onChange={(e) => updateRow(i, "severidade", Number(e.target.value))}>
                    {SEVERITY.map((s) => <option key={s} value={s}>Sev: {s} — {SEV_LABEL[s]}</option>)}
                  </select>
                  <select className={inputCls} style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }} value={r.probabilidade} onChange={(e) => updateRow(i, "probabilidade", Number(e.target.value))}>
                    {PROBABILITY.map((p) => <option key={p} value={p}>Prob: {p} — {PROB_LABEL[p]}</option>)}
                  </select>
                </div>
                <input className={inputCls} style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }} value={(r.medidas || []).join("; ")} onChange={(e) => updateRow(i, "medidas", e.target.value.split(";").map((s) => s.trim()).filter(Boolean))} placeholder="Medidas de controle (separadas por ;)" />
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${lvl.color}22`, color: lvl.color }}>Nível {score} — {lvl.label}</span>
                  {r.ia_sugestao && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(234,179,8,0.12)", color: "#EAB308" }}>sugestão IA · conferir</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}