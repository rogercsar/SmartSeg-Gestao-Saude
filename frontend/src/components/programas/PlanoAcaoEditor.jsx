import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { uploadPrivado, linkTemporario } from "@/lib/privateFiles";
import { WORK } from "@/lib/sst";
import { Botao, Campo, Modal } from "@/components/programas/ui";
import { Plus, X, Paperclip, Trash2, ExternalLink, CheckCircle2 } from "lucide-react";

const TIPO_MEDIDA = { eliminacao: "Eliminação do perigo", coletiva: "Proteção coletiva", administrativa: "Administrativa / organização", individual: "Proteção individual (EPI)" };
const ESTRUTURA = { nenhuma: "Sem estrutura", pdca: "PDCA", "5w2h": "5W2H" };
const ESCOPO = { empresa: "Toda a empresa", unidade: "Unidade(s)", setor: "Setor(es)", cargo: "Cargo(s)", trabalhador: "Trabalhador(es)" };
const STATUS = { pendente: "Pendente", andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada" };
const LEMBRETE_TIPO = { inicio: "Antes do início", prazo: "Antes do prazo", mensal: "Mensal", semanal: "Semanal" };

const inp = "w-full px-2.5 py-2 rounded-lg border text-sm outline-none";
const st = { background: WORK.bg, borderColor: WORK.border, color: WORK.text };

export default function PlanoAcaoEditor({ plano, dados, onClose, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(() => ({
    estrutura: "nenhuma",
    escopo: { tipo: "empresa", ids: [], descricao: "" },
    responsaveis_extras: [],
    lembretes: [],
    evidencias: [],
    prioridade: "media",
    status: "pendente",
    pendente_aprovacao: false,
    tipo_medida: "administrativa",
    ...plano,
  }));
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setEscopo = (campo, v) => set("escopo", { ...(form.escopo || {}), [campo]: v });
  const setMet = (campo, v) => set("metodologia", { ...(form.metodologia || {}), [campo]: v });

  // listas auxiliares
  const colecao = () => {
    const e = form.escopo?.tipo;
    if (e === "unidade") return dados.unidades || [];
    if (e === "setor") return dados.setores || [];
    if (e === "cargo") return dados.cargos || [];
    if (e === "trabalhador") return dados.trabalhadores || [];
    return [];
  };
  const nomeColecao = (id) => {
    const c = colecao().find((x) => x.id === id);
    return c?.nome || c?.nome_cargo || c?.razao_social || id;
  };
  const toggleId = (id) => {
    const ids = form.escopo?.ids || [];
    setEscopo("ids", ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };

  // responsaveis extras
  const [rx, setRx] = useState({ nome: "", email: "" });
  const addRx = () => { if (rx.email.trim()) { set("responsaveis_extras", [...(form.responsaveis_extras || []), rx]); setRx({ nome: "", email: "" }); } };

  // lembretes
  const addLembrete = () => set("lembretes", [...(form.lembretes || []), { tipo: "prazo", antecedencia_dias: 7, ativo: true, ultimo_envio: "" }]);
  const updLembrete = (i, campo, v) => set("lembretes", (form.lembretes || []).map((x, j) => (j === i ? { ...x, [campo]: v } : x)));
  const delLembrete = (i) => set("lembretes", (form.lembretes || []).filter((_, j) => j !== i));

  // evidencias
  const addEvidencia = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEnviando(true);
    try {
      const { file_uri } = await uploadPrivado(file);
      set("evidencias", [...(form.evidencias || []), { arquivo_uri: file_uri, nome: file.name, descricao: "", data: new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10), registrado_por: user?.full_name || user?.email || "" }]);
    } catch (err) { alert("Falha no envio do arquivo: " + (err?.message || "")); }
    finally { setEnviando(false); e.target.value = ""; }
  };
  const delEvidencia = (i) => set("evidencias", (form.evidencias || []).filter((_, j) => j !== i));
  const [links, setLinks] = useState({});
  const verEvidencia = async (ev) => { try { setLinks((l) => ({ ...l, [ev.arquivo_uri]: "gerando" })); const u = await linkTemporario(ev.arquivo_uri); setLinks((l) => ({ ...l, [ev.arquivo_uri]: u })); } catch (e) { alert("Não foi possível gerar o link."); } };

  const aprovar = () => set("pendente_aprovacao", false) || set("aprovado_por", user?.full_name || user?.email || "");

  const salvar = async () => {
    if (!form.descricao?.trim()) return alert("Descreva a ação.");
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...d } = form;  
      if (form.status === "concluida") d.concluida_em = hojeLocal();
      if (!d.aprovado_por && !d.pendente_aprovacao) d.aprovado_por = user?.full_name || user?.email || "";
      if (d.escopo?.tipo === "empresa") d.escopo.ids = [];
      if (id) await base44.entities.PlanoAcao.update(id, d);
      else await base44.entities.PlanoAcao.create({ ...d, company_id: d.company_id || dados.empresa.id });
      onSaved();
    } catch (e) { alert("Erro ao salvar: " + (e?.message || "")); }
    finally { setSalvando(false); }
  };

  const hojeLocal = () => new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);

  return (
    <Modal aberto onFechar={onClose} titulo={plano?.id ? "Editar plano de ação" : "Novo plano de ação"} largura="max-w-4xl"
      rodape={<>
        {form.pendente_aprovacao && <Botao tipo="primario" onClick={aprovar} title="Aprovar e remover da pilha de sugestões"><CheckCircle2 size={14} /> Aprovar</Botao>}
        <Botao onClick={onClose}>Cancelar</Botao>
        <Botao tipo="primario" onClick={salvar} carregando={salvando}>Salvar</Botao>
      </>}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Ação *</span>
            <textarea className={inp} style={st} rows={2} value={form.descricao || ""} onChange={(e) => set("descricao", e.target.value)} placeholder="Descreva a medida de prevenção" />
          </div>
          <Campo label="Tipo de medida (NR-01 1.5.5.2)" tipo="select" opcoes={TIPO_MEDIDA} valor={form.tipo_medida} onChange={(v) => set("tipo_medida", v)} />
        </div>
        <Campo label="Justificativa técnica" tipo="textarea" linhas={2} valor={form.justificativa} onChange={(v) => set("justificativa", v)} />

        {/* Estrutura PDCA / 5W2H */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <Campo label="Metodologia" tipo="select" opcoes={ESTRUTURA} valor={form.estrutura} onChange={(v) => set("estrutura", v)} />
          </div>
          {form.estrutura === "pdca" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Campo label="P — Plan (planejar)" tipo="textarea" linhas={2} valor={form.metodologia?.p} onChange={(v) => setMet("p", v)} />
              <Campo label="D — Do (executar)" tipo="textarea" linhas={2} valor={form.metodologia?.d} onChange={(v) => setMet("d", v)} />
              <Campo label="C — Check (verificar)" tipo="textarea" linhas={2} valor={form.metodologia?.c} onChange={(v) => setMet("c", v)} />
              <Campo label="A — Act (agir)" tipo="textarea" linhas={2} valor={form.metodologia?.a} onChange={(v) => setMet("a", v)} />
            </div>
          )}
          {form.estrutura === "5w2h" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Campo label="What (o quê)" valor={form.metodologia?.what} onChange={(v) => setMet("what", v)} />
              <Campo label="Why (por quê)" valor={form.metodologia?.why} onChange={(v) => setMet("why", v)} />
              <Campo label="Who (quem)" valor={form.metodologia?.who} onChange={(v) => setMet("who", v)} />
              <Campo label="When (quando)" valor={form.metodologia?.when} onChange={(v) => setMet("when", v)} />
              <Campo label="Where (onde)" valor={form.metodologia?.where} onChange={(v) => setMet("where", v)} />
              <Campo label="How (como)" valor={form.metodologia?.how} onChange={(v) => setMet("how", v)} />
              <Campo label="How much (quanto custa)" valor={form.metodologia?.how_much} onChange={(v) => setMet("how_much", v)} />
            </div>
          )}
        </section>

        {/* Escopo de aplicação */}
        <section className="rounded-lg border p-3" style={{ borderColor: WORK.border }}>
          <div className="text-xs font-medium mb-2" style={{ color: WORK.muted }}>A quem se aplica</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Campo label="Abrangência" tipo="select" opcoes={ESCOPO} valor={form.escopo?.tipo} onChange={(v) => setEscopo("tipo", v)} />
            <Campo label="Descrição (opcional)" valor={form.escopo?.descricao} onChange={(v) => setEscopo("descricao", v)} className="md:col-span-2" />
          </div>
          {form.escopo?.tipo !== "empresa" && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1.5">
                {colecao().length === 0 && <span className="text-xs" style={{ color: WORK.muted }}>Nenhum item cadastrado.</span>}
                {colecao().map((c) => {
                  const on = (form.escopo?.ids || []).includes(c.id);
                  return (
                    <button key={c.id} type="button" onClick={() => toggleId(c.id)} className="px-2.5 py-1 rounded-full text-xs border"
                      style={{ borderColor: on ? WORK.accent : WORK.border, color: on ? WORK.accent : WORK.muted }}>
                      {on ? "✓ " : ""}{c.nome || c.nome_cargo || c.razao_social}
                    </button>
                  );
                })}
              </div>
              {(form.escopo?.ids || []).length > 0 && <p className="text-xs mt-1" style={{ color: WORK.muted }}>Selecionados: {(form.escopo.ids || []).map(nomeColecao).join(", ")}</p>}
            </div>
          )}
        </section>

        {/* Responsáveis */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Campo label="Responsável" valor={form.responsavel} onChange={(v) => set("responsavel", v)} placeholder="Nome / cargo" />
          <Campo label="E-mail do responsável" valor={form.responsavel_email} onChange={(v) => set("responsavel_email", v)} placeholder="para receber lembretes" />
        </section>
        <div>
          <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Outros responsáveis / notificados</span>
          <div className="space-y-1 mb-2">
            {(form.responsaveis_extras || []).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm" style={{ color: WORK.text }}>
                <span className="flex-1">{r.nome} · {r.email}</span>
                <button onClick={() => set("responsaveis_extras", (form.responsaveis_extras || []).filter((_, j) => j !== i))} style={{ color: WORK.muted }}><X size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={inp} style={st} placeholder="Nome" value={rx.nome} onChange={(e) => setRx((x) => ({ ...x, nome: e.target.value }))} />
            <input className={inp} style={st} placeholder="E-mail" value={rx.email} onChange={(e) => setRx((x) => ({ ...x, email: e.target.value }))} />
            <Botao onClick={addRx}><Plus size={13} /></Botao>
          </div>
        </div>

        {/* Prazos, prioridade, status */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Campo label="Início previsto" tipo="date" valor={form.data_inicio} onChange={(v) => set("data_inicio", v)} />
          <Campo label="Prazo" tipo="date" valor={form.prazo} onChange={(v) => set("prazo", v)} />
          <Campo label="Prioridade" tipo="select" opcoes={{ baixa: "Baixa", media: "Média", alta: "Alta" }} valor={form.prioridade} onChange={(v) => set("prioridade", v)} />
          <Campo label="Status" tipo="select" opcoes={STATUS} valor={form.status} onChange={(v) => set("status", v)} />
        </section>

        {/* Lembretes */}
        <section>
          <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Lembretes (e-mail ao responsável + painel)</span>
          {(form.lembretes || []).map((l, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center mb-1 rounded-lg border p-2" style={{ borderColor: WORK.border }}>
              <select className={inp} style={st} value={l.tipo} onChange={(e) => updLembrete(i, "tipo", e.target.value)}>
                {Object.entries(LEMBRETE_TIPO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {(l.tipo === "inicio" || l.tipo === "prazo") ? (
                <label className="text-xs flex items-center gap-1" style={{ color: WORK.muted }}>
                  <input type="number" min={0} className={inp + " w-20"} style={st} value={l.antecedencia_dias} onChange={(e) => updLembrete(i, "antecedencia_dias", Number(e.target.value))} /> dia(s) antes
                </label>
              ) : <span className="text-xs" style={{ color: WORK.muted }}>{l.tipo === "mensal" ? "a cada mês" : "toda semana"}</span>}
              <label className="text-xs flex items-center gap-1" style={{ color: WORK.muted }}>
                <input type="checkbox" checked={l.ativo !== false} onChange={(e) => updLembrete(i, "ativo", e.target.checked)} /> ativo
              </label>
              <button onClick={() => delLembrete(i)} className="text-xs flex items-center gap-1 justify-self-end" style={{ color: WORK.muted }}><Trash2 size={13} /> Remover</button>
            </div>
          ))}
          <Botao onClick={addLembrete}><Plus size={13} /> Lembrete</Botao>
        </section>

        {/* Evidências */}
        <section>
          <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Evidências (arquivos privados — fotos, documentos, registros)</span>
          <div className="space-y-1 mb-2">
            {(form.evidencias || []).map((ev, i) => (
              <div key={i} className="flex items-center gap-2 text-sm rounded-lg border p-2" style={{ borderColor: WORK.border, color: WORK.text }}>
                <Paperclip size={14} style={{ color: WORK.accent }} />
                <span className="flex-1 truncate">{ev.nome}</span>
                <span className="text-xs" style={{ color: WORK.muted }}>{ev.data}</span>
                <button onClick={() => verEvidencia(ev)} className="text-xs flex items-center gap-1" style={{ color: WORK.accent }}>{links[ev.arquivo_uri] === "gerando" ? "..." : <><ExternalLink size={12} /> Ver</>}</button>
                <button onClick={() => delEvidencia(i)} style={{ color: WORK.muted }}><X size={14} /></button>
              </div>
            ))}
            {enviando && <p className="text-xs" style={{ color: WORK.muted }}>Enviando arquivo...</p>}
          </div>
          <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm cursor-pointer ${enviando ? "opacity-50" : ""}`} style={{ borderColor: WORK.border, color: WORK.accent }}>
            <Plus size={13} /> Anexar evidência
            <input type="file" className="hidden" onChange={addEvidencia} disabled={enviando} />
          </label>
        </section>

        <label className="flex items-center gap-2 text-sm" style={{ color: WORK.text }}>
          <input type="checkbox" checked={!!form.pendente_aprovacao} onChange={(e) => set("pendente_aprovacao", e.target.checked)} />
          Aguardando minha aprovação (sugestão de IA em revisão)
        </label>
      </div>
    </Modal>
  );
}