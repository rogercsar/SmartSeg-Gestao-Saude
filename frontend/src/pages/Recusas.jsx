import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, X, ShieldX, Upload, FileCheck2 } from "lucide-react";
import { WORK } from "@/lib/sst";
import { useAppState } from "@/lib/AppState";
import { uploadPrivado, linkTemporario } from "@/lib/privateFiles";

const hoje = () => new Date().toISOString().slice(0, 10);
const dataBR = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—");

const STATUS = {
  pendente: { label: "Pendente", cor: "#EAB308" },
  em_analise: { label: "Em análise", cor: "#3B82F6" },
  resolvido: { label: "Resolvido", cor: "#22C55E" },
};

const CAMPO = "w-full px-3 py-2 rounded-lg border text-sm outline-none";
const estiloInput = { background: WORK.bg, borderColor: WORK.border, color: WORK.text };

function FormRecusa({ rec, setRec, dados, onFechar, onSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const set = (k, v) => setRec((r) => ({ ...r, [k]: v }));

  const enviarAnexo = async (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    setEnviando(true);
    try { const { file_uri } = await uploadPrivado(f); set("anexo_uri", file_uri); }
    catch (e) { alert("Erro no envio: " + (e?.message || "")); }
    finally { setEnviando(false); }
  };

  const salvar = async () => {
    if (!rec.trabalhador_nome || !rec.data_recusa || !rec.situacao_perigosa)
      return alert("Preencha trabalhador, data e situação perigosa.");
    setSalvando(true);
    try { await onSalvar(rec); onFechar(); }
    catch (e) { alert("Erro: " + (e?.message || "")); }
    finally { setSalvando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 md:p-6 overflow-y-auto" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-2xl rounded-xl border my-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: WORK.border }}>
          <h3 className="font-semibold" style={{ color: WORK.text }}>{rec.id ? "Editar recusa" : "Registrar direito de recusa"}</h3>
          <button onClick={onFechar} style={{ color: WORK.muted }}><X size={18} /></button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-3">
          <p className="text-xs rounded-lg p-3" style={{ background: "rgba(234,179,8,0.08)", color: "#EAB308" }}>
            NR-01 (GRO): o trabalhador pode interromper atividade ao constatar situação de trabalho que coloque em risco sua saúde ou integridade. O empregador deve registrar, analisar e adotar providências.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block md:col-span-2">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Trabalhador *</span>
              <input className={CAMPO} style={estiloInput} value={rec.trabalhador_nome ?? ""} placeholder="Nome do trabalhador"
                onChange={(e) => set("trabalhador_nome", e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Cargo</span>
              <select className={CAMPO} style={estiloInput} value={rec.cargo_id ?? ""} onChange={(e) => set("cargo_id", e.target.value)}>
                <option value="">—</option>
                {dados.cargos.map((c) => <option key={c.id} value={c.id}>{c.nome_cargo}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Setor</span>
              <select className={CAMPO} style={estiloInput} value={rec.setor_id ?? ""} onChange={(e) => set("setor_id", e.target.value)}>
                <option value="">—</option>
                {dados.setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Data da recusa *</span>
              <input type="date" className={CAMPO} style={estiloInput} value={rec.data_recusa ?? ""} onChange={(e) => set("data_recusa", e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Hora</span>
              <input type="time" className={CAMPO} style={estiloInput} value={rec.hora_recusa ?? ""} onChange={(e) => set("hora_recusa", e.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Local</span>
              <input className={CAMPO} style={estiloInput} value={rec.local ?? ""} placeholder="Setor/área onde ocorreu" onChange={(e) => set("local", e.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Situação perigosa relatada *</span>
              <textarea rows={3} className={CAMPO} style={estiloInput} value={rec.situacao_perigosa ?? ""} placeholder="Descreva o que o trabalhador constatou"
                onChange={(e) => set("situacao_perigosa", e.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Risco identificado</span>
              <input className={CAMPO} style={estiloInput} value={rec.risco_identificado ?? ""} placeholder="Ex.: piso molhado, máquina sem proteção…"
                onChange={(e) => set("risco_identificado", e.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Medidas de controle existentes</span>
              <textarea rows={2} className={CAMPO} style={estiloInput} value={rec.medida_controle_existente ?? ""} onChange={(e) => set("medida_controle_existente", e.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Providência do empregador</span>
              <textarea rows={2} className={CAMPO} style={estiloInput} value={rec.acao_empregador ?? ""} placeholder="O que foi feito após a recusa"
                onChange={(e) => set("acao_empregador", e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Status</span>
              <select className={CAMPO} style={estiloInput} value={rec.status ?? "pendente"} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm cursor-pointer" style={{ borderColor: WORK.border, color: WORK.text }}>
                <Upload size={14} /> {enviando ? "Enviando…" : rec.anexo_uri ? "Trocar anexo" : "Anexar evidência"}
                <input type="file" accept="image/*,application/pdf" hidden onChange={enviarAnexo} />
              </label>
              {rec.anexo_uri && <button onClick={async () => window.open(await linkTemporario(rec.anexo_uri, 600), "_blank")} style={{ color: WORK.muted }}><FileCheck2 size={16} /></button>}
            </div>
            <label className="block md:col-span-2">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Observações</span>
              <textarea rows={2} className={CAMPO} style={estiloInput} value={rec.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} />
            </label>
          </div>
        </div>
        <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderColor: WORK.border }}>
          <button onClick={onFechar} className="px-3 py-2 rounded-lg text-sm" style={{ color: WORK.text, border: `1px solid ${WORK.border}` }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: WORK.accent, color: "#FFFFFF" }}>
            {salvando ? "Salvando…" : "Salvar recusa"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Recusas() {
  const [params] = useSearchParams();
  const { activeCompanyId, setActiveCompanyId } = useAppState();
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState(params.get("empresa") || activeCompanyId || "");
  const [recusas, setRecusas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [trabalhadores, setTrabalhadores] = useState([]);
  const [editando, setEditando] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    base44.entities.Company.list("razao_social", 500).then((l) => {
      setEmpresas(l || []);
      if (!empresaId && l?.length === 1) setEmpresaId(l[0].id);
    }).catch(() => {});
  }, []);

  const recarregar = useCallback(async () => {
    if (!empresaId) { setRecusas([]); return; }
    setCarregando(true);
    try {
      const [recs, cars, sets, trabs] = await Promise.all([
        base44.entities.RecusaTrabalho.filter({ company_id: empresaId }, { sort: "-data_recusa", limit: 100 }),
        base44.entities.CargoFuncao.filter({ company_id: empresaId }, { limit: 200 }),
        base44.entities.Setor.filter({ company_id: empresaId }, { limit: 200 }),
        base44.entities.Trabalhador.filter({ company_id: empresaId }, { limit: 500 }),
      ]);
      setRecusas(recs.items || recs);
      setCargos(cars.items || cars);
      setSetores(sets.items || sets);
      setTrabalhadores(trabs.items || trabs);
    } finally { setCarregando(false); }
  }, [empresaId]);

  useEffect(() => { recarregar(); }, [recarregar]);
  useEffect(() => { if (empresaId && empresaId !== activeCompanyId) setActiveCompanyId(empresaId); }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const salvar = async (rec) => {
    const { id, created_date, updated_date, created_by, created_by_id, ...d } = rec; // eslint-disable-line no-unused-vars
    if (id) await base44.entities.RecusaTrabalho.update(id, d);
    else await base44.entities.RecusaTrabalho.create({ ...d, company_id: empresaId });
    recarregar();
  };

  const nomeCargo = (id) => cargos.find((c) => c.id === id)?.nome_cargo || "—";
  const nomeSetor = (id) => setores.find((s) => s.id === id)?.nome || "—";

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <ShieldX size={24} style={{ color: WORK.accent }} />
        <h1 className="text-2xl font-bold" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>Direito de recusa</h1>
      </div>
      <p className="text-sm mb-5" style={{ color: WORK.muted }}>
        Registro formal de recusa do trabalhador ao constatar situação de risco (NR-01 — GRO).
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm min-w-[260px]" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
          <option value="">Selecione a empresa…</option>
          {empresas.map((e) => <option key={e.id} value={e.id}>{e.razao_social}</option>)}
        </select>
        <button onClick={() => setEditando({ data_recusa: hoje(), status: "pendente" })} disabled={!empresaId}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: WORK.accent, color: "#FFFFFF" }}>
          <Plus size={15} /> Nova recusa
        </button>
      </div>

      {!empresaId && <p className="text-sm" style={{ color: WORK.muted }}>Selecione uma empresa para registrar recusas.</p>}

      {empresaId && recusas.length === 0 && !carregando && (
        <p className="text-sm py-4 text-center" style={{ color: WORK.muted }}>Nenhuma recusa registrada.</p>
      )}

      <div className="space-y-2">
        {recusas.map((r) => {
          const st = STATUS[r.status] || STATUS.pendente;
          return (
            <div key={r.id} className="rounded-lg border p-4" style={{ background: WORK.surface, borderColor: WORK.border }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <b className="text-sm" style={{ color: WORK.text }}>{r.trabalhador_nome}</b>
                    <span className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.cor + "26", color: st.cor, border: `1px solid ${st.cor}55` }}>{st.label}</span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: WORK.muted }}>{dataBR(r.data_recusa)}{r.hora_recusa ? ` às ${r.hora_recusa}` : ""} · {nomeCargo(r.cargo_id)} · {nomeSetor(r.setor_id)}{r.local ? ` · ${r.local}` : ""}</p>
                  <p className="text-sm mt-2" style={{ color: WORK.text }}><b>Situação:</b> {r.situacao_perigosa}</p>
                  {r.risco_identificado && <p className="text-xs mt-1" style={{ color: WORK.muted }}><b>Risco:</b> {r.risco_identificado}</p>}
                  {r.acao_empregador && <p className="text-xs mt-1" style={{ color: WORK.muted }}><b>Providência:</b> {r.acao_empregador}</p>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => setEditando({ ...r })} style={{ color: WORK.muted }}><Pencil size={15} /></button>
                  <button onClick={async () => { if (confirm("Excluir recusa?")) { await base44.entities.RecusaTrabalho.delete(r.id); recarregar(); } }} style={{ color: WORK.muted }}><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editando && (
        <FormRecusa rec={editando} setRec={setEditando} dados={{ cargos, setores, trabalhadores }}
          onFechar={() => setEditando(null)} onSalvar={salvar} />
      )}
    </div>
  );
}