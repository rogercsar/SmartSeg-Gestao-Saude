import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { WORK } from "@/lib/sst";
import { Botao, Cartao, Etiqueta, Vazio, erroMsg } from "@/components/programas/ui";
import PlanoAcaoEditor from "@/components/programas/PlanoAcaoEditor";
import { sugerirAcoesRisco } from "@/lib/planoAcaoIA";
import { Plus, Sparkles, Pencil, Trash2, CheckCircle2, Bell, Send, AlertCircle } from "lucide-react";

const STATUS = { pendente: "Pendente", andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada" };
const STATUS_COR = { pendente: "#F97316", andamento: "#0EA5E9", concluida: "#22C55E", cancelada: "#94A3B8" };
const TIPO_MED = { eliminacao: "Eliminação", coletiva: "Coletiva", administrativa: "Administrativa", individual: "EPI" };
const hojeLocal = () => new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);

export default function PlanoAcaoAba({ dados, recarregar }) {
  const { user } = useAuth();
  const planos = dados.planos_acao || [];
  const [edit, setEdit] = useState(null);
  const [ocupado, setOcupado] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [riscoSel, setRiscoSel] = useState("");
  const [enviando, setEnviando] = useState(false);

  const riscos = dados.riscos || [];
  const riscoNome = (id) => riscos.find((r) => r.id === id)?.agente || "";

  const pendentesAprovacao = planos.filter((p) => p.pendente_aprovacao);
  const atrasados = planos.filter((p) => p.prazo && p.prazo < hojeLocal() && ["pendente", "andamento"].includes(p.status));
  const proximos = planos.filter((p) => {
    if (!p.prazo || !["pendente", "andamento"].includes(p.status)) return false;
    const d = new Date(p.prazo + "T00:00:00Z").getTime();
    const hoje = Date.now();
    return d >= hoje && d - hoje <= 7 * 86400000;
  });

  const visiveis = useMemo(() => {
    let l = [...planos].sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));
    if (filtro === "aprovacao") l = l.filter((p) => p.pendente_aprovacao);
    else if (filtro !== "todos") l = l.filter((p) => p.status === filtro);
    if (riscoSel) l = l.filter((p) => p.risco_id === riscoSel);
    return l;
  }, [planos, filtro, riscoSel]);

  const novo = () => setEdit({ company_id: dados.empresa.id, origem: "manual", estrutura: "nenhuma", escopo: { tipo: "empresa", ids: [], descricao: "" }, responsaveis_extras: [], lembretes: [], evidencias: [], prioridade: "media", status: "pendente", pendente_aprovacao: false });

  const sugerirIA = async () => {
    if (!riscoSel) return alert("Selecione um risco para que a IA sugira o plano de ação.");
    setOcupado("ia");
    try {
      const risco = riscos.find((r) => r.id === riscoSel);
      const setor = dados.setores?.find((s) => s.id === risco?.setor_id);
      const cargo = (risco?.cargo_ids || []).map((id) => dados.cargos?.find((c) => c.id === id)).filter(Boolean)[0];
      const unidade = dados.unidades?.find((u) => u.id === setor?.unidade_id);
      const acoes = await sugerirAcoesRisco(dados.empresa, risco, { setor, cargo, unidade });
      if (!acoes.length) return alert("A IA não sugeriu ações. Tente descrever melhor o risco.");
      await base44.entities.PlanoAcao.bulkCreate(acoes);
      recarregar();
    } catch (e) { erroMsg(e); } finally { setOcupado(""); }
  };

  const aprovar = async (p) => {
    await base44.entities.PlanoAcao.update(p.id, { pendente_aprovacao: false, aprovado_por: user?.full_name || user?.email || "" });
    recarregar();
  };

  const mudarStatus = async (p, status) => {
    const patch = { status };
    if (status === "concluida") patch.concluida_em = hojeLocal();
    await base44.entities.PlanoAcao.update(p.id, patch);
    recarregar();
  };

  const excluir = async (p) => {
    if (!confirm("Excluir esta ação do plano?")) return;
    await base44.entities.PlanoAcao.delete(p.id);
    recarregar();
  };

  const enviarLembretes = async () => {
    setEnviando(true);
    try {
      const res = await base44.functions.invoke("enviar-lembretes-plano", {});
      const d = res?.data || {};
      alert(`Lembretes processados: ${d.enviados || 0} e-mail(s) enviado(s), ${d.falhas || 0} falha(s).`);
      recarregar();
    } catch (e) { alert("Falha ao disparar lembretes: " + (e?.message || "")); }
    finally { setEnviando(false); }
  };

  return (
    <div className="space-y-4">
      {/* Painel de lembretes */}
      <Cartao titulo={<span className="flex items-center gap-1.5"><Bell size={14} /> Acompanhamento</span>}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <Metrica cor="#EAB308" label="Aguardando aprovação" valor={pendentesAprovacao.length} />
          <Metrica cor="#EF4444" label="Atrasadas" valor={atrasados.length} />
          <Metrica cor="#0EA5E9" label="Vencem em 7 dias" valor={proximos.length} />
          <Metrica cor="#22C55E" label="Concluídas" valor={planos.filter((p) => p.status === "concluida").length} />
        </div>
        {atrasados.length === 0 && proximos.length === 0 && pendentesAprovacao.length === 0 ? (
          <p className="text-sm" style={{ color: WORK.muted }}>Nenhum lembrete pendente. Tudo em dia.</p>
        ) : (
          <div className="space-y-1">
            {pendentesAprovacao.map((p) => (
              <Lembrete key={p.id} cor="#EAB308" texto={`Sugestão de IA aguardando aprovação: ${p.descricao}`} acao={<Botao tipo="primario" onClick={() => aprovar(p)}><CheckCircle2 size={13} /> Aprovar</Botao>} />
            ))}
            {atrasados.map((p) => (
              <Lembrete key={p.id} cor="#EF4444" texto={`Atrasada (prazo ${p.prazo}): ${p.descricao}`} acao={<Botao onClick={() => setEdit({ ...p })}>Abrir</Botao>} />
            ))}
            {proximos.map((p) => (
              <Lembrete key={p.id} cor="#0EA5E9" texto={`Vence em ${p.prazo}: ${p.descricao}`} acao={<Botao onClick={() => setEdit({ ...p })}>Abrir</Botao>} />
            ))}
          </div>
        )}
      </Cartao>

      {/* Ações */}
      <Cartao titulo="Plano de ação"
        acoes={<>
          <Botao onClick={enviarLembretes} carregando={enviando} title="Dispara lembretes devidos agora"><Send size={14} /> Enviar lembretes</Botao>
          <Botao onClick={novo}><Plus size={14} /> Nova ação</Botao>
        </>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          <div>
            <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Sugerir com IA a partir de um risco</span>
            <div className="flex gap-2">
              <select value={riscoSel} onChange={(e) => setRiscoSel(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}>
                <option value="">Selecione o risco…</option>
                {riscos.map((r) => <option key={r.id} value={r.id}>{r.agente}</option>)}
              </select>
              <Botao tipo="primario" onClick={sugerirIA} carregando={ocupado === "ia"} title="2 créditos"><Sparkles size={14} /> Sugerir</Botao>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}>
              <option value="todos">Todos os status</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              <option value="aprovacao">Aguardando aprovação</option>
            </select>
          </div>
        </div>

        {!visiveis.length ? <Vazio>Nenhuma ação cadastrada. Crie manualmente ou sugira com IA a partir de um risco.</Vazio> : (
          <div className="space-y-2">
            {visiveis.map((p) => (
              <div key={p.id} className="rounded-lg border p-3" style={{ background: WORK.bg, borderColor: p.pendente_aprovacao ? "#FDE68A" : WORK.border }}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Etiqueta cor={STATUS_COR[p.status]}>{STATUS[p.status]}</Etiqueta>
                      <Etiqueta cor="#64748B">{TIPO_MED[p.tipo_medida] || "—"}</Etiqueta>
                      {p.prioridade === "alta" && <Etiqueta cor="#EF4444">Prioridade alta</Etiqueta>}
                      {p.pendente_aprovacao && <Etiqueta cor="#EAB308">Sugestão de IA</Etiqueta>}
                      {p.estrutura && p.estrutura !== "nenhuma" && <Etiqueta cor={WORK.accent}>{p.estrutura.toUpperCase()}</Etiqueta>}
                    </div>
                    <p className="text-sm font-medium mt-1" style={{ color: WORK.text }}>{p.descricao}</p>
                    <p className="text-xs mt-1" style={{ color: WORK.muted }}>
                      Resp.: {p.responsavel || "—"} {p.responsavel_email ? `· ${p.responsavel_email}` : ""}
                      {p.prazo ? ` · Prazo: ${p.prazo}` : ""}
                      {p.risco_agente ? ` · Risco: ${p.risco_agente}` : ""}
                      {(p.evidencias || []).length ? ` · ${(p.evidencias || []).length} evidência(s)` : ""}
                      {(p.lembretes || []).filter((l) => l.ativo !== false).length ? ` · ${(p.lembretes || []).filter((l) => l.ativo !== false).length} lembrete(s)` : ""}
                    </p>
                    {p.justificativa && <p className="text-xs mt-1" style={{ color: WORK.muted }}>{p.justificativa}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    {p.pendente_aprovacao && <button onClick={() => aprovar(p)} title="Aprovar" style={{ color: "#22C55E" }}><CheckCircle2 size={15} /></button>}
                    <button onClick={() => setEdit({ ...p })} style={{ color: WORK.muted }}><Pencil size={15} /></button>
                    <button onClick={() => excluir(p)} style={{ color: WORK.muted }}><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Cartao>

      {edit && <PlanoAcaoEditor plano={edit} dados={dados} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); recarregar(); }} />}
    </div>
  );
}

function Metrica({ cor, label, valor }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: WORK.border, background: WORK.surface }}>
      <div className="text-2xl font-bold" style={{ color: cor }}>{valor}</div>
      <div className="text-xs" style={{ color: WORK.muted }}>{label}</div>
    </div>
  );
}

function Lembrete({ cor, texto, acao }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: cor + "55", background: cor + "12" }}>
      <AlertCircle size={14} style={{ color: cor }} />
      <span className="flex-1 text-sm" style={{ color: WORK.text }}>{texto}</span>
      {acao}
    </div>
  );
}