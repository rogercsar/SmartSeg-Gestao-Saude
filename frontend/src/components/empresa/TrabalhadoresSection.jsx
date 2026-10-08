import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Users, ChevronRight } from "lucide-react";
import TrabalhadorForm from "@/components/empresa/TrabalhadorForm";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

export default function TrabalhadoresSection({ companyId, cargos }) {
  const [trabalhadores, setTrabalhadores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", cargo_id: "", data_admissao: "", cpf: "" });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    base44.entities.Trabalhador.filter({ company_id: companyId }).then(setTrabalhadores).catch(() => {});
  };

  useEffect(() => { load(); }, [companyId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nome) return;
    setSaving(true);
    try {
      await base44.entities.Trabalhador.create({ ...form, company_id: companyId });
      setForm({ nome: "", cargo_id: "", data_admissao: "", cpf: "" });
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t) => {
    // Com histórico (atestados, EPI, treinamentos), o colaborador é desligado/inativado — não apagado
    const conta = async (e) => (await base44.entities[e].filter({ trabalhador_id: t.id }, undefined, 1).catch(() => [])).length;
    const historico = (await Promise.all(["Atestado", "EntregaEpi", "Treinamento", "OcorrenciaAcidente"].map(conta))).some(Boolean);
    if (historico) {
      if (!confirm(`${t.nome} tem histórico de SST (atestados, EPI, treinamentos ou acidentes), que precisa ser guardado. Marcar como INATIVO em vez de excluir?`)) return;
      await base44.entities.Trabalhador.update(t.id, { status: "inativo" });
      setTrabalhadores((list) => list.map((x) => (x.id === t.id ? { ...x, status: "inativo" } : x)));
      return;
    }
    if (!confirm(`Excluir ${t.nome}? Não há histórico registrado.`)) return;
    await base44.entities.Trabalhador.delete(t.id);
    setTrabalhadores((list) => list.filter((x) => x.id !== t.id));
  };

  const cargoNome = (id) => cargos.find((c) => c.id === id)?.nome_cargo || "—";
  const inputCls = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold" style={{ color: WORK.text }}>Trabalhadores</h2>
        <button onClick={() => setShowForm((s) => !s)} className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-md" style={{ background: "rgba(249,115,22,0.12)", color: WORK.accent }}>
          <Plus size={14} /> Novo
        </button>
      </div>

      {showForm && (
        <div className="mb-3">
          <TrabalhadorForm companyId={companyId} cargos={cargos}
            onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
        </div>
      )}

      <div className="space-y-2">
        {trabalhadores.length === 0 && !showForm && (
          <div className="rounded-lg border p-6 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <Users size={24} className="mx-auto mb-2" style={{ color: WORK.muted }} />
            <p className="text-sm" style={{ color: WORK.muted }}>Nenhum trabalhador cadastrado.</p>
          </div>
        )}
        {trabalhadores.map((t) => (
          <div key={t.id} className="rounded-lg border p-3 flex items-center justify-between" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <button onClick={() => navigate(`/trabalhadores/${t.id}`)} className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium flex items-center gap-1" style={{ color: WORK.text }}>
                {t.nome}
                {t.status === "inativo" && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(148,163,184,0.15)", color: WORK.muted }}>inativo</span>}
              </p>
              <p className="text-xs" style={{ color: WORK.muted }}>{cargoNome(t.cargo_id)}{t.data_admissao ? ` · admissão ${new Date(t.data_admissao).toLocaleDateString("pt-BR")}` : ""}</p>
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => navigate(`/trabalhadores/${t.id}`)} className="text-xs px-2 py-1 rounded" style={{ color: WORK.accent }}><ChevronRight size={16} /></button>
              <button onClick={() => remove(t)} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}