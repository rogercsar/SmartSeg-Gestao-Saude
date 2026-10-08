import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/lib/AppState";
import { Plus, Search, Users, ArrowRight, Building2, ArrowLeftRight, Loader2 } from "lucide-react";
import TrabalhadorForm from "@/components/empresa/TrabalhadorForm";
import TransferirTrabalhador from "@/components/trabalhador/TransferirTrabalhador";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

export default function Funcionarios() {
  const { activeCompanyId } = useAppState();
  const navigate = useNavigate();
  const [trabalhadores, setTrabalhadores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [transferir, setTransferir] = useState(null);

  const carregar = useCallback(async () => {
    if (!activeCompanyId) { setTrabalhadores([]); setCargos([]); setEmpresa(null); setLoading(false); return; }
    setLoading(true);
    const [trabs, cas, emp] = await Promise.all([
      base44.entities.Trabalhador.filter({ company_id: activeCompanyId }).catch(() => []),
      base44.entities.CargoFuncao.filter({ company_id: activeCompanyId }).catch(() => []),
      base44.entities.Company.get(activeCompanyId).catch(() => null),
    ]);
    setTrabalhadores(trabs || []);
    setCargos(cas || []);
    setEmpresa(emp);
    setLoading(false);
  }, [activeCompanyId]);

  useEffect(() => { carregar(); }, [carregar]);

  const cargoNome = (id) => cargos.find((c) => c.id === id)?.nome_cargo || "—";

  const lista = trabalhadores
    .filter((t) => (filtroStatus ? t.status === filtroStatus : true))
    .filter((t) => (filtroCargo ? t.cargo_id === filtroCargo : true))
    .filter((t) => (busca ? (t.nome || "").toLowerCase().includes(busca.toLowerCase()) : true))
    .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

  if (!activeCompanyId) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="rounded-lg border p-10 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <Building2 size={32} className="mx-auto mb-3" style={{ color: WORK.accent }} />
          <p className="mb-2" style={{ color: WORK.muted }}>Selecione uma empresa no seletor do menu para ver os funcionários.</p>
          <Link to="/empresas" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm"
            style={{ background: WORK.accent, color: "#FFFFFF" }}>
            <Plus size={16} /> Cadastrar empresa
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>Funcionários</h1>
          <p className="text-sm" style={{ color: WORK.muted }}>
            {empresa?.razao_social || "—"} · {trabalhadores.length} cadastrado(s)
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm"
          style={{ background: WORK.accent, color: "#FFFFFF" }}>
          <Plus size={16} /> Novo
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border" style={{ borderColor: WORK.border, background: WORK.surface }}>
          <Search size={15} style={{ color: WORK.muted }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome…"
            className="text-sm outline-none w-44" style={{ color: WORK.text }} />
        </div>
        <select value={filtroCargo} onChange={(e) => setFiltroCargo(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
          <option value="">Todos os cargos</option>
          {cargos.map((c) => <option key={c.id} value={c.id}>{c.nome_cargo}</option>)}
        </select>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
          <option value="">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center"><Loader2 size={22} className="animate-spin mx-auto" style={{ color: WORK.muted }} /></div>
      ) : lista.length === 0 ? (
        <div className="rounded-lg border p-10 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <Users size={28} className="mx-auto mb-2" style={{ color: WORK.muted }} />
          <p className="text-sm mb-3" style={{ color: WORK.muted }}>Nenhum funcionário encontrado.</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm"
            style={{ background: WORK.accent, color: "#FFFFFF" }}><Plus size={16} /> Cadastrar funcionário</button>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map((t) => (
            <div key={t.id} className="rounded-lg border p-3 flex items-center gap-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
              <button onClick={() => navigate(`/trabalhadores/${t.id}`)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: "rgba(249,115,22,0.15)", color: WORK.accent }}>
                  {(t.nome || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: WORK.text }}>{t.nome}</p>
                  <p className="text-xs truncate" style={{ color: WORK.muted }}>{cargoNome(t.cargo_id)}{t.matricula ? ` · mat. ${t.matricula}` : ""}</p>
                </div>
                <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: t.status === "ativo" ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)", color: t.status === "ativo" ? "#22c55e" : WORK.muted }}>
                  {t.status === "ativo" ? "Ativo" : "Inativo"}
                </span>
              </button>
              <button onClick={() => setTransferir(t)} title="Transferir para outra empresa"
                className="text-xs p-2 rounded-md shrink-0" style={{ color: WORK.muted }}>
                <ArrowLeftRight size={15} />
              </button>
              <button onClick={() => navigate(`/trabalhadores/${t.id}`)} title="Abrir ficha"
                className="text-xs p-2 rounded-md shrink-0" style={{ color: WORK.accent }}>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TrabalhadorForm companyId={activeCompanyId} cargos={cargos}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); carregar(); }} />
      )}
      {transferir && (
        <TransferirTrabalhador trabalhador={transferir}
          onClose={() => setTransferir(null)}
          onDone={() => { setTransferir(null); carregar(); }} />
      )}
    </div>
  );
}