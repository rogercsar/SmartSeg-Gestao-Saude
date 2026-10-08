import { cpfValido } from "@/pages/Importacao";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import ComboboxCodigoEsocial from "@/components/esocial/ComboboxCodigoEsocial";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

export default function TrabalhadorForm({ companyId, cargos = [], onClose, onSaved }) {
  const [form, setForm] = useState({ nome: "", cargo_id: "", data_admissao: "", cpf: "", categoria_trabalhador: "", nit: "", ctps: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500";

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nome) return;
    if (form.cpf && !cpfValido(form.cpf)) { setError("CPF inválido: confira os dígitos."); return; }
    setSaving(true);
    setError("");
    try {
      const created = await base44.entities.Trabalhador.create({ ...form, company_id: companyId });
      onSaved?.(created);
    } catch (err) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
      <form onSubmit={submit} className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl border p-5 space-y-3"
        style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: WORK.text }}>Cadastrar trabalhador</h2>
          <button type="button" onClick={onClose} style={{ color: WORK.muted }}><X size={20} /></button>
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Nome *</label>
          <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
            value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Cargo/função</label>
            <select className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
              value={form.cargo_id} onChange={(e) => setForm((f) => ({ ...f, cargo_id: e.target.value }))}>
              <option value="">Selecione...</option>
              {cargos.map((c) => <option key={c.id} value={c.id}>{c.nome_cargo}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Data de admissão</label>
            <input type="date" className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
              value={form.data_admissao} onChange={(e) => setForm((f) => ({ ...f, data_admissao: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>CPF (opcional)</label>
          <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
            value={form.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>NIT / PIS (opcional)</label>
            <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.nit || ""} onChange={(e) => setForm((f) => ({ ...f, nit: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>CTPS (opcional)</label>
            <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={form.ctps || ""} onChange={(e) => setForm((f) => ({ ...f, ctps: e.target.value }))} placeholder="número/série/UF" />
          </div>
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Categoria (Tabela 1 eSocial)</label>
          <ComboboxCodigoEsocial tabela="categoria_trabalhador" value={form.categoria_trabalhador || ""} onChange={(v) => setForm((f) => ({ ...f, categoria_trabalhador: v }))} placeholder="Selecionar categoria..." />
        </div>
        <p className="text-[11px]" style={{ color: WORK.muted }}>Nenhum dado de saúde é coletado. CPF é opcional.</p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
          style={{ background: WORK.accent, color: "#FFFFFF" }}>
          {saving ? "Salvando..." : "Salvar trabalhador"}
        </button>
      </form>
    </div>
  );
}