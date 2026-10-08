// Painel compacto de plano de ação embutido no editor de risco.
// Mostra ações vinculadas ao risco, sugere via IA (pendente de aprovação) e permite aprovar/editar.
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { WORK } from "@/lib/sst";
import { Botao, Vazio, erroMsg } from "@/components/programas/ui";
import PlanoAcaoEditor from "@/components/programas/PlanoAcaoEditor";
import { sugerirAcoesRisco } from "@/lib/planoAcaoIA";
import { Sparkles, CheckCircle2, Pencil, Trash2, Plus } from "lucide-react";

const TIPO_MED = { eliminacao: "Eliminação", coletiva: "Coletiva", administrativa: "Administrativa", individual: "EPI" };

export default function PlanoAcaoRisco({ risco, dados }) {
  const { user } = useAuth();
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [edit, setEdit] = useState(null);

  const carregar = async () => {
    if (!risco?.id) return;
    setCarregando(true);
    try {
      const { items } = await base44.entities.PlanoAcao.filter({ company_id: dados.empresa.id, risco_id: risco.id });
      setPlanos(items || []);
    } catch { setPlanos([]); }
    finally { setCarregando(false); }
  };

  useEffect(() => { carregar(); }, [risco?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!risco?.id) return null;

  const sugerir = async () => {
    setOcupado(true);
    try {
      const setor = dados.setores?.find((s) => s.id === risco.setor_id);
      const cargo = (risco.cargo_ids || []).map((id) => dados.cargos?.find((c) => c.id === id)).filter(Boolean)[0];
      const unidade = dados.unidades?.find((u) => u.id === setor?.unidade_id);
      const acoes = await sugerirAcoesRisco(dados.empresa, risco, { setor, cargo, unidade });
      if (!acoes.length) return alert("A IA não sugeriu ações para este risco.");
      await base44.entities.PlanoAcao.bulkCreate(acoes);
      carregar();
    } catch (e) { erroMsg(e); } finally { setOcupado(false); }
  };

  const aprovar = async (p) => {
    await base44.entities.PlanoAcao.update(p.id, { pendente_aprovacao: false, aprovado_por: user?.full_name || user?.email || "" });
    carregar();
  };

  const excluir = async (p) => {
    if (!confirm("Remover esta ação do plano?")) return;
    await base44.entities.PlanoAcao.delete(p.id);
    carregar();
  };

  const novo = () => setEdit({ company_id: dados.empresa.id, origem: "programa", risco_id: risco.id, risco_agente: risco.agente, estrutura: "pdca", escopo: { tipo: risco.setor_id ? "setor" : "empresa", ids: risco.setor_id ? [risco.setor_id] : [], descricao: "" }, responsaveis_extras: [], lembretes: [], evidencias: [], prioridade: "media", status: "pendente", pendente_aprovacao: false, tipo_medida: "administrativa" });

  const pendentes = planos.filter((p) => p.pendente_aprovacao);
  const aprovados = planos.filter((p) => !p.pendente_aprovacao);

  return (
    <section className="rounded-lg border p-3" style={{ borderColor: WORK.border, background: "rgba(11,111,168,0.03)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: WORK.muted }}>Plano de ação vinculado ao risco (IA sugere; você aprova)</span>
        <div className="flex gap-2">
          <Botao onClick={novo} title="Cadastrar manualmente"><Plus size={13} /> Ação</Botao>
          <Botao tipo="primario" onClick={sugerir} carregando={ocupado} title="2 créditos"><Sparkles size={13} /> Sugerir com IA</Botao>
        </div>
      </div>

      {carregando ? <p className="text-xs" style={{ color: WORK.muted }}>Carregando…</p> : planos.length === 0 ? (
        <Vazio>Nenhuma ação para este risco. Use a IA para sugerir ou cadastre manualmente.</Vazio>
      ) : (
        <div className="space-y-2">
          {pendentes.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase mb-1" style={{ color: "#EAB308" }}>Aguardando aprovação</div>
              {pendentes.map((p) => (
                <div key={p.id} className="rounded-lg border p-2 mb-1 flex items-start gap-2" style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: WORK.text }}>{p.descricao}</p>
                    <p className="text-xs" style={{ color: WORK.muted }}>{TIPO_MED[p.tipo_medida] || "—"} · Resp.: {p.responsavel || "—"} · Prazo: {p.prazo || "—"}</p>
                  </div>
                  <button onClick={() => aprovar(p)} title="Aprovar" style={{ color: "#22C55E" }}><CheckCircle2 size={15} /></button>
                  <button onClick={() => setEdit({ ...p })} style={{ color: WORK.muted }}><Pencil size={14} /></button>
                  <button onClick={() => excluir(p)} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
          {aprovados.length > 0 && (
            <div>
              {pendentes.length > 0 && <div className="text-[11px] font-semibold uppercase mb-1" style={{ color: WORK.muted }}>Aprovadas</div>}
              {aprovados.map((p) => (
                <div key={p.id} className="rounded-lg border p-2 mb-1 flex items-start gap-2" style={{ borderColor: WORK.border, background: WORK.surface }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: WORK.text }}>{p.descricao}</p>
                    <p className="text-xs" style={{ color: WORK.muted }}>{p.status} · {TIPO_MED[p.tipo_medida] || "—"} · Resp.: {p.responsavel || "—"} {p.responsavel_email ? `· ${p.responsavel_email}` : ""} · Prazo: {p.prazo || "—"}</p>
                  </div>
                  <button onClick={() => setEdit({ ...p })} style={{ color: WORK.muted }}><Pencil size={14} /></button>
                  <button onClick={() => excluir(p)} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {edit && <PlanoAcaoEditor plano={edit} dados={dados} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); carregar(); }} />}
    </section>
  );
}