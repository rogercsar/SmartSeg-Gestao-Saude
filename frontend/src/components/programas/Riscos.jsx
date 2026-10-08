import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Sparkles, Pencil, Trash2, CheckCircle2, MessageSquareText, X, Library } from "lucide-react";
import { carregarCatalogos } from "@/lib/catalogoSst";
import { WORK, TIPOS_RISCO, EXPOSICAO, MATRIZES, NR15_ANEXOS, NR16_ANEXOS, GRAUS_INSALUBRIDADE, avaliar } from "@/lib/sst";
import { sugerirRiscos, caracterizarRisco } from "@/lib/programasIA";
import { Botao, Campo, Modal, Cartao, Etiqueta, Vazio, ListaTexto, erroMsg } from "@/components/programas/ui";
import PropostaRiscos from "@/components/programas/PropostaRiscos";
import PlanoAcaoRisco from "@/components/programas/PlanoAcaoRisco";
import ComboboxCodigoEsocial from "@/components/esocial/ComboboxCodigoEsocial";
import { SeletorCatalogoRisco } from "@/components/programas/SeletorCatalogo";

const tiposOpc = Object.fromEntries(Object.entries(TIPOS_RISCO).map(([k, v]) => [k, v.label]));
const opcNota = (labels) => Object.fromEntries(labels.map((l, i) => [i + 1, `${i + 1} — ${l}`]));

// Editor completo de um risco (usado também na aba de laudos)
export function RiscoEditor({ risco, setRisco, dados, onFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const [catAberto, setCatAberto] = useState(false);
  const [cat, setCat] = useState(null);
  const [examesAplicar, setExamesAplicar] = useState({});
  useEffect(() => { carregarCatalogos().then(setCat).catch(() => {}); }, []);
  if (!risco) return null;
  const set = (k, v) => setRisco((r) => ({ ...r, [k]: v }));
  const setObj = (k, campo, v) => setRisco((r) => ({ ...r, [k]: { ...(r[k] || {}), [campo]: v } }));
  const doCatalogo = (it) => {
    if (!it) { setCatAberto(false); return; }
    set("agente", it.agente);
    if (it.tipo) set("tipo", it.tipo);
    if (it.codigo_esocial) set("codigo_esocial", it.codigo_esocial);
    set("codigo_esocial_descricao", it.codigo_esocial_descricao || "");
    if (it.fonte_geradora && !risco.fonte_geradora) set("fonte_geradora", it.fonte_geradora);
    if (it.possiveis_danos && !risco.possiveis_danos) set("possiveis_danos", it.possiveis_danos);
    if (it.meio_propagacao && !risco.meio_propagacao) set("meio_propagacao", it.meio_propagacao);
    set("catalogo_id", it.id);
    set("aptidao_ids", it.aptidao_ids || []);
    const m = {};
    (it.exame_ids || []).forEach((id) => (m[id] = true));
    setExamesAplicar(m);
    setCatAberto(false);
  };
  const m = MATRIZES["5x5"];
  const av = avaliar(risco, "5x5");
  const cargosSetor = dados.cargos.filter((c) => !risco.setor_id || !c.setor_id || c.setor_id === risco.setor_id);
  const setores = Object.fromEntries(dados.setores.map((s) => [s.id, s.nome]));

  const salvar = async () => {
    if (!risco.tipo || !risco.agente) return alert("Informe o tipo e o agente/perigo.");
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...d } = risco; // eslint-disable-line no-unused-vars
      d.nivel_risco = av?.nivel || "";
      let riscoId = id;
      if (id) await base44.entities.Risco.update(id, d);
      else { const criado = await base44.entities.Risco.create({ ...d, company_id: dados.empresa.id }); riscoId = criado.id; }
      // Aplicar exames sugeridos do catálogo ao PCMSO dos cargos vinculados
      if (risco.catalogo_id && riscoId && (risco.cargo_ids || []).length && cat) {
        const selecionados = Object.entries(examesAplicar).filter(([, v]) => v).map(([k]) => k);
        const exCat = selecionados.map((eid) => cat.exames.find((x) => x.id === eid)).filter(Boolean);
        for (const cid of risco.cargo_ids) {
          const existentes = (dados.exames || []).filter((e) => e.cargo_id === cid).map((e) => (e.exame || "").trim().toLowerCase());
          const novos = exCat.filter((e) => !existentes.includes((e.exame || "").trim().toLowerCase())).map((e) => ({
            company_id: dados.empresa.id, cargo_id: cid, exame: e.exame, catalogo_id: e.id,
            codigo_esocial: e.codigo_esocial || "", codigo_esocial_descricao: e.codigo_esocial_descricao || "",
            momentos: e.momentos_default || ["admissional", "periodico"], periodicidade_meses: e.periodicidade_meses || 12,
            justificativa: e.justificativa_modelo || "", risco_ids: [riscoId], origem: "manual", ativo: true,
          }));
          if (novos.length) await base44.entities.ExamePcmso.bulkCreate(novos);
        }
      }
      aoSalvar?.();
      onFechar();
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || ""));
    } finally {
      setSalvando(false);
    }
  };

  const lista = (k, novo) => ({
    itens: risco[k] || [],
    add: () => set(k, [...(risco[k] || []), novo]),
    upd: (i, campo, v) => set(k, (risco[k] || []).map((x, j) => (j === i ? { ...x, [campo]: v } : x))),
    del: (i) => set(k, (risco[k] || []).filter((_, j) => j !== i)),
  });
  const epc = lista("epc", { nome: "", eficaz: true });
  const epi = lista("epi", { nome: "", ca: "", eficaz: true });
  const plano = lista("plano_acao", { acao: "", responsavel: "", prazo: "", status: "pendente" });
  const inp = "px-2 py-1.5 rounded border text-sm outline-none";
  const st = { background: WORK.bg, borderColor: WORK.border, color: WORK.text };

  return (
    <Modal aberto onFechar={onFechar} titulo={risco.id ? "Editar risco" : "Novo risco"} largura="max-w-4xl"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={salvando}>Salvar</Botao></>}>
      <div className="space-y-5">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Campo label="Tipo *" tipo="select" opcoes={tiposOpc} valor={risco.tipo} onChange={(v) => set("tipo", v)} />
          <div className="md:col-span-2">
            <span className="flex items-center justify-between text-xs mb-1" style={{ color: WORK.muted }}>
              <span>Agente / perigo *</span>
              <button type="button" onClick={() => setCatAberto(true)} className="flex items-center gap-1 text-[11px]" style={{ color: WORK.accent }}>
                <Library size={12} /> Do catálogo
              </button>
            </span>
            <input className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-sky-500" style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={risco.agente || ""} onChange={(e) => set("agente", e.target.value)} placeholder="Ex.: Ruído contínuo" />
          </div>
          <Campo label="Setor" tipo="select" opcoes={setores} valor={risco.setor_id} onChange={(v) => set("setor_id", v)} />
          <div>
            <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Código eSocial (Tabela 24)</span>
            <ComboboxCodigoEsocial tabela="agente_nocivo_aposentadoria" value={risco.codigo_esocial || ""} onChange={(v) => set("codigo_esocial", v)} onChangeItem={(it) => set("codigo_esocial_descricao", it?.descricao || "")} placeholder="Buscar agente nocivo..." />
          </div>
          <Campo label="Exposição" tipo="select" opcoes={EXPOSICAO} valor={risco.exposicao} onChange={(v) => set("exposicao", v)} />
          <Campo label="Fonte geradora / circunstância" valor={risco.fonte_geradora} onChange={(v) => set("fonte_geradora", v)} className="md:col-span-3" />
          <Campo label="Possíveis lesões / agravos" valor={risco.possiveis_danos} onChange={(v) => set("possiveis_danos", v)} className="md:col-span-2" />
          <Campo label="Meio de propagação / via" valor={risco.meio_propagacao} onChange={(v) => set("meio_propagacao", v)} />
        </section>

        <section>
          <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Cargos expostos (GHE)</span>
          <div className="flex flex-wrap gap-2">
            {cargosSetor.map((c) => {
              const on = (risco.cargo_ids || []).includes(c.id);
              return (
                <button key={c.id} onClick={() => set("cargo_ids", on ? risco.cargo_ids.filter((x) => x !== c.id) : [...(risco.cargo_ids || []), c.id])}
                  className="px-2.5 py-1 rounded-full text-xs border" style={{ borderColor: on ? WORK.accent : WORK.border, color: on ? WORK.accent : WORK.muted }}>
                  {c.nome_cargo}
                </button>
            );
            })}
          </div>
        </section>

        {risco.catalogo_id && cat && (
          <section className="rounded-lg border p-3" style={{ borderColor: WORK.border, background: "rgba(11,111,168,0.04)" }}>
            <div className="text-xs font-medium mb-2" style={{ color: WORK.accent }}>Vínculos sugeridos pelo catálogo (editáveis)</div>
            <div className="mb-3">
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Aptidões ASO — sugestão para avaliação e validação do médico responsável</span>
              <div className="flex flex-wrap gap-1.5">
                {cat.aptidoes.length === 0 && <span className="text-xs" style={{ color: WORK.muted }}>Nenhuma aptidão cadastrada no catálogo.</span>}
                {cat.aptidoes.map((a) => {
                  const on = (risco.aptidao_ids || []).includes(a.id);
                  return (
                    <button key={a.id} type="button" onClick={() => set("aptidao_ids", on ? (risco.aptidao_ids || []).filter((x) => x !== a.id) : [...(risco.aptidao_ids || []), a.id])}
                      className="px-2 py-0.5 rounded-full text-[11px] border" style={{ borderColor: on ? WORK.accent : WORK.border, color: on ? WORK.accent : WORK.muted }} title={a.descricao || ""}>{on ? "✓ " : ""}{a.nome}</button>
                );
                })}
              </div>
            </div>
            <div>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Exames sugeridos (incluídos no PCMSO dos cargos ao salvar)</span>
              <div className="space-y-1">
                {Object.keys(examesAplicar).length === 0 && <span className="text-xs" style={{ color: WORK.muted }}>Nenhum exame associado a este risco no catálogo.</span>}
                {Object.keys(examesAplicar).map((eid) => {
                  const e = cat.exames.find((x) => x.id === eid);
                  if (!e) return null;
                  return (
                    <label key={eid} className="flex items-center gap-2 text-sm" style={{ color: WORK.text }}>
                      <input type="checkbox" checked={!!examesAplicar[eid]} onChange={(ev) => setExamesAplicar((m) => ({ ...m, [eid]: ev.target.checked }))} />
                      {e.exame}{e.codigo_esocial ? ` (eSocial ${e.codigo_esocial})` : ""}
                    </label>
                );
                })}
              </div>
            </div>
          </section>
      )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Campo label="Avaliação" tipo="select" opcoes={{ qualitativa: "Qualitativa", quantitativa: "Quantitativa" }} valor={risco.tipo_avaliacao} onChange={(v) => set("tipo_avaliacao", v)} />
          <Campo label="Intensidade / concentração medida" valor={risco.intensidade} onChange={(v) => set("intensidade", v)} />
          <Campo label="Unidade de medida" valor={risco.unidade_medida} onChange={(v) => set("unidade_medida", v)} placeholder="dB(A), mg/m³, IBUTG…" />
          <Campo label="Limite de tolerância" valor={risco.limite_tolerancia} onChange={(v) => set("limite_tolerancia", v)} />
          <Campo label="Técnica de medição" valor={risco.tecnica_medicao} onChange={(v) => set("tecnica_medicao", v)} placeholder="NHO-01, NHO-06…" className="md:col-span-2" />
          </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <Campo label="Severidade" tipo="select" opcoes={opcNota(m.severidade)} valor={risco.severidade || ""} onChange={(v) => set("severidade", Number(v) || 0)} />
          <Campo label="Probabilidade" tipo="select" opcoes={opcNota(m.probabilidade)} valor={risco.probabilidade || ""} onChange={(v) => set("probabilidade", Number(v) || 0)} />
          <div className="text-sm pb-2" style={{ color: WORK.text }}>
            {av ? <><Etiqueta cor={av.cor}>{av.label} · {av.valor}</Etiqueta><p className="text-xs mt-1" style={{ color: WORK.muted }}>{av.acao}</p></> : <span style={{ color: WORK.muted }}>Defina S e P</span>}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Campo label="Data da avaliação / revisão (NR-01 1.5.4.4.6)" tipo="date" valor={risco.data_avaliacao} onChange={(v) => set("data_avaliacao", v)} />
          <Campo label="Motivo da revisão" valor={risco.motivo_revisao} onChange={(v) => set("motivo_revisao", v)} placeholder="Mudança, acidente, medida implementada…" className="md:col-span-2" />
          <Campo label="Justificativa da severidade e probabilidade" tipo="textarea" valor={risco.criterio_avaliacao} onChange={(v) => set("criterio_avaliacao", v)} className="md:col-span-3" />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ListaTexto label="Medidas de controle existentes (administrativas, organizacionais)" itens={risco.medidas_existentes || []} onChange={(v) => set("medidas_existentes", v)} />
          <div>
            <span className="block text-xs mb-1" style={{ color: WORK.muted }}>EPC (proteção coletiva)</span>
            {epc.itens.map((x, i) => (
              <div key={i} className="flex gap-2 mb-1 items-center">
                <input className={inp + " flex-1"} style={st} value={x.nome} onChange={(e) => epc.upd(i, "nome", e.target.value)} />
                <label className="text-xs flex items-center gap-1" style={{ color: WORK.muted }}><input type="checkbox" checked={!!x.eficaz} onChange={(e) => epc.upd(i, "eficaz", e.target.checked)} />eficaz</label>
                <button onClick={() => epc.del(i)} style={{ color: WORK.muted }}><X size={14} /></button>
              </div>
          ))}
            <Botao onClick={epc.add}><Plus size={13} /> EPC</Botao>
          </div>
        </section>

        <section>
          <span className="block text-xs mb-1" style={{ color: WORK.muted }}>EPI (com número do CA — obrigatório no eSocial)</span>
          {epi.itens.map((x, i) => (
            <div key={i} className="flex flex-wrap gap-2 mb-1 items-center">
              <input className={inp + " flex-1 min-w-[160px]"} style={st} placeholder="EPI" value={x.nome} onChange={(e) => epi.upd(i, "nome", e.target.value)} />
              <input className={inp + " w-28"} style={st} placeholder="CA" value={x.ca} onChange={(e) => epi.upd(i, "ca", e.target.value)} />
              <label className="text-xs flex items-center gap-1" style={{ color: WORK.muted }}><input type="checkbox" checked={!!x.eficaz} onChange={(e) => epi.upd(i, "eficaz", e.target.checked)} />eficaz</label>
              <button onClick={() => epi.del(i)} style={{ color: WORK.muted }}><X size={14} /></button>
            </div>
        ))}
          <Botao onClick={epi.add}><Plus size={13} /> EPI</Botao>
        </section>

        <section>
          <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Plano de ação (NR-01, 1.5.5.2): eliminação → proteção coletiva → administração → EPI</span>
          {plano.itens.map((x, i) => (
            <div key={i} className="rounded-lg border p-2 mb-2 grid grid-cols-1 md:grid-cols-3 gap-2" style={{ borderColor: WORK.border }}>
              <input className={inp + " md:col-span-2"} style={st} placeholder="Medida de prevenção" value={x.acao || ""} onChange={(e) => plano.upd(i, "acao", e.target.value)} />
              <select className={inp} style={st} value={x.tipo_medida || ""} onChange={(e) => plano.upd(i, "tipo_medida", e.target.value)}>
                <option value="">Tipo de medida</option><option value="eliminacao">Eliminar perigo</option><option value="coletiva">Proteção coletiva</option><option value="administrativa">Administrativa / organização</option><option value="individual">Proteção individual</option>
              </select>
              <input className={inp} style={st} placeholder="Responsável" value={x.responsavel || ""} onChange={(e) => plano.upd(i, "responsavel", e.target.value)} />
              <input type="date" className={inp} style={st} aria-label="Prazo" value={x.prazo || ""} onChange={(e) => plano.upd(i, "prazo", e.target.value)} />
              <select className={inp} style={st} value={x.status || "pendente"} onChange={(e) => plano.upd(i, "status", e.target.value)}>
                <option value="pendente">Pendente</option><option value="andamento">Em andamento</option><option value="concluida">Concluída</option>
              </select>
              <input className={inp} style={st} placeholder="Forma de acompanhamento" value={x.acompanhamento || ""} onChange={(e) => plano.upd(i, "acompanhamento", e.target.value)} />
              <input className={inp} style={st} placeholder="Como aferir o resultado" value={x.afericao_resultado || ""} onChange={(e) => plano.upd(i, "afericao_resultado", e.target.value)} />
              <input className={inp} style={st} placeholder="Registro da implementação (data / evidência)" value={x.registro_implementacao || ""} onChange={(e) => plano.upd(i, "registro_implementacao", e.target.value)} />
              <button onClick={() => plano.del(i)} className="text-xs flex items-center gap-1" style={{ color: WORK.muted }}><X size={14} /> Remover</button>
            </div>
        ))}
          <Botao onClick={plano.add}><Plus size={13} /> Ação</Botao>
        </section>

        {risco.id && <PlanoAcaoRisco risco={risco} dados={dados} />}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t pt-4" style={{ borderColor: WORK.border }}>
          <div className="space-y-2">
            <Campo tipo="checkbox" label="Insalubre (NR-15)" valor={risco.insalubridade?.caracteriza} onChange={(v) => setObj("insalubridade", "caracteriza", v)} />
            <Campo label="Anexo" tipo="select" opcoes={NR15_ANEXOS} valor={risco.insalubridade?.anexo} onChange={(v) => setObj("insalubridade", "anexo", v)} />
            <Campo label="Grau" tipo="select" opcoes={GRAUS_INSALUBRIDADE} valor={risco.insalubridade?.grau} onChange={(v) => setObj("insalubridade", "grau", v)} />
            <Campo label="Fundamentação" tipo="textarea" valor={risco.insalubridade?.fundamentacao} onChange={(v) => setObj("insalubridade", "fundamentacao", v)} />
          </div>
          <div className="space-y-2">
            <Campo tipo="checkbox" label="Perigoso (NR-16)" valor={risco.periculosidade?.caracteriza} onChange={(v) => setObj("periculosidade", "caracteriza", v)} />
            <Campo label="Anexo" tipo="select" opcoes={NR16_ANEXOS} valor={risco.periculosidade?.anexo} onChange={(v) => setObj("periculosidade", "anexo", v)} />
            <Campo label="Fundamentação" tipo="textarea" valor={risco.periculosidade?.fundamentacao} onChange={(v) => setObj("periculosidade", "fundamentacao", v)} />
          </div>
          <div className="space-y-2">
            <Campo tipo="checkbox" label="Aposentadoria especial (LTCAT)" valor={risco.aposentadoria_especial?.enquadra} onChange={(v) => setObj("aposentadoria_especial", "enquadra", v)} />
            <Campo label="Código Anexo IV (Dec. 3.048)" valor={risco.aposentadoria_especial?.codigo_anexo_iv} onChange={(v) => setObj("aposentadoria_especial", "codigo_anexo_iv", v)} placeholder="ex.: 2.0.1" />
            <Campo label="Fundamentação" tipo="textarea" valor={risco.aposentadoria_especial?.fundamentacao} onChange={(v) => setObj("aposentadoria_especial", "fundamentacao", v)} />
          </div>
        </section>

        <Campo tipo="checkbox" label="Revisado e validado pelo responsável técnico" valor={risco.revisado} onChange={(v) => set("revisado", v)} />
        {catAberto && <SeletorCatalogoRisco tipoFiltro={risco.tipo} onSelecionar={doCatalogo} onFechar={() => setCatAberto(false)} />}
      </div>
    </Modal>
);
}

export default function Riscos({ dados, recarregar, irPara }) {
  const [edit, setEdit] = useState(null);
  const [alvo, setAlvo] = useState({ setor_id: dados.setores[0]?.id || "", cargo_id: "" });
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState("");
  const [proposta, setProposta] = useState(null);
  const [filtro, setFiltro] = useState("");

  const setor = dados.setores.find((s) => s.id === alvo.setor_id);
  const cargo = dados.cargos.find((c) => c.id === alvo.cargo_id);
  const cargosSetor = dados.cargos.filter((c) => c.setor_id === alvo.setor_id);
  const ctx = { empresa: dados.empresa, setor, cargo, unidade: dados.unidades.find((u) => u.id === setor?.unidade_id) };
  const nomesCargos = Object.fromEntries(dados.cargos.map((c) => [c.id, c.nome_cargo]));

  const iaSugerir = async () => {
    if (!setor) return alert("Escolha o setor.");
    setOcupado("sugerir");
    try {
      setProposta({ riscos: await sugerirRiscos(ctx), cargoIds: cargo ? [cargo.id] : cargosSetor.map((c) => c.id) });
    } catch (e) { erroMsg(e); } finally { setOcupado(""); }
  };

  const iaCaracterizar = async () => {
    if (!setor) return alert("Escolha o setor.");
    if (!texto.trim()) return alert("Descreva o risco com suas palavras.");
    setOcupado("texto");
    try {
      setProposta({ riscos: await caracterizarRisco(texto, ctx), cargoIds: cargo ? [cargo.id] : cargosSetor.map((c) => c.id) });
      setTexto("");
    } catch (e) { erroMsg(e); } finally { setOcupado(""); }
  };

  const excluir = async (r) => {
    if (!confirm(`Excluir o risco "${r.agente}"?`)) return;
    await base44.entities.Risco.delete(r.id);
    recarregar();
  };

  const porSetor = dados.setores.map((s) => ({ setor: s, riscos: dados.riscos.filter((r) => r.setor_id === s.id && (!filtro || r.tipo === filtro)) }));
  const semSetor = dados.riscos.filter((r) => !dados.setores.some((s) => s.id === r.setor_id));
  const pendentes = dados.riscos.filter((r) => !r.revisado).length;

  if (!dados.setores.length) {
    return <Cartao><Vazio>Cadastre ao menos um setor e seus cargos na aba Estrutura.</Vazio><div className="flex justify-center"><Botao onClick={() => irPara("estrutura")}>Ir para Estrutura</Botao></div></Cartao>;
  }

  return (
    <div className="space-y-4">
      <Cartao titulo="Identificar riscos com IA">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <Campo label="Setor" tipo="select" opcoes={Object.fromEntries(dados.setores.map((s) => [s.id, s.nome]))} valor={alvo.setor_id} onChange={(v) => setAlvo({ setor_id: v, cargo_id: "" })} />
          <Campo label="Cargo (opcional — vazio = todos do setor)" tipo="select" opcoes={Object.fromEntries(cargosSetor.map((c) => [c.id, c.nome_cargo]))} valor={alvo.cargo_id} onChange={(v) => setAlvo((a) => ({ ...a, cargo_id: v }))} />
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <Botao tipo="primario" onClick={iaSugerir} carregando={ocupado === "sugerir"} title="2 créditos"><Sparkles size={14} /> Sugerir inventário de riscos (CNAE + atividades)</Botao>
          <Botao onClick={() => setEdit({ setor_id: alvo.setor_id, cargo_ids: cargo ? [cargo.id] : [], tipo_avaliacao: "qualitativa", origem: "manual" })}><Plus size={14} /> Cadastrar manualmente</Botao>
        </div>
        <Campo label="Ou descreva um risco com suas palavras — a IA caracteriza tecnicamente" tipo="textarea" linhas={2} valor={texto} onChange={setTexto}
          placeholder="Ex.: o operador fica perto da serra circular que faz muito barulho e solta pó de madeira o dia todo" />
        <div className="mt-2"><Botao onClick={iaCaracterizar} carregando={ocupado === "texto"} title="2 créditos"><MessageSquareText size={14} /> Caracterizar com IA</Botao></div>
      </Cartao>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm" style={{ color: WORK.text }}>{dados.riscos.length} risco(s)</span>
        {pendentes > 0 && <Etiqueta cor="#EAB308">{pendentes} aguardando revisão técnica</Etiqueta>}
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="ml-auto px-2 py-1.5 rounded-lg border text-xs" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
          <option value="">Todos os tipos</option>
          {Object.entries(tiposOpc).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {[...porSetor, ...(semSetor.length ? [{ setor: { id: "_", nome: "Sem setor" }, riscos: semSetor }] : [])].map(({ setor: s, riscos }) => (
        <Cartao key={s.id} titulo={`${s.nome} (${riscos.length})`}>
          {riscos.length === 0 && <Vazio>Nenhum risco neste setor.</Vazio>}
          <div className="space-y-2">
            {riscos.map((r) => {
              const av = avaliar(r, "5x5");
              return (
                <div key={r.id} className="flex items-start gap-2 rounded-lg p-3" style={{ background: WORK.bg }}>
                  <div className="flex-1 min-w-0 text-sm" style={{ color: WORK.text }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Etiqueta cor={TIPOS_RISCO[r.tipo]?.cor || "#94A3B8"}>{TIPOS_RISCO[r.tipo]?.label || r.tipo}</Etiqueta>
                      <b>{r.agente}</b>
                      {av && <Etiqueta cor={av.cor}>{av.label}</Etiqueta>}
                      {r.revisado ? <CheckCircle2 size={14} style={{ color: "#22C55E" }} /> : <Etiqueta cor="#94A3B8">não revisado</Etiqueta>}
                      {r.insalubridade?.caracteriza && <Etiqueta cor="#F97316">insalubre</Etiqueta>}
                      {r.periculosidade?.caracteriza && <Etiqueta cor="#EF4444">perigoso</Etiqueta>}
                    </div>
                    <p className="text-xs mt-1" style={{ color: WORK.muted }}>
                      {r.fonte_geradora || "—"} · Cargos: {(r.cargo_ids || []).map((id) => nomesCargos[id]).filter(Boolean).join(", ") || "nenhum"}
                      {r.codigo_esocial ? ` · eSocial ${r.codigo_esocial}${r.codigo_esocial_descricao ? " — " + r.codigo_esocial_descricao : ""}` : " ·  sem código eSocial"}
                      {(r.aptidao_ids || []).length > 0 && ` · ${r.aptidao_ids.length} aptidão(ões) ASO`}
                    </p>
                  </div>
                  <button onClick={() => setEdit({ ...r })} style={{ color: WORK.muted }}><Pencil size={15} /></button>
                  <button onClick={() => excluir(r)} style={{ color: WORK.muted }}><Trash2 size={15} /></button>
                </div>
            );
            })}
          </div>
        </Cartao>
    ))}

      <div className="flex justify-end"><Botao tipo="primario" onClick={() => irPara("matriz")}>Próximo: matriz de risco →</Botao></div>

      {edit && <RiscoEditor risco={edit} setRisco={setEdit} dados={dados} onFechar={() => setEdit(null)} aoSalvar={recarregar} />}
      <PropostaRiscos aberto={!!proposta} onFechar={() => setProposta(null)} riscos={proposta?.riscos || []} dados={dados}
        setorId={alvo.setor_id} cargoIds={proposta?.cargoIds || []} origem="ia" aoSalvar={recarregar} />
    </div>
);
}