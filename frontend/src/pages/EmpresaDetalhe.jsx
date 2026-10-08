import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppState } from "@/lib/AppState";
import { base44 } from "@/api/base44Client";
import { buildChecklistItems } from "@/lib/nrKnowledge";
import { searchCbo } from "@/lib/externalLookups";
import {
  ArrowLeft,
  Plus,
  X,
  CheckCircle2,
  Circle,
  MinusCircle,
} from "lucide-react";
import TrabalhadoresSection from "@/components/empresa/TrabalhadoresSection";
import AnaliseEstrutura from "@/components/empresa/AnaliseEstrutura";

const WORK = {
  bg: "#F6F9FB",
  surface: "#FFFFFF",
  border: "#E3E8EE",
  accent: "#0B6FA8",
  text: "#1F2328",
  muted: "#5F6368",
};

const STATUSES = ["pendente", "atendido", "nao_aplicavel"];
const statusMeta = {
  pendente: { label: "Pendente", icon: Circle, color: "#F97316" },
  atendido: { label: "Atendido", icon: CheckCircle2, color: "#22C55E" },
  nao_aplicavel: { label: "Não aplicável", icon: MinusCircle, color: "#64748B" },
};

function CargoForm({ companyId, cargo, onClose, onSaved }) {
  const [form, setForm] = useState({
    company_id: companyId,
    nome_cargo: cargo?.nome_cargo || "",
    cbo: cargo?.cbo || "",
    quantidade_funcionarios: cargo?.quantidade_funcionarios || 1,
    riscos_identificados: cargo?.riscos_identificados || [],
    atividades: cargo?.ativividades || cargo?.atividades || "",
    epis_obrigatorios: cargo?.epis_obrigatorios || [],
    procedimentos_emergencia: cargo?.procedimentos_emergencia || "",
  });
  const [riscoInput, setRiscoInput] = useState("");
  const [epiInput, setEpiInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [cboSuggest, setCboSuggest] = useState([]);
  const [showCbo, setShowCbo] = useState(false);

  const onCargoChange = (val) => {
    setForm((f) => ({ ...f, nome_cargo: val }));
    setCboSuggest(searchCbo(val));
    setShowCbo(true);
  };
  const pickCbo = (item) => {
    setForm((f) => ({ ...f, nome_cargo: item.titulo, cbo: item.codigo }));
    setShowCbo(false);
    setCboSuggest([]);
  };

  const addRisco = () => {
    if (!riscoInput.trim()) return;
    setForm((f) => ({ ...f, riscos_identificados: [...f.riscos_identificados, riscoInput.trim()] }));
    setRiscoInput("");
  };
  const addEpi = () => {
    if (!epiInput.trim()) return;
    setForm((f) => ({ ...f, epis_obrigatorios: [...f.epis_obrigatorios, epiInput.trim()] }));
    setEpiInput("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (cargo?.id) {
        await base44.entities.CargoFuncao.update(cargo.id, form);
      } else {
        await base44.entities.CargoFuncao.create(form);
      }
      onSaved();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500";

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
      <div
        className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl border p-5 max-h-[92vh] overflow-y-auto"
        style={{ background: WORK.surface, borderColor: WORK.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: WORK.text }}>
            {cargo ? "Editar cargo" : "Novo cargo/função"}
          </h2>
          <button onClick={onClose} style={{ color: WORK.muted }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Nome do cargo * <span style={{ color: "#64748B" }}>(sugere o CBO)</span></label>
              <input
                className={inputCls}
                style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                value={form.nome_cargo}
                onChange={(e) => onCargoChange(e.target.value)}
                onFocus={() => form.nome_cargo && setShowCbo(true)}
                onBlur={() => setTimeout(() => setShowCbo(false), 150)}
                placeholder="Ex: Soldador"
                required
              />
              {showCbo && cboSuggest.length > 0 && (
                <div className="absolute z-30 mt-1 w-full rounded-lg border shadow-xl overflow-hidden" style={{ background: WORK.bg, borderColor: WORK.border }}>
                  {cboSuggest.map((item) => (
                    <button
                      key={item.codigo}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); pickCbo(item); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-sky-50 flex items-center justify-between gap-2"
                      style={{ color: WORK.text }}
                    >
                      <span>{item.titulo}</span>
                      <span className="text-xs" style={{ color: WORK.accent }}>{item.codigo}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>CBO</label>
              <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                value={form.cbo} onChange={(e) => setForm((f) => ({ ...f, cbo: e.target.value }))} placeholder="Ex: 7242-10" />
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Qtd. funcionários</label>
            <input type="number" min="1" className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
              value={form.quantidade_funcionarios} onChange={(e) => setForm((f) => ({ ...f, quantidade_funcionarios: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Descrição das atividades</label>
            <textarea rows={2} className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
              value={form.atividades} onChange={(e) => setForm((f) => ({ ...f, atividades: e.target.value }))} placeholder="Ex: Soldagem em estrutura metálica, trabalho em altura" />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Riscos identificados</label>
            <div className="flex gap-2 mb-2">
              <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                value={riscoInput} onChange={(e) => setRiscoInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRisco(); } }}
                placeholder="Ex: ruído, fumaça, queda" />
              <button type="button" onClick={addRisco} className="px-3 rounded-lg border" style={{ borderColor: WORK.border, color: WORK.accent }}><Plus size={16} /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.riscos_identificados.map((r, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(249,115,22,0.12)", color: WORK.accent }}>
                  {r}
                  <button type="button" onClick={() => setForm((f) => ({ ...f, riscos_identificados: f.riscos_identificados.filter((_, j) => j !== i) }))}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>EPIs obrigatórios</label>
            <div className="flex gap-2 mb-2">
              <input className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                value={epiInput} onChange={(e) => setEpiInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEpi(); } }}
                placeholder="Ex: capacete, luva, cinto paraquedista" />
              <button type="button" onClick={addEpi} className="px-3 rounded-lg border" style={{ borderColor: WORK.border, color: WORK.accent }}><Plus size={16} /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.epis_obrigatorios.map((r, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>
                  {r}
                  <button type="button" onClick={() => setForm((f) => ({ ...f, epis_obrigatorios: f.epis_obrigatorios.filter((_, j) => j !== i) }))}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Procedimentos de emergência</label>
            <textarea rows={2} className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
              value={form.procedimentos_emergencia} onChange={(e) => setForm((f) => ({ ...f, procedimentos_emergencia: e.target.value }))} placeholder="Ex: Acionar brigada, ponto de encontro..." />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: WORK.border, color: WORK.text }}>Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: WORK.accent, color: "#FFFFFF" }}>
              {saving ? "Salvando..." : "Salvar cargo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmpresaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveCompanyId } = useAppState();
  const [company, setCompany] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCargo, setShowCargo] = useState(false);
  const [editCargo, setEditCargo] = useState(null);
  const [aba, setAba] = useState("geral");

  useEffect(() => { setActiveCompanyId(id); }, [id]);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Company.get(id).catch(() => null),
      base44.entities.CargoFuncao.filter({ company_id: id }).catch(() => []),
      base44.entities.ComplianceItem.filter({ company_id: id }).catch(() => []),
    ]).then(([c, ca, cl]) => {
      setCompany(c);
      setCargos(ca || []);
      setChecklist(cl || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]);

  const cycleStatus = async (item) => {
    const idx = STATUSES.indexOf(item.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    await base44.entities.ComplianceItem.update(item.id, { status: next });
    setChecklist((list) => list.map((i) => (i.id === item.id ? { ...i, status: next } : i)));
  };

  const regenChecklist = async () => {
    if (!company) return;
    await base44.entities.ComplianceItem.deleteMany({ company_id: id });
    // 1. Tenta o mapeamento CNAE→NR editável (importado na Base normativa)
    const maps = await base44.entities.CnaeNrMap.filter({ cnae: company.cnae }).catch(() => []);
    let items;
    if (maps && maps.length > 0) {
      items = maps.map((m) => ({
        nr_codigo: m.nr_codigo,
        item_exigido: m.observacao || `Conformidade com ${m.nr_codigo}`,
      }));
    } else {
      // 2. Fallback: sugestão automática da base geral
      items = buildChecklistItems(company.cnae, company.setor_descricao);
    }
    const created = await base44.entities.ComplianceItem.bulkCreate(
      items.map((it) => ({ ...it, company_id: id }))
    );
    setChecklist(created || []);
  };

  const removeCargo = async (c) => {
    if (!confirm(`Remover cargo ${c.nome_cargo}?`)) return;
    await base44.entities.CargoFuncao.delete(c.id);
    setCargos((list) => list.filter((x) => x.id !== c.id));
  };

  const total = checklist.length;
  const atendidos = checklist.filter((i) => i.status === "atendido").length;

  if (loading) return <div className="p-8 text-center" style={{ color: WORK.muted }}>Carregando...</div>;
  if (!company) return <div className="p-8 text-center" style={{ color: WORK.muted }}>Empresa não encontrada.</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <button onClick={() => navigate("/empresas")} className="flex items-center gap-1 text-sm mb-4" style={{ color: WORK.muted }}>
        <ArrowLeft size={16} /> Empresas
      </button>

      <div className="rounded-lg border p-5 mb-5" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <h1 className="text-xl font-bold mb-1" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>{company.razao_social}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: WORK.muted }}>
          <span>CNPJ: {company.cnpj || "—"}</span>
          <span>CNAE: {company.cnae}</span>
          <span>Porte: {company.porte}</span>
          <span>Grau de risco: {company.grau_de_risco || "—"}</span>
          <span>{company.uf}{company.municipio ? ` · ${company.municipio}` : ""}</span>
        </div>
        {company.setor_descricao && (
          <p className="text-xs mt-2" style={{ color: WORK.muted }}>Atividade: {company.setor_descricao}</p>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto mb-5 pb-1 border-b" style={{ borderColor: WORK.border }}>
        {[
          { id: "geral", label: "Visão geral" },
          { id: "estrutura", label: "Análise da estrutura" },
        ].map((a) => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className="px-4 py-2 text-sm whitespace-nowrap rounded-t-lg"
            style={{ color: aba === a.id ? WORK.accent : WORK.muted, borderBottom: aba === a.id ? `2px solid ${WORK.accent}` : "2px solid transparent", fontWeight: aba === a.id ? 600 : 400 }}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === "estrutura" && <AnaliseEstrutura companyId={id} />}

      {aba === "geral" && (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cargos */}
...
        <TrabalhadoresSection companyId={id} cargos={cargos} />
      </div>
      </>
      )}

      {showCargo && (
        <CargoForm
          companyId={id}
          cargo={editCargo}
          onClose={() => setShowCargo(false)}
          onSaved={() => { setShowCargo(false); load(); }}
        />
      )}
    </div>
  );
}