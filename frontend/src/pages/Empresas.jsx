import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/lib/AppState";
import { base44 } from "@/api/base44Client";
import { buildChecklistItems } from "@/lib/nrKnowledge";
import { lookupCnpj } from "@/lib/externalLookups";
import { Building2, Plus, Trash2, ChevronRight, X, Loader2 } from "lucide-react";
import LocalizarEmpresas from "@/components/empresa/LocalizarEmpresas";

const WORK = {
  bg: "#F6F9FB",
  surface: "#FFFFFF",
  border: "#E3E8EE",
  accent: "#0B6FA8",
  text: "#1F2328",
  muted: "#5F6368",
};

const PORTES = ["MEI", "Pequeno", "Médio", "Grande"];
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function CompanyForm({ onClose, onSaved }) {
  const [form, setForm] = useState({
    razao_social: "",
    cnpj: "",
    cpf: "",
    cei: "",
    cnae: "",
    porte: "Pequeno",
    grau_de_risco: "1",
    uf: "SP",
    municipio: "",
    setor_descricao: "",
    e_matriz: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cnpjLoading, setCnpjLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCnpjLookup = async () => {
    const clean = (form.cnpj || "").replace(/\D/g, "");
    if (clean.length !== 14) return;
    setCnpjLoading(true);
    const data = await lookupCnpj(form.cnpj);
    setCnpjLoading(false);
    if (data) {
      setForm((f) => ({
        ...f,
        razao_social: data.razao_social || f.razao_social,
        cnpj: data.cnpj || f.cnpj,
        cnae: data.cnae || f.cnae,
        setor_descricao: data.setor_descricao || f.setor_descricao,
        uf: data.uf || f.uf,
        municipio: data.municipio || f.municipio,
        porte: data.porte || f.porte,
      }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.razao_social || !form.cnae || !form.uf) {
      setError("Preencha razão social, CNAE e UF.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await base44.entities.Company.create(form);
      // Gera checklist inicial
      const items = buildChecklistItems(form.cnae, form.setor_descricao);
      if (items.length > 0) {
        await base44.entities.ComplianceItem.bulkCreate(
          items.map((it) => ({ ...it, company_id: created.id }))
        );
      }
      onSaved(created);
    } catch (err) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500";

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
      <div
        className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl border p-5 max-h-[90vh] overflow-y-auto"
        style={{ background: WORK.surface, borderColor: WORK.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: WORK.text }}>
            Nova empresa
          </h2>
          <button onClick={onClose} style={{ color: WORK.muted }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Razão social *</label>
            <input
              className={inputCls}
              style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
              value={form.razao_social}
              onChange={(e) => set("razao_social", e.target.value)}
              placeholder="Ex: Metalúrgica ABC Ltda"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block flex items-center gap-1" style={{ color: WORK.muted }}>
                CNPJ {cnpjLoading && <Loader2 size={11} className="animate-spin" />}
                {!cnpjLoading && <span style={{ color: "#64748B" }}>(preenche dados automaticamente)</span>}
              </label>
              <input
                className={inputCls}
                style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                value={form.cnpj}
                onChange={(e) => set("cnpj", e.target.value)}
                onBlur={handleCnpjLookup}
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Porte</label>
              <select
                className={inputCls}
                style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                value={form.porte}
                onChange={(e) => set("porte", e.target.value)}
              >
                {PORTES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>CPF (MEI / autônomo)</label>
              <input
                className={inputCls}
                style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                value={form.cpf}
                onChange={(e) => set("cpf", e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>CEI</label>
              <input
                className={inputCls}
                style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                value={form.cei}
                onChange={(e) => set("cei", e.target.value)}
                placeholder="Matrícula CEI"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>CNAE *</label>
              <input
                className={inputCls}
                style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                value={form.cnae}
                onChange={(e) => set("cnae", e.target.value)}
                placeholder="Ex: 2511-0/00"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Grau de risco</label>
              <select
                className={inputCls}
                style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                value={form.grau_de_risco}
                onChange={(e) => set("grau_de_risco", e.target.value)}
              >
                <option value="1">1 — Baixo</option>
                <option value="2">2 — Médio</option>
                <option value="3">3 — Alto</option>
                <option value="4">4 — Muito alto</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>
              Descrição do setor/atividade (ajuda a gerar o checklist)
            </label>
            <input
              className={inputCls}
              style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
              value={form.setor_descricao}
              onChange={(e) => set("setor_descricao", e.target.value)}
              placeholder="Ex: construção civil, trabalho em altura, máquinas"
            />
          </div>
          <label className="flex items-center gap-2 text-sm" style={{ color: WORK.text }}>
            <input type="checkbox" checked={!!form.e_matriz} onChange={(e) => set("e_matriz", e.target.checked)} />
            Esta é a empresa matriz (gerenciadora) que coordena as demais
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>UF *</label>
              <select
                className={inputCls}
                style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                value={form.uf}
                onChange={(e) => set("uf", e.target.value)}
              >
                {UFS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Município</label>
              <input
                className={inputCls}
                style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
                value={form.municipio}
                onChange={(e) => set("municipio", e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border text-sm font-medium"
              style={{ borderColor: WORK.border, color: WORK.text }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: WORK.accent, color: "#FFFFFF" }}
            >
              {saving ? "Salvando..." : "Cadastrar e gerar checklist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Empresas() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { setActiveCompanyId } = useAppState();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    base44.entities.Company.list("-created_date", 100).then((c) => {
      setCompanies(c);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const open = (c) => {
    setActiveCompanyId(c.id);
    navigate(`/empresas/${c.id}`);
  };

  const remove = async (c) => {
    // Histórico de SST tem guarda legal (prontuário e documentos médicos: 20 anos; laudos e PPP: vida laboral) — não pode ser apagado junto com a empresa
    const conta = async (e) => (await base44.entities[e].filter({ company_id: c.id }, undefined, 1).catch(() => [])).length;
    const [trabs, riscos, atestados, programas, medicoes] = await Promise.all(["Trabalhador", "Risco", "Atestado", "ProgramaSST", "Medicao"].map(conta));
    if (trabs || riscos || atestados || programas || medicoes) {
      alert(`Não é possível excluir ${c.razao_social}: ela tem colaboradores, riscos, atestados, programas ou medições registrados, que precisam ser guardados por exigência legal. Se o contrato terminou, desative o portal do cliente e mantenha a empresa no histórico.`);
      return;
    }
    if (!confirm(`Excluir ${c.razao_social}? A empresa não tem histórico registrado.`)) return;
    await base44.entities.ComplianceItem.deleteMany({ company_id: c.id }).catch(() => {});
    await base44.entities.CargoFuncao.deleteMany({ company_id: c.id }).catch(() => {});
    await base44.entities.Trabalhador.deleteMany({ company_id: c.id }).catch(() => {});
    await base44.entities.Company.delete(c.id);
    load();
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>
            Empresas atendidas
          </h1>
          <p className="text-sm" style={{ color: WORK.muted }}>
            Cadastre e gerencie as empresas-cliente que você acompanha
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm"
          style={{ background: WORK.accent, color: "#FFFFFF" }}
        >
          <Plus size={16} /> Nova empresa
        </button>
      </div>

      {!loading && companies.length > 0 && (
        <div className="mb-6">
          <LocalizarEmpresas companies={companies} onOpen={open} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12" style={{ color: WORK.muted }}>Carregando...</div>
      ) : companies.length === 0 ? (
        <div className="rounded-lg border p-10 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <Building2 size={32} className="mx-auto mb-3" style={{ color: WORK.accent }} />
          <p className="mb-4" style={{ color: WORK.muted }}>Nenhuma empresa cadastrada.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm"
            style={{ background: WORK.accent, color: "#FFFFFF" }}
          >
            <Plus size={16} /> Cadastrar primeira empresa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {companies.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border p-4 flex items-start gap-3"
              style={{ background: WORK.surface, borderColor: WORK.border }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(249,115,22,0.12)" }}
              >
                <Building2 size={18} style={{ color: WORK.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate flex items-center gap-2" style={{ color: WORK.text }}>
                  {c.razao_social}
                  {c.e_matriz && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(11,111,168,0.15)", color: WORK.accent }}>Matriz</span>}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: WORK.muted }}>
                  CNAE {c.cnae} · {c.uf}{c.municipio ? ` · ${c.municipio}` : ""}
                </p>
                {(c.cnpj || c.cpf || c.cei) && (
                  <p className="text-xs mt-0.5" style={{ color: WORK.muted }}>
                    {c.cnpj && `CNPJ ${c.cnpj}`}
                    {c.cnpj && (c.cpf || c.cei) && " · "}
                    {c.cpf && `CPF ${c.cpf}`}
                    {c.cpf && c.cei && " · "}
                    {c.cei && `CEI ${c.cei}`}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => open(c)}
                    className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-md"
                    style={{ background: "rgba(249,115,22,0.12)", color: WORK.accent }}
                  >
                    Abrir <ChevronRight size={12} />
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="text-xs p-1.5 rounded-md"
                    style={{ color: WORK.muted }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <CompanyForm
          onClose={() => setShowForm(false)}
          onSaved={(c) => {
            setShowForm(false);
            load();
            setActiveCompanyId(c.id);
            navigate(`/empresas/${c.id}`);
          }}
        />
      )}
    </div>
  );
}