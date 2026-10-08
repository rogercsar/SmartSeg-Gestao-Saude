import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAppState } from "@/lib/AppState";
import { WORK } from "@/lib/sst";
import { EVENTOS_ESOCIAL, STATUS_EVENTO, derivarEventos, consolidarEventos, ehConcluido } from "@/lib/esocialDerivacao";
import { Loader2, ChevronDown, ChevronRight, Search, CheckCircle2, AlertTriangle, Clock, FileCheck2, ExternalLink, Filter } from "lucide-react";

const fetchAll = async (entityName, query, sort) => {
  try {
    const res = await base44.entities[entityName].filter(query, { limit: 500, ...(sort ? { sort } : {}) });
    return res.items || res || [];
  } catch {
    return [];
  }
};

const dataBR = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—");

function BadgeStatus({ status }) {
  const s = STATUS_EVENTO[status] || STATUS_EVENTO.pendente;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: s.cor + "22", color: s.cor, border: `1px solid ${s.cor}55` }}>
      {s.label}
    </span>
  );
}

function CardResumo({ icon: Icon, label, valor, cor, sub }) {
  return (
    <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: cor + "18" }}>
        <Icon size={20} style={{ color: cor }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: WORK.muted }}>{label}</p>
        <p className="text-xl font-bold leading-tight" style={{ color: WORK.text }}>{valor}</p>
        {sub && <p className="text-[11px] truncate" style={{ color: WORK.muted }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function Esocial() {
  const { user } = useAuth();
  const { activeCompanyId } = useAppState();
  const isAdmin = user?.role === "admin";

  const [visao, setVisao] = useState("empresa");
  const [carregando, setCarregando] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [trabalhadores, setTrabalhadores] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [ctx, setCtx] = useState({});
  const [erroCarga, setErroCarga] = useState("");

  // filtros
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroCarga("");
    try {
      let listaEmpresas;
      if (visao === "empresa") {
        if (!activeCompanyId) { setEmpresas([]); setTrabalhadores([]); setEventos([]); setCtx({}); return; }
        const emp = await base44.entities.Company.get(activeCompanyId).catch(() => null);
        listaEmpresas = emp ? [emp] : [];
      } else {
        listaEmpresas = await base44.entities.Company.list("razao_social", 500).catch(() => []);
      }
      setEmpresas(listaEmpresas || []);
      const ids = (listaEmpresas || []).map((e) => e.id);
      if (!ids.length) { setTrabalhadores([]); setEventos([]); setCtx({}); return; }

      const query = visao === "empresa" ? { company_id: activeCompanyId } : {};
      const [trabs, evts, lotacao, atestados, riscos, treinamentos, cargos, ocorrencias] = await Promise.all([
        fetchAll("Trabalhador", query, "nome"),
        fetchAll("EventoEsocial", query, "-data_evento"),
        fetchAll("LotacaoHistorico", query),
        fetchAll("Atestado", query),
        fetchAll("Risco", query),
        fetchAll("Treinamento", query),
        fetchAll("CargoFuncao", query),
        fetchAll("OcorrenciaAcidente", query),
      ]);
      setTrabalhadores(trabs);
      setEventos(evts);
      setCtx({ lotacao, atestados, riscos, treinamentos, cargos, ocorrencias });
    } catch (e) {
      setErroCarga(e?.message || "Falha ao carregar.");
    } finally {
      setCarregando(false);
    }
  }, [visao, activeCompanyId]);

  useEffect(() => { carregar(); }, [carregar]);

  // consolida por trabalhador
  const consolidado = useMemo(() => {
    return trabalhadores.map((t) => {
      const esperados = derivarEventos(t, ctx);
      const regs = eventos.filter((e) => e.trabalhador_id === t.id);
      const lista = consolidarEventos(esperados, regs);
      const empresa = empresas.find((e) => e.id === t.company_id);
      return { trabalhador: t, empresa, eventos: lista };
    });
  }, [trabalhadores, eventos, ctx, empresas]);

  // aplica filtros
  const filtrado = useMemo(() => {
    return consolidado
      .map((g) => ({
        ...g,
        eventos: g.eventos.filter((ev) => {
          if (filtroTipo && ev.tipo !== filtroTipo) return false;
          if (filtroStatus && ev.status !== filtroStatus) return false;
          return true;
        }),
      }))
      .filter((g) => {
        if (filtroEmpresa && g.trabalhador.company_id !== filtroEmpresa) return false;
        if (busca && !(g.trabalhador.nome || "").toLowerCase().includes(busca.toLowerCase())) return false;
        return g.eventos.length > 0;
      });
  }, [consolidado, filtroTipo, filtroStatus, filtroEmpresa, busca]);

  // resumo
  const resumo = useMemo(() => {
    const todos = filtrado.flatMap((g) => g.eventos);
    const transmitidos = todos.filter((e) => ehConcluido(e.status)).length;
    const pendentes = todos.filter((e) => e.status === "pendente").length;
    const erros = todos.filter((e) => e.status === "erro").length;
    const rascunhos = todos.filter((e) => e.status === "rascunho").length;
    const porTipo = {};
    todos.forEach((e) => { porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1; });
    return { total: todos.length, transmitidos, pendentes, erros, rascunhos, porTipo };
  }, [filtrado]);

  const semEmpresa = visao === "empresa" && !activeCompanyId;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: WORK.text }}>Painel eSocial</h1>
          <p className="text-sm" style={{ color: WORK.muted }}>
            Acompanhamento dos eventos enviados e pendentes por trabalhador, derivados do ciclo de vida e dos riscos do cargo.
          </p>
        </div>
        {isAdmin && (
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: WORK.border }}>
            <button onClick={() => setVisao("empresa")} className="px-3 py-2 text-sm font-medium"
              style={{ background: visao === "empresa" ? WORK.accent : WORK.surface, color: visao === "empresa" ? "#fff" : WORK.text }}>
              Empresa atual
            </button>
            <button onClick={() => setVisao("geral")} className="px-3 py-2 text-sm font-medium"
              style={{ background: visao === "geral" ? WORK.accent : WORK.surface, color: visao === "geral" ? "#fff" : WORK.text }}>
              Visão geral
            </button>
          </div>
        )}
      </div>

      {semEmpresa && (
        <div className="mt-6 rounded-lg border p-4 text-sm" style={{ borderColor: WORK.border, color: WORK.muted, background: WORK.surface }}>
          Selecione uma empresa no seletor do menu para acompanhar as obrigações do eSocial.
        </div>
      )}

      {carregando && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: WORK.accent }} />
        </div>
      )}

      {!carregando && !semEmpresa && (
        <>
          {erroCarga && <p className="text-sm text-red-600 mb-3">{erroCarga}</p>}

          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <CardResumo icon={CheckCircle2} label="Transmitidos / processados" valor={resumo.transmitidos} cor="#22C55E" />
            <CardResumo icon={Clock} label="Pendentes" valor={resumo.pendentes} cor="#F59E0B" />
            <CardResumo icon={AlertTriangle} label="Com erro" valor={resumo.erros} cor="#EF4444" />
            <CardResumo icon={FileCheck2} label="Total de eventos" valor={resumo.total} cor={WORK.accent} sub={`${resumo.rascunhos} em rascunho`} />
          </div>

          {/* Distribuição por tipo */}
          {Object.keys(resumo.porTipo).length > 0 && (
            <div className="mt-3 rounded-xl border p-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
              <p className="text-xs mb-2" style={{ color: WORK.muted }}>Distribuição por tipo de evento</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(resumo.porTipo).sort((a, b) => b[1] - a[1]).map(([tipo, n]) => {
                  const info = EVENTOS_ESOCIAL[tipo] || {};
                  return (
                    <span key={tipo} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full" style={{ background: (info.cor || "#94A3B8") + "18", color: info.cor || "#94A3B8" }}>
                      {tipo} <b>{n}</b>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border" style={{ borderColor: WORK.border, background: WORK.surface }}>
              <Search size={15} style={{ color: WORK.muted }} />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar trabalhador…"
                className="text-sm outline-none w-40" style={{ color: WORK.text }} />
            </div>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
              <option value="">Todos os eventos</option>
              {Object.keys(EVENTOS_ESOCIAL).map((k) => <option key={k} value={k}>{k} — {EVENTOS_ESOCIAL[k].nome}</option>)}
            </select>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
              <option value="">Todos os status</option>
              {Object.keys(STATUS_EVENTO).map((k) => <option key={k} value={k}>{STATUS_EVENTO[k].label}</option>)}
            </select>
            {visao === "geral" && (
              <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm min-w-[200px]" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
                <option value="">Todas as empresas</option>
                {empresas.map((e) => <option key={e.id} value={e.id}>{e.razao_social}</option>)}
              </select>
            )}
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: WORK.muted }}>
              <Filter size={13} /> {filtrado.length} trabalhador(es)
            </span>
          </div>

          {/* Lista agrupada por trabalhador */}
          <div className="mt-4 space-y-2">
            {filtrado.length === 0 && (
              <p className="text-sm py-10 text-center" style={{ color: WORK.muted }}>
                Nenhum evento para os filtros selecionados.
              </p>
            )}
            {filtrado.map((g) => {
              const aberto = expandido === g.trabalhador.id;
              const pend = g.eventos.filter((e) => e.status === "pendente").length;
              const err = g.eventos.filter((e) => e.status === "erro").length;
              const ok = g.eventos.filter((e) => ehConcluido(e.status)).length;
              return (
                <div key={g.trabalhador.id} className="rounded-xl border overflow-hidden" style={{ background: WORK.surface, borderColor: WORK.border }}>
                  <button onClick={() => setExpandido(aberto ? null : g.trabalhador.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left">
                    {aberto ? <ChevronDown size={16} style={{ color: WORK.muted }} /> : <ChevronRight size={16} style={{ color: WORK.muted }} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: WORK.text }}>{g.trabalhador.nome}</p>
                      <p className="text-xs truncate" style={{ color: WORK.muted }}>
                        {g.empresa?.razao_social || "—"} · {g.eventos.length} evento(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ok > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#22C55E22", color: "#16A34A" }}>{ok} ok</span>}
                      {pend > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#F59E0B22", color: "#D97706" }}>{pend} pend.</span>}
                      {err > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#EF444422", color: "#DC2626" }}>{err} erro</span>}
                    </div>
                  </button>
                  {aberto && (
                    <div className="border-t" style={{ borderColor: WORK.border }}>
                      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2" style={{ background: WORK.bg }}>
                        <span className="text-xs" style={{ color: WORK.muted }}>Eventos derivados do ciclo de vida e dos riscos do cargo</span>
                        <Link to={`/trabalhadores/${g.trabalhador.id}`} className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: WORK.accent }}>
                          Abrir detalhe do trabalhador <ExternalLink size={12} />
                        </Link>
                      </div>
                      <div className="divide-y" style={{ borderColor: WORK.border }}>
                        {g.eventos.map((ev, i) => {
                          const info = EVENTOS_ESOCIAL[ev.tipo] || {};
                          return (
                            <div key={i} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                              <span className="inline-flex items-center text-xs font-semibold w-16 shrink-0" style={{ color: info.cor || WORK.text }}>{ev.tipo}</span>
                              <span className="text-sm flex-1 min-w-0 truncate" style={{ color: WORK.text }}>{ev.descricao}</span>
                              <span className="text-xs" style={{ color: WORK.muted }}>{dataBR(ev.data_evento)}</span>
                              <BadgeStatus status={ev.status} />
                              {ev.recibo && <span className="text-[11px]" style={{ color: WORK.muted }}>recibo {ev.recibo}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] mt-6" style={{ color: WORK.muted }}>
            Os eventos pendentes são derivados automaticamente do cadastro, lotação, atestados, riscos e treinamentos. O envio efetivo ao eSocial é feito pelo módulo eSocial; esta tela é de acompanhamento.
          </p>
        </>
      )}
    </div>
  );
}