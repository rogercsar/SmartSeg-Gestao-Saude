import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Building2, ShieldAlert, Grid3x3, Stethoscope, Scale, ClipboardList, FileText, Loader2, Gauge, Paperclip, History, ListChecks } from "lucide-react";
import { WORK } from "@/lib/sst";
import { useAppState } from "@/lib/AppState";
import Estrutura from "@/components/programas/Estrutura";
import Riscos from "@/components/programas/Riscos";
import Matriz from "@/components/programas/Matriz";
import Pcmso from "@/components/programas/Pcmso";
import Laudos from "@/components/programas/Laudos";
import Levantamentos from "@/components/programas/Levantamentos";
import DocumentosProgramas from "@/components/programas/DocumentosProgramas";
import Medicoes from "@/components/programas/Medicoes";
import Anexos from "@/components/programas/Anexos";
import HistoricoInventario from "@/components/programas/HistoricoInventario";
import PlanoAcaoAba from "@/components/programas/PlanoAcaoAba";

const ABAS = [
  { id: "estrutura", label: "1. Estrutura", icon: Building2 },
  { id: "riscos", label: "2. Riscos", icon: ShieldAlert },
  { id: "medicoes", label: "Medições", icon: Gauge },
  { id: "matriz", label: "3. Matriz", icon: Grid3x3 },
  { id: "pcmso", label: "4. PCMSO", icon: Stethoscope },
  { id: "laudos", label: "5. LTCAT e laudos", icon: Scale },
  { id: "planos", label: "Plano de ação", icon: ListChecks },
  { id: "levantamentos", label: "Levantamentos", icon: ClipboardList },
  { id: "anexos", label: "Anexos", icon: Paperclip },
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "historico", label: "Histórico", icon: History },
];

const ENTIDADES = {
  unidades: "Unidade",
  setores: "Setor",
  cargos: "CargoFuncao",
  trabalhadores: "Trabalhador",
  riscos: "Risco",
  exames: "ExamePcmso",
  programas: "ProgramaSST",
  levantamentos: "Levantamento",
  medicoes: "Medicao",
  anexos: "Anexo",
  planos_acao: "PlanoAcao",
};

export default function Programas() {
  const [params, setParams] = useSearchParams();
  const { activeCompanyId, setActiveCompanyId } = useAppState();
  const [empresas, setEmpresas] = useState([]);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const empresaId = params.get("empresa") || "";
  const aba = params.get("aba") || "estrutura";

  useEffect(() => {
    base44.entities.Company.list("razao_social", 500).then((l) => {
      setEmpresas(l || []);
      if (!empresaId) {
        const alvo = activeCompanyId && l?.some((x) => x.id === activeCompanyId) ? activeCompanyId : l?.length === 1 ? l[0].id : "";
        if (alvo) setParams({ empresa: alvo, aba });
      }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recarregar = useCallback(async () => {
    if (!empresaId) { setDados(null); return; }
    setCarregando(true);
    try {
      const empresa = await base44.entities.Company.get(empresaId);
      const listas = await Promise.all(
        Object.values(ENTIDADES).map((e) => base44.entities[e].filter({ company_id: empresaId }).catch(() => []))
      );
      const d = { empresa };
      Object.keys(ENTIDADES).forEach((k, i) => { d[k] = listas[i] || []; });
      d.equipamentos = await base44.entities.Equipamento.list("modelo", 200).catch(() => []);
      setDados(d);
    } finally {
      setCarregando(false);
    }
  }, [empresaId]);

  useEffect(() => { recarregar(); }, [recarregar]);
  useEffect(() => { if (empresaId && empresaId !== activeCompanyId) setActiveCompanyId(empresaId); }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const mudar = (novo) => setParams({ empresa: empresaId, aba, ...novo });
  const props = { dados, recarregar, irPara: (a) => mudar({ aba: a }) };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: WORK.text }}>Programas e laudos</h1>
      <p className="text-sm mb-5" style={{ color: WORK.muted }}>
        PGR, PCMSO, LTCAT, insalubridade e periculosidade a partir da estrutura da empresa, com apoio de IA.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={empresaId} onChange={(e) => mudar({ empresa: e.target.value, aba: "estrutura" })}
          className="px-3 py-2 rounded-lg border text-sm min-w-[260px]" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
          <option value="">Selecione a empresa…</option>
          {empresas.map((e) => <option key={e.id} value={e.id}>{e.razao_social}</option>)}
        </select>
        <Link to="/empresas" className="text-sm underline" style={{ color: WORK.muted }}>Cadastrar empresa</Link>
        {carregando && <Loader2 size={16} className="animate-spin" style={{ color: WORK.muted }} />}
      </div>

      {!empresaId && (
        <p className="text-sm" style={{ color: WORK.muted }}>Selecione uma empresa para começar. O fluxo segue a ordem das abas: estrutura → riscos → matriz → PCMSO → laudos → documentos.</p>
      )}

      {empresaId && dados && (
        <>
          <div className="flex gap-1 overflow-x-auto mb-5 pb-1 border-b" style={{ borderColor: WORK.border }}>
            {ABAS.map((a) => {
              const Icone = a.icon;
              const ativa = a.id === aba;
              return (
                <button key={a.id} onClick={() => mudar({ aba: a.id })}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap rounded-t-lg"
                  style={{ color: ativa ? WORK.accent : WORK.muted, borderBottom: ativa ? `2px solid ${WORK.accent}` : "2px solid transparent" }}>
                  <Icone size={15} /> {a.label}
                </button>
              );
            })}
          </div>
          {aba === "estrutura" && <Estrutura {...props} />}
          {aba === "riscos" && <Riscos {...props} />}
          {aba === "medicoes" && <Medicoes {...props} />}
          {aba === "anexos" && <Anexos {...props} />}
          {aba === "matriz" && <Matriz {...props} />}
          {aba === "pcmso" && <Pcmso {...props} />}
          {aba === "laudos" && <Laudos {...props} />}
          {aba === "levantamentos" && <Levantamentos {...props} />}
          {aba === "documentos" && <DocumentosProgramas {...props} />}
          {aba === "historico" && <HistoricoInventario {...props} />}
          {aba === "planos" && <PlanoAcaoAba {...props} />}
        </>
      )}
    </div>
  );
}