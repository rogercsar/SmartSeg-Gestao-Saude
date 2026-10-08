import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2 } from "lucide-react";
import { WORK } from "@/lib/sst";
import { STATUS_TERCEIRA } from "@/lib/terceiros";

const CONSELHOS = { "": "—", CREA: "CREA", CRM: "CRM", MTE: "Registro MTE", outro: "Outro" };

export default function TerceiraForm({ aberto, empresaId, terceira, setores, cargos, onFechar, onSalvar }) {
  const [form, setForm] = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setForm(terceira ? { ...terceira } : { company_id: empresaId, status: "ativa", setor_ids: [], cargo_ids: [] });
    }
  }, [aberto, terceira, empresaId]);

  if (!aberto) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleArr = (k, id) => setForm((f) => ({ ...f, [k]: (f[k] || []).includes(id) ? f[k].filter((x) => x !== id) : [...(f[k] || []), id] }));

  const salvar = async () => {
    if (!form.razao_social?.trim()) return alert("Informe a razão social.");
    setSalvando(true);
    try {
      if (form.id) {
        await base44.entities.Terceira.update(form.id, { ...form });
      } else {
        await base44.entities.Terceira.create({ ...form });
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
      <div className="w-full max-w-2xl rounded-xl border my-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: WORK.border }}>
          <h3 className="font-semibold" style={{ color: WORK.text }}>{form.id ? "Editar terceira" : "Nova empresa terceira"}</h3>
          <button onClick={onFechar} style={{ color: WORK.muted }}><X size={18} /></button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block md:col-span-2">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Razão social *</span>
              <input className={inp} style={st} value={form.razao_social || ""} onChange={(e) => set("razao_social", e.target.value)} />
            </label>
            <label>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>CNPJ</span>
              <input className={inp} style={st} value={form.cnpj || ""} onChange={(e) => set("cnpj", e.target.value)} />
            </label>
            <label>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Status</span>
              <select className={inp} style={st} value={form.status || "ativa"} onChange={(e) => set("status", e.target.value)}>
                {Object.keys(STATUS_TERCEIRA).map((k) => <option key={k} value={k}>{STATUS_TERCEIRA[k].label}</option>)}
              </select>
            </label>
            <label>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Responsável legal</span>
              <input className={inp} style={st} value={form.responsavel || ""} onChange={(e) => set("responsavel", e.target.value)} />
            </label>
            <label>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Telefone</span>
              <input className={inp} style={st} value={form.telefone || ""} onChange={(e) => set("telefone", e.target.value)} />
            </label>
            <label className="md:col-span-2">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>E-mail</span>
              <input className={inp} style={st} value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
            </label>
            <label>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Nº do contrato</span>
              <input className={inp} style={st} value={form.contrato_numero || ""} onChange={(e) => set("contrato_numero", e.target.value)} />
            </label>
            <label>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Início do contrato</span>
              <input type="date" className={inp} style={st} value={form.contrato_inicio || ""} onChange={(e) => set("contrato_inicio", e.target.value)} />
            </label>
            <label>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Fim do contrato</span>
              <input type="date" className={inp} style={st} value={form.contrato_fim || ""} onChange={(e) => set("contrato_fim", e.target.value)} />
            </label>
            <label className="md:col-span-2">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Área de atuação / serviço prestado</span>
              <input className={inp} style={st} placeholder="Ex.: Limpeza, vigilância, manutenção industrial…" value={form.area_atuacao || ""} onChange={(e) => set("area_atuacao", e.target.value)} />
            </label>
          </div>

          {/* Responsável técnico */}
          <div className="rounded-lg border p-3" style={{ borderColor: WORK.border, background: WORK.bg }}>
            <p className="text-xs font-medium mb-2" style={{ color: WORK.text }}>Responsável técnico (opcional)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input className={inp} style={st} placeholder="Nome" value={form.responsavel_tecnico_nome || ""} onChange={(e) => set("responsavel_tecnico_nome", e.target.value)} />
              <select className={inp} style={st} value={form.responsavel_tecnico_conselho || ""} onChange={(e) => set("responsavel_tecnico_conselho", e.target.value)}>
                {Object.entries(CONSELHOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input className={inp} style={st} placeholder="Nº do registro" value={form.responsavel_tecnico_numero || ""} onChange={(e) => set("responsavel_tecnico_numero", e.target.value)} />
            </div>
          </div>

          {/* Vínculo com setores e cargos da contratante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Setores onde atua</span>
              <div className="max-h-32 overflow-y-auto rounded-lg border p-2 space-y-1" style={{ borderColor: WORK.border, background: WORK.bg }}>
                {setores.length === 0 && <p className="text-xs" style={{ color: WORK.muted }}>Nenhum setor cadastrado.</p>}
                {setores.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm" style={{ color: WORK.text }}>
                    <input type="checkbox" checked={(form.setor_ids || []).includes(s.id)} onChange={() => toggleArr("setor_ids", s.id)} />
                    {s.nome || s.nome_setor || s.id}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Cargos/funções executados</span>
              <div className="max-h-32 overflow-y-auto rounded-lg border p-2 space-y-1" style={{ borderColor: WORK.border, background: WORK.bg }}>
                {cargos.length === 0 && <p className="text-xs" style={{ color: WORK.muted }}>Nenhum cargo cadastrado.</p>}
                {cargos.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm" style={{ color: WORK.text }}>
                    <input type="checkbox" checked={(form.cargo_ids || []).includes(c.id)} onChange={() => toggleArr("cargo_ids", c.id)} />
                    {c.nome_cargo || c.nome || c.id}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <label className="block">
            <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Observações</span>
            <textarea rows={2} className={inp} style={st} value={form.observacoes || ""} onChange={(e) => set("observacoes", e.target.value)} />
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