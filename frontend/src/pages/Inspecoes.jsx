import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Camera, Sparkles, CheckCircle2, XCircle, MinusCircle, Printer, Pencil, X } from "lucide-react";
import { WORK } from "@/lib/sst";
import { CHECKLISTS_PADRAO, PRIORIDADES, STATUS_ACAO, situacao, hojeLocal, addDias, dataBR } from "@/lib/sstGestao";
import { invokeAI } from "@/lib/ai";
import { uploadPrivado, linkTemporario } from "@/lib/privateFiles";
import { Botao, Campo, Modal, Cartao, Etiqueta, Vazio, erroMsg } from "@/components/programas/ui";
import { useEmpresa, SeletorEmpresa, Cabecalho, Abas, Indicador } from "@/components/sst/useEmpresa";

const RESP = { conforme: ["Conforme", "#146C43", CheckCircle2], nao_conforme: ["Não conforme", "#B42318", XCircle], na: ["Não se aplica", "#5F6368", MinusCircle] };
export const conformidade = (resps) => {
  const c = resps.filter((r) => r.resposta === "conforme").length;
  const n = resps.filter((r) => r.resposta === "nao_conforme").length;
  return c + n ? Math.round((c / (c + n)) * 100) : null;
};

function Execucao({ insp, setInsp, d, onFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(null);
  const [fotos, setFotos] = useState({});
  const upd = (i, k, v) => setInsp((x) => ({ ...x, respostas: x.respostas.map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const respondidas = insp.respostas.filter((r) => r.resposta).length;

  useEffect(() => {
    insp.respostas.forEach((r) => { if (r.foto_uri && !fotos[r.foto_uri]) linkTemporario(r.foto_uri, 900).then((u) => setFotos((f) => ({ ...f, [r.foto_uri]: u }))).catch(() => {}); });
  }, [insp.respostas]); // eslint-disable-line react-hooks/exhaustive-deps

  const foto = async (i, file) => {
    if (!file) return;
    setEnviando(i);
    try { upd(i, "foto_uri", (await uploadPrivado(file)).file_uri); } catch (e) { alert("Erro na foto: " + (e?.message || "")); } finally { setEnviando(null); }
  };

  const salvar = async (concluir) => {
    if (concluir && respondidas < insp.respostas.length) return alert(`Responda todos os itens (${respondidas}/${insp.respostas.length}).`);
    const faltaObs = insp.respostas.some((r) => r.resposta === "nao_conforme" && !r.observacao?.trim());
    if (concluir && faltaObs) return alert("Descreva cada não conformidade (campo observação) — ela vira a ação do plano.");
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...dd } = insp; // eslint-disable-line no-unused-vars
      dd.conformidade_pct = conformidade(insp.respostas);
      if (concluir) dd.status = "concluida";
      let inspId = id;
      if (id) await base44.entities.InspecaoChecklist.update(id, dd);
      else inspId = (await base44.entities.InspecaoChecklist.create({ ...dd, company_id: d.empresa.id })).id;
      if (concluir) {
        const setor = d.setores.find((s) => s.id === insp.setor_id)?.nome || "";
        const acoes = insp.respostas.filter((r) => r.resposta === "nao_conforme" && !r.acao_criada).map((r) => ({
          company_id: d.empresa.id, origem: "checklist", origem_id: inspId,
          origem_descricao: `${insp.modelo_nome} — ${setor}${insp.local ? " / " + insp.local : ""} (${dataBR(insp.data)})`,
          descricao: `${r.texto}: ${r.observacao}`, prioridade: "media", status: "pendente", prazo: addDias(insp.data || hojeLocal(), 30), responsavel: "",
        }));
        if (acoes.length) {
          await base44.entities.PlanoAcao.bulkCreate(acoes);
          await base44.entities.InspecaoChecklist.update(inspId, { respostas: insp.respostas.map((r) => (r.resposta === "nao_conforme" ? { ...r, acao_criada: true } : r)) });
        }
      }
      aoSalvar(); onFechar();
    } catch (e) { alert("Erro: " + (e?.message || "")); } finally { setSalvando(false); }
  };

  return (
    <Modal aberto onFechar={onFechar} titulo={`${insp.modelo_nome} — ${respondidas}/${insp.respostas.length}`} largura="max-w-3xl"
      rodape={<><Botao onClick={() => salvar(false)} carregando={salvando}>Salvar e continuar depois</Botao><Botao tipo="primario" onClick={() => salvar(true)} carregando={salvando}>Concluir e gerar plano de ação</Botao></>}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
        <Campo label="Setor" tipo="select" opcoes={Object.fromEntries(d.setores.map((s) => [s.id, s.nome]))} valor={insp.setor_id} onChange={(v) => setInsp((x) => ({ ...x, setor_id: v }))} />
        <Campo label="Local / equipamento" valor={insp.local} onChange={(v) => setInsp((x) => ({ ...x, local: v }))} />
        <Campo label="Inspetor" valor={insp.inspetor} onChange={(v) => setInsp((x) => ({ ...x, inspetor: v }))} />
      </div>
      <div className="space-y-3">
        {insp.respostas.map((r, i) => (
          <div key={i} className="rounded-lg border p-3" style={{ borderColor: r.resposta === "nao_conforme" ? "#F5C2C0" : WORK.border }}>
            <p className="text-sm mb-2" style={{ color: WORK.text }}><b>{i + 1}.</b> {r.texto}{r.referencia ? <span className="text-xs" style={{ color: WORK.muted }}> · {r.referencia}</span> : null}</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(RESP).map(([k, [l, cor, Ic]]) => (
                <button key={k} onClick={() => upd(i, "resposta", k)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-sm font-medium"
                  style={{ borderColor: r.resposta === k ? cor : WORK.border, background: r.resposta === k ? cor + "18" : "#fff", color: r.resposta === k ? cor : WORK.muted }}>
                  <Ic size={16} /> {l}
                </button>
              ))}
            </div>
            {(r.resposta === "nao_conforme" || r.observacao) && (
              <textarea className="w-full mt-2 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: WORK.border }} rows={2}
                placeholder={r.resposta === "nao_conforme" ? "Descreva a não conformidade (obrigatório)" : "Observação"} value={r.observacao || ""} onChange={(e) => upd(i, "observacao", e.target.value)} />
            )}
            <div className="flex items-center gap-2 mt-2">
              <label className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer" style={{ borderColor: WORK.border, color: WORK.text }}>
                <Camera size={13} /> {enviando === i ? "Enviando…" : r.foto_uri ? "Trocar foto" : "Foto"}
                <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => foto(i, e.target.files?.[0])} />
              </label>
              {r.foto_uri && fotos[r.foto_uri] && <img src={fotos[r.foto_uri]} alt="" className="h-12 w-12 object-cover rounded" />}
            </div>
          </div>
        ))}
      </div>
      <Campo label="Observações gerais" tipo="textarea" linhas={2} valor={insp.observacoes} onChange={(v) => setInsp((x) => ({ ...x, observacoes: v }))} className="mt-3" />
    </Modal>
  );
}

function EditorModelo({ modelo, setModelo, onFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const [novo, setNovo] = useState("");
  const salvar = async () => {
    if (!modelo.nome || !modelo.itens?.length) return alert("Informe o nome e ao menos um item.");
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...dd } = modelo; // eslint-disable-line no-unused-vars
      if (id) await base44.entities.ModeloChecklist.update(id, dd); else await base44.entities.ModeloChecklist.create(dd);
      aoSalvar(); onFechar();
    } catch (e) { alert("Erro: " + (e?.message || "")); } finally { setSalvando(false); }
  };
  return (
    <Modal aberto onFechar={onFechar} titulo="Modelo de checklist" largura="max-w-2xl"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={salvando}>Salvar modelo</Botao></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Campo label="Nome *" valor={modelo.nome} onChange={(v) => setModelo((m) => ({ ...m, nome: v }))} />
        <Campo label="Norma de referência" valor={modelo.norma} onChange={(v) => setModelo((m) => ({ ...m, norma: v }))} />
      </div>
      <div className="space-y-1 mb-2">
        {(modelo.itens || []).map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-sm" style={{ color: WORK.text }}>
            <span className="flex-1">{i + 1}. {it.texto}</span>
            <button onClick={() => setModelo((m) => ({ ...m, itens: m.itens.filter((_, j) => j !== i) }))} style={{ color: WORK.muted }}><X size={14} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: WORK.border }} value={novo} placeholder="Novo item de verificação" onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && novo.trim()) { setModelo((m) => ({ ...m, itens: [...(m.itens || []), { texto: novo.trim(), referencia: "" }] })); setNovo(""); } }} />
        <Botao onClick={() => { if (novo.trim()) { setModelo((m) => ({ ...m, itens: [...(m.itens || []), { texto: novo.trim(), referencia: "" }] })); setNovo(""); } }}>Adicionar</Botao>
      </div>
    </Modal>
  );
}

function EditorAcao({ a, setA, onFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const set = (k, v) => setA((x) => ({ ...x, [k]: v }));
  const salvar = async () => {
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...dd } = a; // eslint-disable-line no-unused-vars
      if (dd.status === "concluida" && !dd.concluida_em) dd.concluida_em = hojeLocal();
      if (id) await base44.entities.PlanoAcao.update(id, dd); else await base44.entities.PlanoAcao.create(dd);
      aoSalvar(); onFechar();
    } catch (e) { alert("Erro: " + (e?.message || "")); } finally { setSalvando(false); }
  };
  return (
    <Modal aberto onFechar={onFechar} titulo="Ação" largura="max-w-2xl" rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={salvando}>Salvar</Botao></>}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Campo label="Ação" tipo="textarea" linhas={2} valor={a.descricao} onChange={(v) => set("descricao", v)} className="md:col-span-3" />
        <Campo label="Responsável" valor={a.responsavel} onChange={(v) => set("responsavel", v)} />
        <Campo label="Prazo" tipo="date" valor={a.prazo} onChange={(v) => set("prazo", v)} />
        <Campo label="Prioridade" tipo="select" opcoes={Object.fromEntries(Object.entries(PRIORIDADES).map(([k, [l]]) => [k, l]))} valor={a.prioridade} onChange={(v) => set("prioridade", v || "media")} />
        <Campo label="Status" tipo="select" opcoes={STATUS_ACAO} valor={a.status} onChange={(v) => set("status", v || "pendente")} />
        <Campo label="Evidência / como foi resolvido" tipo="textarea" linhas={2} valor={a.evidencia} onChange={(v) => set("evidencia", v)} className="md:col-span-2" />
      </div>
      {a.origem_descricao && <p className="text-xs mt-2" style={{ color: WORK.muted }}>Origem: {a.origem_descricao}</p>}
    </Modal>
  );
}

export default function Inspecoes() {
  const { empresas, empresaId, setEmpresaId } = useEmpresa();
  const [d, setD] = useState(null);
  const [aba, setAba] = useState("inspecoes");
  const [insp, setInsp] = useState(null);
  const [modelo, setModelo] = useState(null);
  const [acao, setAcao] = useState(null);
  const [filtroAcao, setFiltroAcao] = useState("abertas");
  const [ia, setIa] = useState({ tema: "", carregando: false });

  const carregar = useCallback(async () => {
    if (!empresaId) { setD(null); return; }
    const f = (e, o) => base44.entities[e].filter({ company_id: empresaId }, o).catch(() => []);
    const [empresa, inspecoes, acoes, setores, modelos] = await Promise.all([base44.entities.Company.get(empresaId), f("InspecaoChecklist", "-data"), f("PlanoAcao", "prazo"), f("Setor"), base44.entities.ModeloChecklist.list("nome", 200).catch(() => [])]);
    setD({ empresa, inspecoes, acoes, setores, modelos });
  }, [empresaId]);
  useEffect(() => { carregar(); }, [carregar]);

  const iniciar = (m) => setInsp({
    modelo_id: m.id || "", modelo_nome: m.nome, norma: m.norma || "", data: hojeLocal(), setor_id: d.setores[0]?.id || "", inspetor: "", local: "", status: "andamento",
    respostas: m.itens.map((it) => (typeof it === "string" ? { texto: it, referencia: m.norma || "" } : { texto: it.texto, referencia: it.referencia || m.norma || "" })).map((r) => ({ ...r, resposta: "", observacao: "", foto_uri: "" })),
  });

  const gerarIA = async () => {
    if (!ia.tema.trim()) return alert("Descreva o tema (ex.: caldeira e vasos de pressão, cozinha industrial, NR-18 canteiro).");
    setIa((x) => ({ ...x, carregando: true }));
    try {
      const r = await invokeAI("checklist_modelo", {
        prompt: `Crie um checklist de inspeção de segurança do trabalho, objetivo e verificável em campo, para: ${ia.tema}. Empresa: CNAE ${d.empresa.cnae || "?"}. Itens curtos, afirmativos (a resposta "conforme" significa situação segura), com a NR de referência de cada item. Entre 6 e 15 itens. Não invente números de itens de norma.`,
        response_json_schema: { type: "object", properties: { nome: { type: "string" }, norma: { type: "string" }, itens: { type: "array", items: { type: "object", properties: { texto: { type: "string" }, referencia: { type: "string" } } } } } },
      });
      setModelo({ nome: r?.nome || ia.tema, norma: r?.norma || "", itens: r?.itens || [], origem: "ia" });
      setIa({ tema: "", carregando: false });
    } catch (e) { erroMsg(e); setIa((x) => ({ ...x, carregando: false })); }
  };

  if (!d) return <div className="p-4 md:p-8 max-w-6xl mx-auto"><Cabecalho titulo="Inspeções e planos de ação" subtitulo="Checklists no celular, com foto; cada não conformidade vira ação."><SeletorEmpresa empresas={empresas} empresaId={empresaId} setEmpresaId={setEmpresaId} /></Cabecalho></div>;

  const abertas = d.acoes.filter((a) => a.status !== "concluida");
  const atrasadas = abertas.filter((a) => a.prazo && a.prazo < hojeLocal());
  const concluidasInsp = d.inspecoes.filter((i) => i.status === "concluida");
  const media = concluidasInsp.length ? Math.round(concluidasInsp.reduce((s, i) => s + (i.conformidade_pct ?? 0), 0) / concluidasInsp.length) : null;
  const setorNome = Object.fromEntries(d.setores.map((s) => [s.id, s.nome]));
  const todosModelos = [...CHECKLISTS_PADRAO.map((m) => ({ ...m, padrao: true })), ...d.modelos];
  const acoesLista = d.acoes.filter((a) => (filtroAcao === "abertas" ? a.status !== "concluida" : filtroAcao === "atrasadas" ? a.status !== "concluida" && a.prazo && a.prazo < hojeLocal() : true));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Cabecalho titulo="Inspeções e planos de ação" subtitulo="Faça a inspeção pelo celular, com foto. Ao concluir, cada não conformidade vira uma ação com prazo e responsável.">
        <SeletorEmpresa empresas={empresas} empresaId={empresaId} setEmpresaId={setEmpresaId} />
      </Cabecalho>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        <Indicador rotulo="Inspeções concluídas" valor={concluidasInsp.length} onClick={() => setAba("inspecoes")} />
        <Indicador rotulo="Conformidade média" valor={media === null ? "—" : `${media}%`} cor={media === null ? undefined : media >= 90 ? "#146C43" : media >= 70 ? "#8A5A00" : "#B42318"} />
        <Indicador rotulo="Ações abertas" valor={abertas.length} onClick={() => { setAba("acoes"); setFiltroAcao("abertas"); }} />
        <Indicador rotulo="Ações atrasadas" valor={atrasadas.length} cor={atrasadas.length ? "#B42318" : "#146C43"} onClick={() => { setAba("acoes"); setFiltroAcao("atrasadas"); }} />
      </div>

      <Abas abas={[["inspecoes", "Inspeções"], ["nova", "Nova inspeção"], ["acoes", "Planos de ação"], ["modelos", "Modelos"]]} aba={aba} setAba={setAba} />

      {aba === "inspecoes" && (
        <Cartao>
          {d.inspecoes.length === 0 && <Vazio>Nenhuma inspeção. Use a aba "Nova inspeção".</Vazio>}
          <div className="space-y-1.5">
            {d.inspecoes.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-2 rounded-lg p-2.5 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
                <b>{dataBR(i.data)}</b> {i.modelo_nome}
                <span className="text-xs" style={{ color: WORK.muted }}>· {setorNome[i.setor_id] || ""}{i.local ? " / " + i.local : ""}</span>
                {i.status === "concluida"
                  ? <Etiqueta cor={i.conformidade_pct >= 90 ? "#146C43" : i.conformidade_pct >= 70 ? "#8A5A00" : "#B42318"}>{i.conformidade_pct ?? "—"}% conforme</Etiqueta>
                  : <Etiqueta cor="#8A5A00">em andamento</Etiqueta>}
                <span className="ml-auto flex gap-2">
                  {i.status !== "concluida" && <Botao onClick={() => setInsp({ ...i })}><Pencil size={13} /> Continuar</Botao>}
                  {i.status === "concluida" && <Link to={`/inspecoes/relatorio?id=${i.id}`} target="_blank"><Botao><Printer size={13} /> Relatório</Botao></Link>}
                  <button onClick={async () => { if (confirm("Excluir inspeção?")) { await base44.entities.InspecaoChecklist.delete(i.id); carregar(); } }} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
                </span>
              </div>
            ))}
          </div>
        </Cartao>
      )}

      {aba === "nova" && (
        <Cartao titulo="Escolha o checklist">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {todosModelos.map((m, k) => (
              <button key={m.id || k} onClick={() => iniciar(m)} className="rounded-lg border p-3 text-left" style={{ borderColor: WORK.border, background: "#fff" }}>
                <p className="text-sm font-semibold" style={{ color: WORK.text }}>{m.nome}</p>
                <p className="text-xs" style={{ color: WORK.muted }}>{m.norma} · {m.itens.length} itens{m.padrao ? " · modelo padrão" : ""}</p>
              </button>
            ))}
          </div>
          {!d.setores.length && <p className="text-xs mt-3" style={{ color: "#8A5A00" }}>Dica: cadastre os setores em PGR, PCMSO e laudos → Estrutura para vincular a inspeção ao setor.</p>}
        </Cartao>
      )}

      {aba === "acoes" && (
        <Cartao titulo="Planos de ação" acoes={<>
          <select value={filtroAcao} onChange={(e) => setFiltroAcao(e.target.value)} className="px-2 py-1.5 rounded-lg border text-xs" style={{ borderColor: WORK.border }}>
            <option value="abertas">Abertas</option><option value="atrasadas">Atrasadas</option><option value="todas">Todas</option>
          </select>
          <Botao tipo="primario" onClick={() => setAcao({ company_id: empresaId, origem: "manual", prioridade: "media", status: "pendente", prazo: addDias(hojeLocal(), 30) })}><Plus size={14} /> Ação</Botao>
        </>}>
          {acoesLista.length === 0 && <Vazio>Nenhuma ação.</Vazio>}
          <div className="space-y-1.5">
            {acoesLista.map((a) => {
              const s = a.status === "concluida" ? { cor: "#146C43", label: `Concluída ${a.concluida_em ? dataBR(a.concluida_em) : ""}` } : situacao(a.prazo, 7);
              const [pl, pc] = PRIORIDADES[a.prioridade] || PRIORIDADES.media;
              return (
                <button key={a.id} onClick={() => setAcao({ ...a })} className="w-full flex flex-wrap items-center gap-2 rounded-lg p-2.5 text-sm text-left" style={{ background: WORK.bg, color: WORK.text }}>
                  <span className="flex-1 min-w-[200px]">{a.descricao}<span className="block text-xs" style={{ color: WORK.muted }}>{a.origem_descricao || "Manual"} · {a.responsavel || "sem responsável"}</span></span>
                  <Etiqueta cor={pc}>{pl}</Etiqueta>
                  <Etiqueta cor={s.cor}>{s.label}</Etiqueta>
                </button>
              );
            })}
          </div>
        </Cartao>
      )}

      {aba === "modelos" && (
        <Cartao titulo="Modelos de checklist" acoes={<Botao tipo="primario" onClick={() => setModelo({ nome: "", norma: "", itens: [], origem: "manual" })}><Plus size={14} /> Modelo próprio</Botao>}>
          <div className="flex flex-wrap gap-2 items-end mb-4">
            <Campo label="Criar com IA — descreva o tema" valor={ia.tema} onChange={(v) => setIa((x) => ({ ...x, tema: v }))} placeholder="Ex.: cozinha industrial, empilhadeiras, canteiro de obras" className="flex-1 min-w-[260px]" />
            <Botao onClick={gerarIA} carregando={ia.carregando} title="1 crédito"><Sparkles size={14} /> Gerar</Botao>
          </div>
          <div className="space-y-1.5">
            {CHECKLISTS_PADRAO.map((m) => <div key={m.nome} className="rounded-lg p-2.5 text-sm" style={{ background: WORK.bg, color: WORK.text }}><b>{m.nome}</b> <span className="text-xs" style={{ color: WORK.muted }}>· {m.norma} · {m.itens.length} itens · padrão</span></div>)}
            {d.modelos.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg p-2.5 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
                <b>{m.nome}</b> <span className="text-xs" style={{ color: WORK.muted }}>· {m.norma} · {m.itens.length} itens{m.origem === "ia" ? " · IA" : ""}</span>
                <span className="ml-auto flex gap-2">
                  <button onClick={() => setModelo({ ...m })} style={{ color: WORK.muted }}><Pencil size={14} /></button>
                  <button onClick={async () => { if (confirm("Excluir modelo?")) { await base44.entities.ModeloChecklist.delete(m.id); carregar(); } }} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
                </span>
              </div>
            ))}
          </div>
        </Cartao>
      )}

      {insp && <Execucao insp={insp} setInsp={setInsp} d={d} onFechar={() => setInsp(null)} aoSalvar={carregar} />}
      {modelo && <EditorModelo modelo={modelo} setModelo={setModelo} onFechar={() => setModelo(null)} aoSalvar={carregar} />}
      {acao && <EditorAcao a={acao} setA={setAcao} onFechar={() => setAcao(null)} aoSalvar={carregar} />}
    </div>
  );
}
