import React, { useEffect, useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/lib/AppState";
import { WORK } from "@/lib/sst";
import { TIPOS_DOC_TERCEIRO, STATUS_TERCEIRA, statusDocumento, statusContrato, resumoDocumentos, dataBR } from "@/lib/terceiros";
import { linkTemporario } from "@/lib/privateFiles";
import TerceiraForm from "@/components/terceiros/TerceiraForm";
import DocumentoTerceiroForm from "@/components/terceiros/DocumentoTerceiroForm";
import { Loader2, Plus, Search, Building2, AlertTriangle, Clock, ChevronRight, ChevronDown, Pencil, Trash2, Paperclip, ExternalLink, FileWarning } from "lucide-react";

const fetchAll = async (entityName, query, sort) => {
  try {
    const res = await base44.entities[entityName].filter(query, { limit: 500, ...(sort ? { sort } : {}) });
    return res.items || res || [];
  } catch {
    return [];
  }
};

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

function Badge({ cor, children }) {
  return <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: cor + "22", color: cor, border: `1px solid ${cor}55` }}>{children}</span>;
}

export default function Terceiros() {
  const { activeCompanyId } = useAppState();
  const [carregando, setCarregando] = useState(false);
  const [terceiras, setTerceiras] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [soAlertas, setSoAlertas] = useState(false);
  const [expandido, setExpandido] = useState(null);

  const [formAberto, setFormAberto] = useState(false);
  const [terceiraEdit, setTerceiraEdit] = useState(null);
  const [docForm, setDocForm] = useState({ aberto: false, terceiraId: null, doc: null });

  const carregar = useCallback(async () => {
    if (!activeCompanyId) { setTerceiras([]); setDocumentos([]); return; }
    setCarregando(true);
    try {
      const [tercs, docs, sets, cargs] = await Promise.all([
        fetchAll("Terceira", { company_id: activeCompanyId }, "razao_social"),
        fetchAll("DocumentoTerceiro", { company_id: activeCompanyId }, "-data_validade"),
        fetchAll("Setor", { company_id: activeCompanyId }, "nome"),
        fetchAll("CargoFuncao", { company_id: activeCompanyId }, "nome_cargo"),
      ]);
      setTerceiras(tercs);
      setDocumentos(docs);
      setSetores(sets);
      setCargos(cargs);
    } finally {
      setCarregando(false);
    }
  }, [activeCompanyId]);

  useEffect(() => { carregar(); }, [carregar]);

  const docsPorTerceira = useMemo(() => {
    const m = {};
    documentos.forEach((d) => { (m[d.terceira_id] = m[d.terceira_id] || []).push(d); });
    return m;
  }, [documentos]);

  const filtrado = useMemo(() => {
    return terceiras
      .map((t) => {
        const docs = docsPorTerceira[t.id] || [];
        const resumo = resumoDocumentos(docs);
        const contr = statusContrato(t);
        return { terceira: t, docs, resumo, contr };
      })
      .filter((g) => {
        if (busca && !(g.terceira.razao_social || "").toLowerCase().includes(busca.toLowerCase())) return false;
        if (filtroStatus && g.terceira.status !== filtroStatus) return false;
        if (soAlertas && g.resumo.vencidos === 0 && g.resumo.vencendo === 0 && g.contr.status !== "vencido" && g.contr.status !== "vencendo") return false;
        return true;
      });
  }, [terceiras, docsPorTerceira, busca, filtroStatus, soAlertas]);

  const resumoGeral = useMemo(() => {
    let ativas = 0, docsVencidos = 0, docsVencendo = 0, contratosAlerta = 0;
    terceiras.forEach((t) => {
      if (t.status === "ativa") ativas++;
      const c = statusContrato(t);
      if (c.status === "vencido" || c.status === "vencendo") contratosAlerta++;
    });
    documentos.forEach((d) => {
      const s = statusDocumento(d).status;
      if (s === "vencido") docsVencidos++;
      else if (s === "vencendo") docsVencendo++;
    });
    return { ativas, docsVencidos, docsVencendo, contratosAlerta, total: terceiras.length };
  }, [terceiras, documentos]);

  const excluirTerceira = async (t) => {
    if (!confirm(`Excluir ${t.razao_social}? Os documentos vinculados também serão removidos.`)) return;
    try {
      await Promise.all((docsPorTerceira[t.id] || []).map((d) => base44.entities.DocumentoTerceiro.delete(d.id)));
      await base44.entities.Terceira.delete(t.id);
      carregar();
    } catch (e) { alert(e?.message || "Erro ao excluir."); }
  };

  const excluirDoc = async (d) => {
    if (!confirm("Excluir este documento?")) return;
    try { await base44.entities.DocumentoTerceiro.delete(d.id); carregar(); } catch (e) { alert(e?.message || "Erro."); }
  };

  const abrirDoc = async (d) => {
    if (!d.file_uri) return;
    try { const url = await linkTemporario(d.file_uri); window.open(url, "_blank"); } catch { alert("Não foi possível abrir o arquivo."); }
  };

  const semEmpresa = !activeCompanyId;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: WORK.text }}>Gestão de Terceiros</h1>
          <p className="text-sm" style={{ color: WORK.muted }}>
            Controle documental de empresas prestadoras (NR-04, responsabilidade solidária), com alertas de vencimento e vínculo aos setores e cargos da contratante.
          </p>
        </div>
        <button onClick={() => { setTerceiraEdit(null); setFormAberto(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: WORK.accent }}>
          <Plus size={16} /> Nova terceira
        </button>
      </div>

      {semEmpresa && (
        <div className="mt-6 rounded-lg border p-4 text-sm" style={{ borderColor: WORK.border, color: WORK.muted, background: WORK.surface }}>
          Selecione uma empresa no seletor do menu para gerenciar suas terceiras.
        </div>
      )}

      {carregando && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: WORK.accent }} />
        </div>
      )}

      {!carregando && !semEmpresa && (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <CardResumo icon={Building2} label="Terceiras ativas" valor={resumoGeral.ativas} cor={WORK.accent} sub={`${resumoGeral.total} cadastradas`} />
            <CardResumo icon={FileWarning} label="Documentos vencidos" valor={resumoGeral.docsVencidos} cor="#EF4444" />
            <CardResumo icon={Clock} label="Vencendo (30d)" valor={resumoGeral.docsVencendo} cor="#F59E0B" />
            <CardResumo icon={AlertTriangle} label="Contratos em alerta" valor={resumoGeral.contratosAlerta} cor="#F97316" />
          </div>

          {/* Filtros */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border" style={{ borderColor: WORK.border, background: WORK.surface }}>
              <Search size={15} style={{ color: WORK.muted }} />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar terceira…"
                className="text-sm outline-none w-40" style={{ color: WORK.text }} />
            </div>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
              <option value="">Todos os status</option>
              {Object.keys(STATUS_TERCEIRA).map((k) => <option key={k} value={k}>{STATUS_TERCEIRA[k].label}</option>)}
            </select>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer" style={{ borderColor: WORK.border, background: WORK.surface, color: WORK.text }}>
              <input type="checkbox" checked={soAlertas} onChange={(e) => setSoAlertas(e.target.checked)} />
              Só com alertas
            </label>
          </div>

          {/* Lista */}
          <div className="mt-4 space-y-2">
            {filtrado.length === 0 && (
              <p className="text-sm py-10 text-center" style={{ color: WORK.muted }}>
                {terceiras.length === 0 ? "Nenhuma terceira cadastrada. Clique em \"Nova terceira\"." : "Nenhuma terceira para os filtros selecionados."}
              </p>
            )}
            {filtrado.map((g) => {
              const aberto = expandido === g.terceira.id;
              const st = STATUS_TERCEIRA[g.terceira.status] || STATUS_TERCEIRA.ativa;
              return (
                <div key={g.terceira.id} className="rounded-xl border overflow-hidden" style={{ background: WORK.surface, borderColor: WORK.border }}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button onClick={() => setExpandido(aberto ? null : g.terceira.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      {aberto ? <ChevronDown size={16} style={{ color: WORK.muted }} /> : <ChevronRight size={16} style={{ color: WORK.muted }} />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: WORK.text }}>{g.terceira.razao_social}</p>
                        <p className="text-xs truncate" style={{ color: WORK.muted }}>
                          {g.terceira.cnpj || "Sem CNPJ"} · {g.terceira.area_atuacao || "—"}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <Badge cor={st.cor}>{st.label}</Badge>
                      <Badge cor={g.contr.cor}>{g.contr.label}</Badge>
                      {g.resumo.vencidos > 0 && <Badge cor="#EF4444">{g.resumo.vencidos} vencido(s)</Badge>}
                      {g.resumo.vencendo > 0 && <Badge cor="#F59E0B">{g.resumo.vencendo} vencendo</Badge>}
                      {g.resumo.total > 0 && <Badge cor={WORK.accent}>{g.resumo.total} docs</Badge>}
                      <button onClick={() => { setTerceiraEdit(g.terceira); setFormAberto(true); }} className="p-1.5 rounded hover:bg-slate-100" style={{ color: WORK.muted }} title="Editar"><Pencil size={14} /></button>
                      <button onClick={() => excluirTerceira(g.terceira)} className="p-1.5 rounded hover:bg-red-50" style={{ color: "#EF4444" }} title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {aberto && (
                    <div className="border-t" style={{ borderColor: WORK.border, background: WORK.bg }}>
                      {/* Vínculos */}
                      <div className="px-4 py-3 flex flex-wrap gap-2 text-xs" style={{ color: WORK.muted }}>
                        <span className="font-medium" style={{ color: WORK.text }}>Vínculos:</span>
                        <span>Setores: {(g.terceira.setor_ids || []).map((id) => setores.find((s) => s.id === id)?.nome || "—").join(", ") || "—"}</span>
                        <span>·</span>
                        <span>Cargos: {(g.terceira.cargo_ids || []).map((id) => cargos.find((c) => c.id === id)?.nome_cargo || "—").join(", ") || "—"}</span>
                        {g.terceira.responsavel_tecnico_nome && (<><span>·</span><span>Resp. técnico: {g.terceira.responsavel_tecnico_nome} ({g.terceira.responsavel_tecnico_conselho || ""})</span></>)}
                      </div>

                      {/* Documentos */}
                      <div className="px-4 py-3 border-t" style={{ borderColor: WORK.border }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium inline-flex items-center gap-1.5" style={{ color: WORK.text }}>
                            <Paperclip size={14} /> Documentos ({g.docs.length})
                          </span>
                          <button onClick={() => setDocForm({ aberto: true, terceiraId: g.terceira.id, doc: null })}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded" style={{ color: WORK.accent, border: `1px solid ${WORK.accent}55` }}>
                            <Plus size={13} /> Adicionar
                          </button>
                        </div>
                        {g.docs.length === 0 ? (
                          <p className="text-xs py-3" style={{ color: WORK.muted }}>Nenhum documento. Adicione contrato, ART, ASO, PGR, etc.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {g.docs.map((d) => {
                              const info = TIPOS_DOC_TERCEIRO[d.tipo] || TIPOS_DOC_TERCEIRO.outro;
                              const stDoc = statusDocumento(d);
                              return (
                                <div key={d.id} className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg" style={{ background: WORK.surface, border: `1px solid ${WORK.border}` }}>
                                  <Badge cor={info.cor}>{info.label}</Badge>
                                  <span className="text-sm flex-1 min-w-0 truncate" style={{ color: WORK.text }}>{d.nome}</span>
                                  <span className="text-xs" style={{ color: WORK.muted }}>{d.data_validade ? `val. ${dataBR(d.data_validade)}` : "s/ validade"}</span>
                                  <Badge cor={stDoc.cor}>{stDoc.label}</Badge>
                                  {d.file_uri && <button onClick={() => abrirDoc(d)} className="p-1 rounded hover:bg-slate-100" style={{ color: WORK.accent }} title="Abrir"><ExternalLink size={13} /></button>}
                                  <button onClick={() => setDocForm({ aberto: true, terceiraId: g.terceira.id, doc: d })} className="p-1 rounded hover:bg-slate-100" style={{ color: WORK.muted }} title="Editar"><Pencil size={13} /></button>
                                  <button onClick={() => excluirDoc(d)} className="p-1 rounded hover:bg-red-50" style={{ color: "#EF4444" }} title="Excluir"><Trash2 size={13} /></button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] mt-6" style={{ color: WORK.muted }}>
            A NR-04 (item 1.5) estabelece responsabilidade solidária entre contratante e contratada quanto ao cumprimento das normas de SST. Mantenha os documentos da terceira atualizados e acompanhe os vencimentos.
          </p>
        </>
      )}

      <TerceiraForm aberto={formAberto} empresaId={activeCompanyId} terceira={terceiraEdit} setores={setores} cargos={cargos}
        onFechar={() => setFormAberto(false)} onSalvar={carregar} />
      <DocumentoTerceiroForm aberto={docForm.aberto} empresaId={activeCompanyId} terceiraId={docForm.terceiraId} doc={docForm.doc}
        onFechar={() => setDocForm({ aberto: false, terceiraId: null, doc: null })} onSalvar={carregar} />
    </div>
  );
}