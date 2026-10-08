import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, CalendarPlus, Sparkles, Save, ShieldCheck } from "lucide-react";
import { WORK } from "@/lib/sst";
import { FUNCOES_CIPA, CH_CIPA, cronogramaEleitoral, fimEstabilidade, situacao, addMeses, addDias, hojeLocal, dataBR } from "@/lib/sstGestao";
import { invokeAI } from "@/lib/ai";
import { Botao, Campo, Modal, Cartao, Etiqueta, Vazio, erroMsg } from "@/components/programas/ui";
import { useEmpresa, SeletorEmpresa, Cabecalho, Abas, Indicador } from "@/components/sst/useEmpresa";

const REPRESENTACAO = { empregados: "Empregados (eleito)", empregador: "Empregador (indicado)" };
const eleito = (m) => m.representacao === "empregados";

function EditorReuniao({ r, setR, mandato, d, onFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const [ia, setIa] = useState(false);
  const set = (k, v) => setR((x) => ({ ...x, [k]: v }));
  const membros = mandato?.membros || [];
  const salvar = async () => {
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...dd } = r; // eslint-disable-line no-unused-vars
      if (id) await base44.entities.ReuniaoCipa.update(id, dd); else await base44.entities.ReuniaoCipa.create({ ...dd, company_id: d.empresa.id, mandato_id: mandato?.id || "" });
      aoSalvar(); onFechar();
    } catch (e) { alert("Erro: " + (e?.message || "")); } finally { setSalvando(false); }
  };
  const redigir = async () => {
    if (!r.pauta?.trim()) return alert("Escreva a pauta e os pontos discutidos (mesmo em tópicos).");
    setIa(true);
    try {
      const txt = await invokeAI("cipa_ata", {
        prompt: `Redija a ata de reunião ${r.tipo === "extraordinaria" ? "extraordinária" : "ordinária"} da CIPA (NR-5) em linguagem formal, em português, com: abertura (data ${dataBR(r.data)}, empresa ${d.empresa.razao_social}), presentes (${(r.presentes || []).join(", ") || "a informar"}), assuntos tratados, deliberações com responsáveis e prazos quando houver, e encerramento. Use SOMENTE as informações abaixo, sem inventar fatos:\n${r.pauta}`,
      });
      set("ata", typeof txt === "string" ? txt : "");
    } catch (e) { erroMsg(e); } finally { setIa(false); }
  };
  return (
    <Modal aberto onFechar={onFechar} titulo={r.id ? "Reunião da CIPA" : "Nova reunião"} largura="max-w-3xl"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={salvando}><Save size={14} /> Salvar</Botao></>}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Campo label="Data" tipo="date" valor={r.data} onChange={(v) => set("data", v)} />
        <Campo label="Tipo" tipo="select" opcoes={{ ordinaria: "Ordinária", extraordinaria: "Extraordinária" }} valor={r.tipo} onChange={(v) => set("tipo", v || "ordinaria")} />
        <Campo label="Status" tipo="select" opcoes={{ agendada: "Agendada", realizada: "Realizada", cancelada: "Cancelada" }} valor={r.status} onChange={(v) => set("status", v || "agendada")} />
      </div>
      <p className="text-xs mt-3 mb-1" style={{ color: WORK.muted }}>Presentes</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {membros.map((m) => {
          const on = (r.presentes || []).includes(m.nome);
          return <button key={m.nome} onClick={() => set("presentes", on ? r.presentes.filter((x) => x !== m.nome) : [...(r.presentes || []), m.nome])}
            className="px-2.5 py-1 rounded-full text-xs border" style={{ borderColor: on ? WORK.accent : WORK.border, color: on ? WORK.accent : WORK.muted }}>{m.nome}</button>;
        })}
        {!membros.length && <span className="text-xs" style={{ color: WORK.muted }}>Cadastre os membros no mandato.</span>}
      </div>
      <Campo label="Pauta e pontos discutidos (tópicos)" tipo="textarea" linhas={4} valor={r.pauta} onChange={(v) => set("pauta", v)} />
      <div className="flex items-center justify-between mt-3 mb-1">
        <span className="text-xs" style={{ color: WORK.muted }}>Ata</span>
        <Botao onClick={redigir} carregando={ia} title="1 crédito"><Sparkles size={14} /> Redigir ata com IA</Botao>
      </div>
      <Campo tipo="textarea" linhas={10} valor={r.ata} onChange={(v) => set("ata", v)} />
    </Modal>
  );
}

export default function Cipa() {
  const { empresas, empresaId, setEmpresaId } = useEmpresa();
  const [d, setD] = useState(null);
  const [m, setM] = useState(null); // mandato em edição
  const [aba, setAba] = useState("mandato");
  const [reuniao, setReuniao] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [novoMembro, setNovoMembro] = useState({ funcao: "titular", representacao: "empregados" });

  const carregar = useCallback(async () => {
    if (!empresaId) { setD(null); return; }
    const f = (e, o) => base44.entities[e].filter({ company_id: empresaId }, o).catch(() => []);
    const [empresa, mandatos, reunioes, trabalhadores] = await Promise.all([base44.entities.Company.get(empresaId), f("MandatoCipa", "-inicio"), f("ReuniaoCipa", "data"), f("Trabalhador", "nome")]);
    setD({ empresa, mandatos, reunioes, trabalhadores });
    const atual = mandatos.find((x) => x.status === "vigente") || mandatos[0];
    setM(atual ? { ...atual } : null);
  }, [empresaId]);
  useEffect(() => { carregar(); }, [carregar]);

  const novoMandato = () => {
    const ini = hojeLocal();
    setM({ tipo: "cipa", inicio: ini, fim: addDias(addMeses(ini, 12), -1), grau_risco: d.empresa.grau_de_risco || "", membros: [], status: "vigente" });
  };

  const salvarMandato = async (extra = {}) => {
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...dd } = { ...m, ...extra }; // eslint-disable-line no-unused-vars
      dd.eleicao = dd.eleicao && Object.keys(dd.eleicao).length ? dd.eleicao : cronogramaEleitoral(dd.fim);
      if (id) await base44.entities.MandatoCipa.update(id, dd);
      else await base44.entities.MandatoCipa.create({ ...dd, company_id: empresaId });
      await carregar();
    } catch (e) { alert("Erro: " + (e?.message || "")); } finally { setSalvando(false); }
  };

  const addMembro = () => {
    const t = d.trabalhadores.find((x) => x.id === novoMembro.trabalhador_id);
    if (!t) return alert("Escolha o colaborador.");
    const funcao = m.tipo === "designado" ? "designado" : novoMembro.funcao;
    setM((x) => ({ ...x, membros: [...(x.membros || []), { trabalhador_id: t.id, nome: t.nome, funcao, representacao: m.tipo === "designado" ? "empregador" : novoMembro.representacao, condicao: "", treinamento_data: "" }] }));
    setNovoMembro({ funcao: "titular", representacao: "empregados" });
  };

  const gerarCalendario = async () => {
    if (!m?.id) return alert("Salve o mandato antes.");
    const existentes = d.reunioes.filter((r) => r.mandato_id === m.id && r.tipo === "ordinaria").map((r) => r.data.slice(0, 7));
    const novas = [];
    for (let i = 0; i < 12; i++) {
      const data = addMeses(m.inicio, i);
      if (data > m.fim) break;
      if (!existentes.includes(data.slice(0, 7))) novas.push({ company_id: empresaId, mandato_id: m.id, data, tipo: "ordinaria", status: "agendada", pauta: "", ata: "", presentes: [] });
    }
    if (!novas.length) return alert("O calendário deste mandato já está completo.");
    await base44.entities.ReuniaoCipa.bulkCreate(novas);
    carregar();
  };

  const atualizarEstabilidade = async () => {
    const fim = fimEstabilidade(m.fim);
    let n = 0;
    for (const mb of m.membros || []) {
      if (!mb.trabalhador_id) continue;
      const funcaoCadastro = { presidente: "presidente", vice_presidente: "vice_presidente", secretario: "secretario", titular: "membro", suplente: "suplente", designado: "membro" }[mb.funcao] || "membro";
      const upd = { cipa_cargo: funcaoCadastro };
      if (eleito(mb)) upd.estabilidade = { tem: true, tipo: "CIPA — representante eleito dos empregados", data_fim: fim, observacao: `Mandato ${dataBR(m.inicio)} a ${dataBR(m.fim)} (ADCT art. 10, II, "a")` };
      await base44.entities.Trabalhador.update(mb.trabalhador_id, upd);
      n++;
    }
    alert(`${n} cadastro(s) de colaborador atualizado(s) com a função na CIPA e, para os eleitos, a estabilidade até ${dataBR(fim)}.`);
  };

  if (!d) return <div className="p-4 md:p-8 max-w-6xl mx-auto"><Cabecalho titulo="CIPA" subtitulo="Mandato, membros, estabilidade, reuniões, atas e eleição (NR-5)."><SeletorEmpresa empresas={empresas} empresaId={empresaId} setEmpresaId={setEmpresaId} /></Cabecalho></div>;

  const reunioesMandato = m?.id ? d.reunioes.filter((r) => r.mandato_id === m.id) : [];
  const proxima = reunioesMandato.find((r) => r.status === "agendada" && r.data >= hojeLocal());
  const semAta = reunioesMandato.filter((r) => r.status === "realizada" && !r.ata).length;
  const atrasadas = reunioesMandato.filter((r) => r.status === "agendada" && r.data < hojeLocal()).length;
  const crono = m?.eleicao && Object.keys(m.eleicao).length ? m.eleicao : cronogramaEleitoral(m?.fim);
  const ch = CH_CIPA[Number(m?.grau_risco || d.empresa.grau_de_risco)] || null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Cabecalho titulo="CIPA" subtitulo="Mandato, membros, estabilidade, reuniões mensais, atas e cronograma eleitoral (NR-5).">
        <SeletorEmpresa empresas={empresas} empresaId={empresaId} setEmpresaId={setEmpresaId} />
        <Botao onClick={novoMandato}><Plus size={14} /> Novo mandato</Botao>
      </Cabecalho>

      {!m && <Cartao><Vazio>Nenhum mandato cadastrado. Clique em "Novo mandato".</Vazio></Cartao>}

      {m && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
            <Indicador rotulo="Fim do mandato" valor={dataBR(m.fim)} cor={situacao(m.fim, 90).cor} detalhe={situacao(m.fim, 90).label} />
            <Indicador rotulo="Próxima reunião" valor={proxima ? dataBR(proxima.data) : "—"} onClick={() => setAba("reunioes")} />
            <Indicador rotulo="Reuniões atrasadas / sem ata" valor={`${atrasadas} / ${semAta}`} cor={atrasadas || semAta ? "#B42318" : "#146C43"} onClick={() => setAba("reunioes")} />
            <Indicador rotulo="Edital da próxima eleição" valor={crono ? dataBR(crono.edital) : "—"} cor={crono ? situacao(crono.edital, 30).cor : undefined} onClick={() => setAba("eleicao")} />
          </div>

          <Abas abas={[["mandato", "Mandato e membros"], ["reunioes", "Reuniões e atas"], ["eleicao", "Eleição"]]} aba={aba} setAba={setAba} />

          {aba === "mandato" && (
            <Cartao titulo={m.id ? "Mandato" : "Novo mandato"} acoes={<>
              {m.id && <Botao onClick={atualizarEstabilidade}><ShieldCheck size={14} /> Atualizar cadastro e estabilidade</Botao>}
              <Botao tipo="primario" onClick={() => salvarMandato()} carregando={salvando}><Save size={14} /> Salvar</Botao>
            </>}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                <Campo label="Tipo" tipo="select" opcoes={{ cipa: "CIPA eleita", designado: "Designado (NR-5)" }} valor={m.tipo} onChange={(v) => setM((x) => ({ ...x, tipo: v || "cipa" }))} />
                <Campo label="Início" tipo="date" valor={m.inicio} onChange={(v) => setM((x) => ({ ...x, inicio: v, fim: addDias(addMeses(v, 12), -1), eleicao: null }))} />
                <Campo label="Fim" tipo="date" valor={m.fim} onChange={(v) => setM((x) => ({ ...x, fim: v, eleicao: null }))} />
                <Campo label="Grau de risco" tipo="select" opcoes={{ 1: "1", 2: "2", 3: "3", 4: "4" }} valor={String(m.grau_risco || "")} onChange={(v) => setM((x) => ({ ...x, grau_risco: v }))} />
                <Campo label="Status" tipo="select" opcoes={{ planejado: "Planejado", vigente: "Vigente", encerrado: "Encerrado" }} valor={m.status} onChange={(v) => setM((x) => ({ ...x, status: v || "vigente" }))} />
              </div>
              {ch && <p className="text-xs mb-3" style={{ color: WORK.muted }}>Treinamento dos membros: {ch} h (grau de risco {m.grau_risco || d.empresa.grau_de_risco}), antes da posse — registre em Treinamentos (NR-05). Confira o dimensionamento no Quadro I da NR-5.</p>}
              {(m.membros || []).length === 0 && <Vazio>Nenhum membro.</Vazio>}
              <div className="space-y-1.5 mb-3">
                {(m.membros || []).map((mb, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg p-2.5 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
                    <b>{mb.nome}</b>
                    <Etiqueta cor={WORK.accent}>{FUNCOES_CIPA[mb.funcao] || mb.funcao}</Etiqueta>
                    <span className="text-xs" style={{ color: WORK.muted }}>{REPRESENTACAO[mb.representacao] || ""}</span>
                    {eleito(mb) && m.fim && <Etiqueta cor="#146C43">estabilidade até {dataBR(fimEstabilidade(m.fim))}</Etiqueta>}
                    <label className="text-xs flex items-center gap-1 ml-auto" style={{ color: WORK.muted }}>treinado em
                      <input type="date" className="px-1.5 py-0.5 rounded border text-xs" style={{ borderColor: WORK.border }} value={mb.treinamento_data || ""}
                        onChange={(e) => setM((x) => ({ ...x, membros: x.membros.map((y, j) => (j === i ? { ...y, treinamento_data: e.target.value } : y)) }))} />
                    </label>
                    <button onClick={() => setM((x) => ({ ...x, membros: x.membros.filter((_, j) => j !== i) }))} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <Campo label="Colaborador" tipo="select" opcoes={Object.fromEntries(d.trabalhadores.map((t) => [t.id, t.nome]))} valor={novoMembro.trabalhador_id} onChange={(v) => setNovoMembro((x) => ({ ...x, trabalhador_id: v }))} className="md:col-span-2" />
                {m.tipo !== "designado" && <>
                  <Campo label="Função" tipo="select" opcoes={Object.fromEntries(Object.entries(FUNCOES_CIPA).filter(([k]) => k !== "designado"))} valor={novoMembro.funcao} onChange={(v) => setNovoMembro((x) => ({ ...x, funcao: v || "titular" }))} />
                  <Campo label="Representação" tipo="select" opcoes={REPRESENTACAO} valor={novoMembro.representacao} onChange={(v) => setNovoMembro((x) => ({ ...x, representacao: v || "empregados" }))} />
                </>}
              </div>
              <div className="mt-2"><Botao onClick={addMembro}><Plus size={14} /> Adicionar membro</Botao></div>
              <p className="text-[11px] mt-3" style={{ color: WORK.muted }}>Estabilidade: representantes eleitos dos empregados (titulares e suplentes), do registro da candidatura até 1 ano após o fim do mandato. Salve o mandato e use "Atualizar cadastro e estabilidade" para gravar no cadastro de cada colaborador.</p>
            </Cartao>
          )}

          {aba === "reunioes" && (
            <Cartao titulo={`Reuniões do mandato (${reunioesMandato.length})`} acoes={<>
              <Botao onClick={gerarCalendario}><CalendarPlus size={14} /> Gerar calendário mensal</Botao>
              <Botao tipo="primario" onClick={() => setReuniao({ data: hojeLocal(), tipo: "extraordinaria", status: "agendada", presentes: [] })} disabled={!m.id}><Plus size={14} /> Reunião</Botao>
            </>}>
              {reunioesMandato.length === 0 && <Vazio>Gere o calendário de reuniões ordinárias mensais do mandato.</Vazio>}
              <div className="space-y-1.5">
                {reunioesMandato.map((r) => {
                  const atras = r.status === "agendada" && r.data < hojeLocal();
                  return (
                    <button key={r.id} onClick={() => setReuniao({ ...r })} className="w-full flex flex-wrap items-center gap-2 rounded-lg p-2.5 text-sm text-left" style={{ background: WORK.bg, color: WORK.text }}>
                      <b>{dataBR(r.data)}</b> {r.tipo === "extraordinaria" ? "Extraordinária" : "Ordinária"}
                      <Etiqueta cor={r.status === "realizada" ? "#146C43" : atras ? "#B42318" : r.status === "cancelada" ? "#5F6368" : "#8A5A00"}>{atras ? "Não realizada" : { agendada: "Agendada", realizada: "Realizada", cancelada: "Cancelada" }[r.status]}</Etiqueta>
                      {r.status === "realizada" && !r.ata && <Etiqueta cor="#B42318">sem ata</Etiqueta>}
                    </button>
                  );
                })}
              </div>
            </Cartao>
          )}

          {aba === "eleicao" && crono && (
            <Cartao titulo="Cronograma da próxima eleição" acoes={<Botao tipo="primario" onClick={() => salvarMandato({ eleicao: m.eleicao && Object.keys(m.eleicao).length ? m.eleicao : crono })} carregando={salvando}><Save size={14} /> Salvar datas</Botao>}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[["edital", "Publicação do edital (mín. 60 dias antes do fim)"], ["inscricoes_inicio", "Início das inscrições"], ["inscricoes_fim", "Fim das inscrições (mín. 15 dias)"], ["votacao", "Votação (mín. 30 dias antes do fim)"], ["apuracao", "Apuração"], ["posse", "Posse do novo mandato"]].map(([k, l]) => (
                  <div key={k}>
                    <Campo label={l} tipo="date" valor={crono[k]} onChange={(v) => setM((x) => ({ ...x, eleicao: { ...crono, [k]: v } }))} />
                    <p className="text-[11px] mt-1" style={{ color: situacao(crono[k], 15).cor }}>{situacao(crono[k], 15).label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] mt-3" style={{ color: WORK.muted }}>Datas sugeridas a partir dos prazos mínimos da NR-5, contados do fim do mandato atual. Os documentos do processo (edital, atas de eleição e posse) estão em Documentos → Kit Eleitoral NR-5.</p>
            </Cartao>
          )}
        </>
      )}
      {reuniao && <EditorReuniao r={reuniao} setR={setReuniao} mandato={m} d={d} onFechar={() => setReuniao(null)} aoSalvar={carregar} />}
    </div>
  );
}
