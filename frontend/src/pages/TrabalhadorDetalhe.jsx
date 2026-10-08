import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import TabPerfil from "@/components/trabalhador/TabPerfil";
import TabSaude from "@/components/trabalhador/TabSaude";
import TabSeguranca from "@/components/trabalhador/TabSeguranca";
import TabDocumentos from "@/components/trabalhador/TabDocumentos";
import TabMovimentacoes from "@/components/trabalhador/TabMovimentacoes";
import TabAnexos from "@/components/trabalhador/TabAnexos";
import TabEsocial from "@/components/trabalhador/TabEsocial";
import { ArrowLeft, Briefcase, Calendar, IdCard, FileText, ShieldCheck, FileBarChart, Stethoscope, Paperclip, ArrowLeftRight } from "lucide-react";
import TransferirTrabalhador from "@/components/trabalhador/TransferirTrabalhador";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

const TABS = [
  { id: "perfil", label: "Perfil" },
  { id: "saude", label: "Saúde" },
  { id: "seguranca", label: "Segurança" },
  { id: "documentos", label: "Documentos" },
  { id: "anexos", label: "Anexos" },
  { id: "esocial", label: "eSocial" },
  { id: "movimentacoes", label: "Movimentações" },
];

function calcIdade(dataNasc) {
  if (!dataNasc) return "—";
  const diff = Date.now() - new Date(dataNasc).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000)) + " anos";
}

function calcTempoServico(dataAdmissao, dataDemissao) {
  if (!dataAdmissao) return "—";
  const inicio = new Date(dataAdmissao);
  const fim = dataDemissao ? new Date(dataDemissao) : new Date();
  const diff = fim - inicio;
  const anos = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  const meses = Math.floor((diff % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000));
  if (anos > 0) return `${anos} ano${anos > 1 ? "s" : ""} e ${meses} mes${meses > 1 ? "es" : ""}`;
  return `${meses} mes${meses > 1 ? "es" : ""}`;
}

export default function TrabalhadorDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trabalhador, setTrabalhador] = useState(null);
  const [company, setCompany] = useState(null);
  const [cargo, setCargo] = useState(null);
  const [setor, setSetor] = useState(null);
  const [unidade, setUnidade] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [riscos, setRiscos] = useState([]);
  const [exames, setExames] = useState([]);
  const [vacinas, setVacinas] = useState([]);
  const [tab, setTab] = useState("perfil");
  const [loading, setLoading] = useState(true);
  const [showTransferir, setShowTransferir] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const t = await base44.entities.Trabalhador.get(id);
      setTrabalhador(t);

      const [comp, allCompanies, allCargos, allSetores, allUnidades] = await Promise.all([
        base44.entities.Company.get(t.company_id),
        base44.entities.Company.list("-created_date", 200),
        base44.entities.CargoFuncao.filter({ company_id: t.company_id }),
        base44.entities.Setor.filter({ company_id: t.company_id }),
        base44.entities.Unidade.filter({ company_id: t.company_id }),
      ]);
      setCompany(comp);
      setCompanies(allCompanies);
      setCargos(allCargos || []);
      setSetores(allSetores || []);
      setUnidades(allUnidades || []);

      if (t.cargo_id) {
        const c = allCargos?.find((x) => x.id === t.cargo_id);
        setCargo(c || null);
        // Carrega riscos e exames para a aba de documentos (PPP)
        const [rc, ex] = await Promise.all([
          base44.entities.Risco.filter({ company_id: t.company_id, cargo_ids: { $in: [t.cargo_id] } }),
          base44.entities.ExamePcmso.filter({ company_id: t.company_id, cargo_id: t.cargo_id }),
        ]);
        setRiscos(rc || []);
        setExames(ex || []);
      }
      if (t.setor_id) setSetor(allSetores?.find((s) => s.id === t.setor_id) || null);
      if (t.unidade_id) setUnidade(allUnidades?.find((u) => u.id === t.unidade_id) || null);

      const vc = await base44.entities.Vacina.filter({ trabalhador_id: t.id });
      setVacinas(vc || []);
    } catch (e) {
      alert("Erro ao carregar trabalhador: " + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="p-8 text-center" style={{ color: WORK.muted }}>Carregando...</div>;
  if (!trabalhador) return <div className="p-8 text-center" style={{ color: WORK.muted }}>Trabalhador não encontrado.</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm mb-4" style={{ color: WORK.muted }}>
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Header */}
      <div className="rounded-lg border p-5 mb-5" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0" style={{ background: "rgba(249,115,22,0.15)", color: WORK.accent }}>
            {trabalhador.nome?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>{trabalhador.nome}</h1>
              <div className="flex flex-wrap gap-2 mt-1">
                <a href={`/ppp?trabalhador=${trabalhador.id}`} target="_blank" rel="noreferrer" className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: WORK.border, color: WORK.accent }}>Gerar PPP</a>
                <a href={`/epi/ficha?trabalhador=${trabalhador.id}`} target="_blank" rel="noreferrer" className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: WORK.border, color: WORK.accent }}>Ficha de EPI</a>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: trabalhador.status === "ativo" ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)", color: trabalhador.status === "ativo" ? "#22c55e" : WORK.muted }}>
                {trabalhador.status === "ativo" ? "Ativo" : "Inativo"}
              </span>
              {trabalhador.brigada && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>Brigada</span>}
              {trabalhador.cipa_cargo && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>CIPA: {trabalhador.cipa_cargo.replace("_", " ")}</span>}
              {trabalhador.estabilidade?.tem && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(234,179,8,0.15)", color: "#fbbf24" }}>Estabilidade</span>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: WORK.muted }}>
              <span className="flex items-center gap-1"><Briefcase size={11} /> {cargo?.nome_cargo || "—"}</span>
              <span className="flex items-center gap-1"><IdCard size={11} /> Matrícula: {trabalhador.matricula || "—"}</span>
              <span className="flex items-center gap-1"><Calendar size={11} /> Admissão: {trabalhador.data_admissao ? new Date(trabalhador.data_admissao).toLocaleDateString("pt-BR") : "—"}</span>
              <span className="flex items-center gap-1"><Calendar size={11} /> Idade: {calcIdade(trabalhador.data_nascimento)}</span>
              <span className="flex items-center gap-1"><Calendar size={11} /> Tempo de serviço: {calcTempoServico(trabalhador.data_admissao, trabalhador.data_demissao)}</span>
              {trabalhador.sexo && <span>Sexo: {trabalhador.sexo === "M" ? "Masculino" : "Feminino"}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setShowTransferir(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: WORK.border, color: WORK.accent, background: WORK.surface }}>
          <ArrowLeftRight size={14} /> Transferir
        </button>
        <button onClick={() => navigate(`/documentos?type=ordem_servico`)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: WORK.border, color: WORK.text, background: WORK.surface }}>
          <FileText size={14} /> Ordem de Serviço
        </button>
        <button onClick={() => navigate(`/epi/ficha?trabalhador=${trabalhador.id}`)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: WORK.border, color: WORK.text, background: WORK.surface }}>
          <ShieldCheck size={14} /> Ficha EPI
        </button>
        <button onClick={() => navigate(`/documentos?type=ppp`)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: WORK.border, color: WORK.text, background: WORK.surface }}>
          <FileBarChart size={14} /> PPP
        </button>
        <button onClick={() => setTab("saude")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: WORK.border, color: WORK.text, background: WORK.surface }}>
          <Stethoscope size={14} /> Exames / Atestado
        </button>
        <button onClick={() => setTab("anexos")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: WORK.border, color: WORK.text, background: WORK.surface }}>
          <Paperclip size={14} /> Anexos
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
            style={{
              background: tab === t.id ? WORK.accent : WORK.surface,
              color: tab === t.id ? "#FFFFFF" : WORK.muted,
              border: `1px solid ${tab === t.id ? WORK.accent : WORK.border}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "perfil" && <TabPerfil trabalhador={trabalhador} onUpdate={load} />}
      {tab === "saude" && <TabSaude trabalhador={trabalhador} cargo={cargo} />}
      {tab === "seguranca" && <TabSeguranca trabalhador={trabalhador} cargo={cargo} />}
      {tab === "documentos" && <TabDocumentos trabalhador={trabalhador} company={company} cargo={cargo} riscos={riscos} exames={exames} vacinas={vacinas} />}
      {tab === "anexos" && <TabAnexos trabalhador={trabalhador} />}
      {tab === "esocial" && <TabEsocial trabalhador={trabalhador} />}
      {tab === "movimentacoes" && (
        <TabMovimentacoes
          trabalhador={trabalhador} cargo={cargo} setor={setor} unidade={unidade}
          cargos={cargos} setores={setores} unidades={unidades} companies={companies}
          onUpdate={load}
        />
      )}

      {showTransferir && (
        <TransferirTrabalhador trabalhador={trabalhador}
          onClose={() => setShowTransferir(false)}
          onDone={() => { setShowTransferir(false); load(); }} />
      )}
    </div>
  );
}