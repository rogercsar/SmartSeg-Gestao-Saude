import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Fingerprint, Accessibility, HeartPulse, Save, X } from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

export default function TabPerfil({ trabalhador, onUpdate }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    deficiencia: trabalhador.deficiencia || { tem: false, tipo: "", descricao: "", cid: "" },
    biometria: trabalhador.biometria || { cadastrada: false, tipo: "", arquivo_uri: "" },
    estabilidade: trabalhador.estabilidade || { tem: false, tipo: "", data_fim: "", observacao: "" },
    cipa_cargo: trabalhador.cipa_cargo || "",
    brigada: trabalhador.brigada || false,
    status: trabalhador.status || "ativo",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setNested = (k, field, v) => setForm((f) => ({ ...f, [k]: { ...f[k], [field]: v } }));

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Trabalhador.update(trabalhador.id, form);
      onUpdate();
      setEdit(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const def = trabalhador.deficiencia || {};
  const bio = trabalhador.biometria || {};
  const est = trabalhador.estabilidade || {};

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-orange-500";

  if (edit) {
    return (
      <div className="rounded-lg border p-4 space-y-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: WORK.text }}>Editar perfil</span>
          <button onClick={() => setEdit(false)} style={{ color: WORK.muted }}><X size={16} /></button>
        </div>

        {/* Deficiência */}
        <div className="space-y-2">
          <label className="text-xs font-medium flex items-center gap-1" style={{ color: WORK.muted }}><Accessibility size={12} /> Deficiência (PCD)</label>
          <label className="flex items-center gap-2 text-sm" style={{ color: WORK.text }}>
            <input type="checkbox" checked={form.deficiencia.tem} onChange={(e) => setNested("deficiencia", "tem", e.target.checked)} />
            Possui deficiência
          </label>
          {form.deficiencia.tem && (
            <div className="grid grid-cols-2 gap-2 pl-6">
              <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} placeholder="Tipo (física, visual, auditiva...)" value={form.deficiencia.tipo} onChange={(e) => setNested("deficiencia", "tipo", e.target.value)} />
              <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} placeholder="CID (opcional)" value={form.deficiencia.cid} onChange={(e) => setNested("deficiencia", "cid", e.target.value)} />
              <input className={`${inputCls} col-span-2`} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} placeholder="Descrição" value={form.deficiencia.descricao} onChange={(e) => setNested("deficiencia", "descricao", e.target.value)} />
            </div>
          )}
        </div>

        {/* Biometria */}
        <div className="space-y-2">
          <label className="text-xs font-medium flex items-center gap-1" style={{ color: WORK.muted }}><Fingerprint size={12} /> Biometria</label>
          <label className="flex items-center gap-2 text-sm" style={{ color: WORK.text }}>
            <input type="checkbox" checked={form.biometria.cadastrada} onChange={(e) => setNested("biometria", "cadastrada", e.target.checked)} />
            Biometria cadastrada
          </label>
          {form.biometria.cadastrada && (
            <div className="pl-6">
              <select className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.biometria.tipo} onChange={(e) => setNested("biometria", "tipo", e.target.value)}>
                <option value="">Tipo...</option>
                <option value="digital">Digital</option>
                <option value="facial">Facial</option>
                <option value="iris">Íris</option>
                <option value="palma">Palma</option>
              </select>
            </div>
          )}
        </div>

        {/* Estabilidade */}
        <div className="space-y-2">
          <label className="text-xs font-medium flex items-center gap-1" style={{ color: WORK.muted }}><Shield size={12} /> Estabilidade no emprego</label>
          <label className="flex items-center gap-2 text-sm" style={{ color: WORK.text }}>
            <input type="checkbox" checked={form.estabilidade.tem} onChange={(e) => setNested("estabilidade", "tem", e.target.checked)} />
            Possui estabilidade
          </label>
          {form.estabilidade.tem && (
            <div className="grid grid-cols-2 gap-2 pl-6">
              <select className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.estabilidade.tipo} onChange={(e) => setNested("estabilidade", "tipo", e.target.value)}>
                <option value="">Tipo...</option>
                <option value="gestante">Gestante</option>
                <option value="cipa">CIPA</option>
                <option value="acidente_trabalho">Acidente de trabalho (até 12 meses)</option>
                <option value="doenca_profissional">Doença profissional</option>
                <option value="sindical">Dirigente sindical</option>
                <option value="outra">Outra</option>
              </select>
              <input type="date" className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.estabilidade.data_fim} onChange={(e) => setNested("estabilidade", "data_fim", e.target.value)} />
              <input className={`${inputCls} col-span-2`} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} placeholder="Observação" value={form.estabilidade.observacao} onChange={(e) => setNested("estabilidade", "observacao", e.target.value)} />
            </div>
          )}
        </div>

        {/* CIPA e Brigada */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Cargo na CIPA</label>
            <select className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.cipa_cargo} onChange={(e) => set("cipa_cargo", e.target.value)}>
              <option value="">Não participa</option>
              <option value="presidente">Presidente</option>
              <option value="vice_presidente">Vice-presidente</option>
              <option value="secretario">Secretário</option>
              <option value="membro">Membro</option>
              <option value="suplente">Suplente</option>
            </select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Brigada de emergência</label>
            <label className="flex items-center gap-2 text-sm py-2" style={{ color: WORK.text }}>
              <input type="checkbox" checked={form.brigada} onChange={(e) => set("brigada", e.target.checked)} />
              Membro de brigada
            </label>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: WORK.accent, color: "#FFFFFF" }}>
          <Save size={14} /> {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="rounded-lg border p-4 flex items-center justify-between" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center gap-2">
          <HeartPulse size={16} style={{ color: trabalhador.status === "ativo" ? "#22c55e" : "#94A3B8" }} />
          <span className="text-sm" style={{ color: WORK.text }}>Status: </span>
          <span className="text-sm font-medium px-2 py-0.5 rounded-full" style={{ background: trabalhador.status === "ativo" ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)", color: trabalhador.status === "ativo" ? "#22c55e" : WORK.muted }}>
            {trabalhador.status === "ativo" ? "Ativo" : "Inativo"}
          </span>
        </div>
        <button onClick={() => setEdit(true)} className="text-xs px-2.5 py-1.5 rounded-md" style={{ background: "rgba(249,115,22,0.12)", color: WORK.accent }}>Editar</button>
      </div>

      {/* Deficiência */}
      <div className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center gap-2 mb-2">
          <Accessibility size={15} style={{ color: WORK.accent }} />
          <span className="text-sm font-medium" style={{ color: WORK.text }}>Deficiência (PCD)</span>
        </div>
        {def.tem ? (
          <div className="text-sm space-y-0.5" style={{ color: WORK.muted }}>
            <p>Tipo: <span style={{ color: WORK.text }}>{def.tipo || "—"}</span></p>
            {def.cid && <p>CID: <span style={{ color: WORK.text }}>{def.cid}</span></p>}
            {def.descricao && <p>{def.descricao}</p>}
          </div>
        ) : (
          <p className="text-sm" style={{ color: WORK.muted }}>Não possui deficiência cadastrada.</p>
        )}
      </div>

      {/* Biometria */}
      <div className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center gap-2 mb-2">
          <Fingerprint size={15} style={{ color: WORK.accent }} />
          <span className="text-sm font-medium" style={{ color: WORK.text }}>Biometria</span>
        </div>
        {bio.cadastrada ? (
          <p className="text-sm" style={{ color: WORK.muted }}>Cadastrada — tipo: <span style={{ color: WORK.text }}>{bio.tipo || "—"}</span></p>
        ) : (
          <p className="text-sm" style={{ color: WORK.muted }}>Não cadastrada.</p>
        )}
      </div>

      {/* Estabilidade */}
      <div className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center gap-2 mb-2">
          <Shield size={15} style={{ color: WORK.accent }} />
          <span className="text-sm font-medium" style={{ color: WORK.text }}>Estabilidade no emprego</span>
        </div>
        {est.tem ? (
          <div className="text-sm space-y-0.5" style={{ color: WORK.muted }}>
            <p>Tipo: <span style={{ color: WORK.text }}>{est.tipo || "—"}</span></p>
            {est.data_fim && <p>Até: <span style={{ color: WORK.text }}>{new Date(est.data_fim).toLocaleDateString("pt-BR")}</span></p>}
            {est.observacao && <p>{est.observacao}</p>}
          </div>
        ) : (
          <p className="text-sm" style={{ color: WORK.muted }}>Sem estabilidade cadastrada.</p>
        )}
      </div>

      {/* CIPA e Brigada */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <span className="text-sm font-medium block mb-1" style={{ color: WORK.text }}>CIPA</span>
          <p className="text-sm" style={{ color: WORK.muted }}>{trabalhador.cipa_cargo ? trabalhador.cipa_cargo.replace("_", " ") : "Não participa"}</p>
        </div>
        <div className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <span className="text-sm font-medium block mb-1" style={{ color: WORK.text }}>Brigada</span>
          <p className="text-sm" style={{ color: WORK.muted }}>{trabalhador.brigada ? "Membro" : "Não"}</p>
        </div>
      </div>
    </div>
  );
}