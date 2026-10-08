import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight, CalendarPlus, UserCheck, Stethoscope, Save, Pencil } from "lucide-react";
import { WORK } from "@/lib/sst";
import { cl, TIPOS_ASO, PERFIS, STATUS_AG, CONCLUSOES, etiquetaFinanceira } from "@/lib/clinica";
import { hojeLocal, addDias, dataBR } from "@/lib/sstGestao";
import { Botao, Campo, Modal, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";
import { Cabecalho, Abas, Indicador } from "@/components/sst/useEmpresa";

function CriarClinica({ aoCriar }) {
  const [f, setF] = useState({ nome: "", cnpj: "", crm: "", crm_uf: "MT" });
  const [salvando, setSalvando] = useState(false);
  const criar = async () => {
    setSalvando(true);
    try { await cl("criar_clinica", f); aoCriar(); } catch (e) { alert(e.message); } finally { setSalvando(false); }
  };
  return (
    <Cartao titulo="Configurar a clínica">
      <p className="text-sm mb-3" style={{ color: WORK.muted }}>Você será o administrador. Depois, cadastre a equipe (médicos, enfermagem, recepção) pelo e-mail de cada um. Se você for médico, informe o CRM para poder emitir ASO.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Campo label="Nome da clínica *" valor={f.nome} onChange={(v) => setF({ ...f, nome: v })} className="md:col-span-2" />
        <Campo label="CNPJ" valor={f.cnpj} onChange={(v) => setF({ ...f, cnpj: v })} />
        <div className="grid grid-cols-2 gap-2"><Campo label="Seu CRM" valor={f.crm} onChange={(v) => setF({ ...f, crm: v })} /><Campo label="UF" valor={f.crm_uf} onChange={(v) => setF({ ...f, crm_uf: v })} /></div>
      </div>
      <div className="mt-3"><Botao tipo="primario" onClick={criar} carregando={salvando}>Criar clínica</Botao></div>
    </Cartao>
);
}

function NovoAgendamento({ ctx, empresas, inicial, onFechar, aoSalvar }) {
  const [f, setF] = useState({ tipo_aso: "periodico", data: hojeLocal(), hora: "08:00", duracao_min: 30, ...inicial });
  const [trabs, setTrabs] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const emp = empresas.find((e) => e.id === f.company_id);
  useEffect(() => { if (f.company_id) cl("trabalhadores", { company_id: f.company_id }).then((r) => setTrabs(r.trabalhadores || [])).catch(() => setTrabs([])); }, [f.company_id]);
  const medicos = (ctx.membros || []).filter((m) => (m.perfil === "medico" || (m.perfil === "admin" && m.crm)) && m.ativo);
  const salvar = async () => {
    const t = trabs.find((x) => x.id === f.trabalhador_id);
    setSalvando(true);
    try { await cl("agenda_salvar", { ...f, cargo_nome: t?.cargo_nome || f.cargo_nome || "" }); aoSalvar(); onFechar(); } catch (e) { alert(e.message); } finally { setSalvando(false); }
  };
  return (
    <Modal aberto onFechar={onFechar} titulo={f.id ? "Editar agendamento" : "Novo agendamento"} largura="max-w-2xl"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={salvando}>Salvar</Botao></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Campo label="Empresa *" tipo="select" opcoes={Object.fromEntries(empresas.map((e) => [e.id, e.razao_social]))} valor={f.company_id} onChange={(v) => setF((x) => ({ ...x, company_id: v, trabalhador_id: "" }))} className="md:col-span-2" />
        {emp && <p className="text-xs md:col-span-2" style={{ color: WORK.muted }}>Cliente: <b>{{ contrato: "Contrato", kit: `Kit (saldo ${emp.kit_saldo})`, avulso: "Avulso" }[emp.tipo_cliente]}</b>{emp.situacao_financeira !== "em_dia" ? ` · situação: ${emp.situacao_financeira}` : ""}</p>}
        <Campo label="Colaborador *" tipo="select" opcoes={Object.fromEntries(trabs.map((t) => [t.id, `${t.nome}${t.cargo_nome ? " — " + t.cargo_nome : ""}`]))} valor={f.trabalhador_id} onChange={(v) => set("trabalhador_id", v)} className="md:col-span-2" />
        <Campo label="Tipo de ASO" tipo="select" opcoes={TIPOS_ASO} valor={f.tipo_aso} onChange={(v) => set("tipo_aso", v || "periodico")} />
        <Campo label="Médico" tipo="select" opcoes={Object.fromEntries(medicos.map((m) => [m.id, m.nome || m.email]))} valor={f.profissional_id} onChange={(v) => set("profissional_id", v)} />
        <Campo label="Data" tipo="date" valor={f.data} onChange={(v) => set("data", v)} />
        <div className="grid grid-cols-2 gap-2"><Campo label="Hora" tipo="time" valor={f.hora} onChange={(v) => set("hora", v)} /><Campo label="Duração (min)" tipo="number" valor={f.duracao_min} onChange={(v) => set("duracao_min", v)} /></div>
        {emp?.tipo_cliente === "avulso" && !f.id && <Campo label="Valor do atendimento avulso (R$)" tipo="number" valor={f.valor ?? emp.valor_avulso ?? ""} onChange={(v) => set("valor", v)} />}
        <Campo label="Observação" valor={f.observacao} onChange={(v) => set("observacao", v)} className="md:col-span-2" />
      </div>
    </Modal>
);
}

function Agenda({ ctx, empresas }) {
  const nav = useNavigate();
  const [dia, setDia] = useState(hojeLocal());
  const [lista, setLista] = useState(null);
  const [novo, setNovo] = useState(null);
  const carregar = useCallback(() => cl("agenda", { inicio: dia, fim: dia }).then((r) => setLista(r.agendamentos || [])).catch((e) => alert(e.message)), [dia]);
  useEffect(() => { carregar(); }, [carregar]);
  const status = async (a, s) => {
    try {
      const r = await cl("agenda_status", { id: a.id, status: s });
      if (s === "chegou" && r.atendimento_id) nav(`/clinica/atendimento?id=${r.atendimento_id}`); else carregar();
    } catch (e) { alert(e.message); }
  };
  const pago = async (a) => { if (!confirm(`Confirmar pagamento da guia ${a.financeiro?.guia_codigo}?`)) return; try { await cl("financeiro_pago", { id: a.id, pago: true }); carregar(); } catch (e) { alert(e.message); } };
  const podeFin = ["admin", "recepcao"].includes(ctx.perfil);
  return (
    <Cartao acoes={<Botao tipo="primario" onClick={() => setNovo({ data: dia })}><Plus size={14} /> Agendar</Botao>}>
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => setDia(addDias(dia, -1))} className="p-1.5 rounded border" style={{ borderColor: WORK.border }}><ChevronLeft size={16} /></button>
        <input type="date" value={dia} onChange={(e) => setDia(e.target.value)} className="px-2 py-1.5 rounded border text-sm" style={{ borderColor: WORK.border }} />
        <button onClick={() => setDia(addDias(dia, 1))} className="p-1.5 rounded border" style={{ borderColor: WORK.border }}><ChevronRight size={16} /></button>
        <button onClick={() => setDia(hojeLocal())} className="text-xs underline" style={{ color: WORK.accent }}>hoje</button>
        <span className="text-sm ml-2" style={{ color: WORK.muted }}>{lista ? `${lista.length} agendamento(s)` : "carregando…"}</span>
      </div>
      {lista && lista.length === 0 && <Vazio>Nenhum agendamento neste dia.</Vazio>}
      <div className="space-y-1.5">
        {(lista || []).map((a) => {
          const [sl, sc] = STATUS_AG[a.status] || ["", "#5F6368"];
          const fe = etiquetaFinanceira(a.financeiro, a.empresa_financeiro);
          return (
            <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg p-2.5 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
              <b className="w-12">{a.hora || "—"}</b>
              <span className="flex-1 min-w-[200px]">{a.trabalhador_nome}<span className="block text-xs" style={{ color: WORK.muted }}>{a.empresa_nome} · {TIPOS_ASO[a.tipo_aso]}{a.cargo_nome ? " · " + a.cargo_nome : ""}</span></span>
              {fe && <Etiqueta cor={fe[1]}>{fe[0]}</Etiqueta>}
              <Etiqueta cor={sc}>{sl}</Etiqueta>
              {["agendado", "confirmado"].includes(a.status) && <>
                <Botao tipo="primario" onClick={() => status(a, "chegou")}><UserCheck size={14} /> Chegou</Botao>
                {a.status === "agendado" && <Botao onClick={() => status(a, "confirmado")}>Confirmar</Botao>}
                <Botao tipo="perigo" onClick={() => status(a, "faltou")}>Faltou</Botao>
              </>}
              {a.atendimento_id && <Link to={`/clinica/atendimento?id=${a.atendimento_id}`}><Botao><Stethoscope size={14} /> Atendimento</Botao></Link>}
              {podeFin && a.financeiro?.tipo === "avulso" && !a.financeiro?.pago && <Botao onClick={() => pago(a)}>Pagamento recebido</Botao>}
              {["agendado", "confirmado"].includes(a.status) && <button onClick={() => setNovo({ ...a })} style={{ color: WORK.muted }}><Pencil size={14} /></button>}
            </div>
        );
        })}
      </div>
      {novo && <NovoAgendamento ctx={ctx} empresas={empresas} inicial={novo} onFechar={() => setNovo(null)} aoSalvar={carregar} />}
    </Cartao>
);
}

function Fila() {
  const [lista, setLista] = useState(null);
  const carregar = () => cl("fila").then((r) => setLista(r.atendimentos || [])).catch((e) => alert(e.message));
  useEffect(() => { carregar(); const t = setInterval(carregar, 30000); return () => clearInterval(t); }, []);
  const grupos = [["Aguardando triagem", ["aberto"]], ["Triagem feita — aguardando médico", ["triagem"]], ["Em consulta", ["consulta"]], ["Aguardando resultados", ["aguardando_resultados"]], ["ASO emitido (últimas 24 h)", ["finalizado"]]];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {grupos.map(([t, st]) => {
        const itens = (lista || []).filter((a) => st.includes(a.status));
        return (
          <Cartao key={t} titulo={`${t} (${itens.length})`}>
            {itens.length === 0 && <Vazio>—</Vazio>}
            {itens.map((a) => (
              <Link key={a.id} to={`/clinica/atendimento?id=${a.id}`} className="flex flex-wrap items-center gap-2 rounded-lg p-2 mb-1 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
                <span className="flex-1">{a.trabalhador_nome}<span className="block text-xs" style={{ color: WORK.muted }}>{a.empresa_nome} · {TIPOS_ASO[a.tipo_aso]} · chegada {a.tempos?.chegada ? new Date(a.tempos.chegada).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}</span></span>
                {a.conclusao && <Etiqueta cor={CONCLUSOES[a.conclusao]?.[1]}>{CONCLUSOES[a.conclusao]?.[0]}</Etiqueta>}
              </Link>
          ))}
          </Cartao>
      );
      })}
    </div>
);
}

function Convocacao({ ctx, empresas }) {
  const [dias, setDias] = useState(30);
  const [itens, setItens] = useState(null);
  const [sel, setSel] = useState([]);
  const [data, setData] = useState(addDias(hojeLocal(), 7));
  const [gerando, setGerando] = useState(false);
  const carregar = useCallback(() => cl("convocacao", { dias }).then((r) => { setItens(r.itens || []); setSel([]); }).catch((e) => alert(e.message)), [dias]);
  useEffect(() => { carregar(); }, [carregar]);
  const gerar = async () => {
    if (!sel.length) return;
    setGerando(true);
    try {
      let hora = 7 * 60 + 30;
      for (const id of sel) {
        const i = itens.find((x) => x.trabalhador_id === id);
        await cl("agenda_salvar", { company_id: i.company_id, trabalhador_id: i.trabalhador_id, tipo_aso: "periodico", data, hora: `${String(Math.floor(hora / 60)).padStart(2, "0")}:${String(hora % 60).padStart(2, "0")}`, duracao_min: 20, origem: "convocacao" });
        hora += 20;
      }
      alert(`${sel.length} agendamento(s) criado(s) em ${dataBR(data)}, a partir das 07:30. Ajuste os horários na agenda se precisar.`);
      carregar();
    } catch (e) { alert(e.message); } finally { setGerando(false); }
  };
  return (
    <Cartao titulo="Convocação de exames periódicos">
      <p className="text-xs mb-3" style={{ color: WORK.muted }}>Cruza o PCMSO de cada cargo com o último ASO emitido na clínica. Colaboradores sem ASO registrado aparecem como "sem ASO no sistema" (importe o histórico do sistema anterior para ficar preciso).</p>
      <div className="flex flex-wrap items-end gap-2 mb-3">
        <Campo label="Vencendo em até (dias)" tipo="number" valor={dias} onChange={(v) => setDias(Number(v) || 0)} />
        <Campo label="Agendar para" tipo="date" valor={data} onChange={setData} />
        <Botao tipo="primario" onClick={gerar} carregando={gerando} disabled={!sel.length || !["admin", "recepcao", "enfermagem", "medico"].includes(ctx.perfil)}><CalendarPlus size={14} /> Agendar {sel.length} selecionado(s)</Botao>
      </div>
      {itens === null && <Vazio>Calculando…</Vazio>}
      {itens && itens.length === 0 && <Vazio>Ninguém com periódico vencendo no período.</Vazio>}
      {itens && itens.length > 0 && (
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-xs" style={{ color: WORK.text }}>
            <thead className="sticky top-0 bg-white"><tr style={{ color: WORK.muted }}>
              <th className="p-2"><input type="checkbox" checked={sel.length === itens.length} onChange={(e) => setSel(e.target.checked ? itens.map((i) => i.trabalhador_id) : [])} /></th>
              <th className="text-left p-2">Colaborador</th><th className="text-left p-2">Empresa</th><th className="text-left p-2">Último ASO</th><th className="text-left p-2">Vence</th>
            </tr></thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.trabalhador_id} className="border-t" style={{ borderColor: WORK.border }}>
                  <td className="p-2 text-center"><input type="checkbox" checked={sel.includes(i.trabalhador_id)} onChange={() => setSel((s) => (s.includes(i.trabalhador_id) ? s.filter((x) => x !== i.trabalhador_id) : [...s, i.trabalhador_id]))} /></td>
                  <td className="p-2">{i.nome}</td><td className="p-2">{i.empresa}</td><td className="p-2">{i.ultimo_aso ? dataBR(i.ultimo_aso) : "sem ASO no sistema"}</td>
                  <td className="p-2">{i.vence ? <Etiqueta cor={i.vence < hojeLocal() ? "#B42318" : "#8A5A00"}>{dataBR(i.vence)}</Etiqueta> : "—"}{i.sem_pcmso ? "  sem PCMSO" : ""}</td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
    )}
    </Cartao>
);
}

function Empresas({ empresas, recarregar, ctx }) {
  const [edit, setEdit] = useState(null);
  const salvar = async () => { try { await cl("empresa_financeiro", { company_id: edit.id, ...edit }); setEdit(null); recarregar(); } catch (e) { alert(e.message); } };
  const podeFin = ["admin", "recepcao"].includes(ctx.perfil);
  return (
    <Cartao titulo="Empresas atendidas: tipo de cliente e situação financeira">
      <div className="space-y-1.5">
        {empresas.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center gap-2 rounded-lg p-2.5 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
            <span className="flex-1 min-w-[200px]">{e.razao_social}<span className="block text-xs" style={{ color: WORK.muted }}>{e.cnpj}</span></span>
            <Etiqueta cor={WORK.accent}>{{ contrato: "Contrato", kit: `Kit · saldo ${e.kit_saldo}`, avulso: `Avulso${e.valor_avulso ? " · R$ " + e.valor_avulso : ""}` }[e.tipo_cliente]}</Etiqueta>
            <Etiqueta cor={{ em_dia: "#146C43", pendente: "#8A5A00", bloqueado: "#B42318" }[e.situacao_financeira]}>{{ em_dia: "Em dia", pendente: "Pendente", bloqueado: "Bloqueado" }[e.situacao_financeira]}</Etiqueta>
            {podeFin && <button onClick={() => setEdit({ ...e })} style={{ color: WORK.muted }}><Pencil size={14} /></button>}
          </div>
      ))}
      </div>
      {edit && (
        <Modal aberto onFechar={() => setEdit(null)} titulo={edit.razao_social} largura="max-w-lg" rodape={<><Botao onClick={() => setEdit(null)}>Cancelar</Botao><Botao tipo="primario" onClick={salvar}><Save size={14} /> Salvar</Botao></>}>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Tipo de cliente" tipo="select" opcoes={{ contrato: "Contrato (mensal)", kit: "Kit / pacote pré-pago", avulso: "Avulso" }} valor={edit.tipo_cliente} onChange={(v) => setEdit((x) => ({ ...x, tipo_cliente: v || "contrato" }))} />
            <Campo label="Situação financeira" tipo="select" opcoes={{ em_dia: "Em dia", pendente: "Pendente", bloqueado: "Bloqueado" }} valor={edit.situacao_financeira} onChange={(v) => setEdit((x) => ({ ...x, situacao_financeira: v || "em_dia" }))} />
            {edit.tipo_cliente === "kit" && <Campo label="Saldo do kit (atendimentos)" tipo="number" valor={edit.kit_saldo} onChange={(v) => setEdit((x) => ({ ...x, kit_saldo: v }))} />}
            {edit.tipo_cliente === "avulso" && <Campo label="Valor padrão do avulso (R$)" tipo="number" valor={edit.valor_avulso} onChange={(v) => setEdit((x) => ({ ...x, valor_avulso: v }))} />}
          </div>
        </Modal>
    )}
    </Cartao>
);
}

function Equipe({ ctx, recarregar }) {
  const [edit, setEdit] = useState(null);
  const salvar = async () => { try { await cl("membro_salvar", edit); setEdit(null); recarregar(); } catch (e) { alert(e.message); } };
  return (
    <Cartao titulo="Equipe da clínica" acoes={<Botao tipo="primario" onClick={() => setEdit({ perfil: "recepcao", ativo: true })}><Plus size={14} /> Membro</Botao>}>
      <p className="text-xs mb-3" style={{ color: WORK.muted }}>Cadastre pelo e-mail. A pessoa precisa ter acesso ao SmartSeg (convite em Planos e assentos) e, no primeiro acesso, é vinculada à clínica automaticamente. Só médicos com CRM emitem ASO; recepção não vê dados clínicos.</p>
      <div className="space-y-1.5">
        {(ctx.membros || []).map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg p-2.5 text-sm" style={{ background: WORK.bg, color: WORK.text, opacity: m.ativo ? 1 : 0.5 }}>
            <span className="flex-1">{m.nome || m.email}<span className="block text-xs" style={{ color: WORK.muted }}>{m.email}{m.crm ? ` · CRM ${m.crm}/${m.crm_uf}` : ""}</span></span>
            <Etiqueta cor={WORK.accent}>{PERFIS[m.perfil]}</Etiqueta>
            {!m.vinculado && <Etiqueta cor="#8A5A00">aguardando 1º acesso</Etiqueta>}
            <button onClick={() => setEdit({ ...m })} style={{ color: WORK.muted }}><Pencil size={14} /></button>
          </div>
      ))}
      </div>
      {edit && (
        <Modal aberto onFechar={() => setEdit(null)} titulo="Membro da equipe" largura="max-w-lg" rodape={<><Botao onClick={() => setEdit(null)}>Cancelar</Botao><Botao tipo="primario" onClick={salvar}><Save size={14} /> Salvar</Botao></>}>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="E-mail *" valor={edit.email} onChange={(v) => setEdit((x) => ({ ...x, email: v }))} className="col-span-2" />
            <Campo label="Nome" valor={edit.nome} onChange={(v) => setEdit((x) => ({ ...x, nome: v }))} className="col-span-2" />
            <Campo label="Perfil" tipo="select" opcoes={PERFIS} valor={edit.perfil} onChange={(v) => setEdit((x) => ({ ...x, perfil: v || "recepcao" }))} />
            <Campo tipo="checkbox" label="Ativo" valor={edit.ativo} onChange={(v) => setEdit((x) => ({ ...x, ativo: v }))} />
            <Campo label="CRM / registro profissional" valor={edit.crm} onChange={(v) => setEdit((x) => ({ ...x, crm: v }))} />
            <Campo label="UF" valor={edit.crm_uf} onChange={(v) => setEdit((x) => ({ ...x, crm_uf: v }))} />
          </div>
        </Modal>
    )}
    </Cartao>
);
}

export default function Clinica() {
  const [ctx, setCtx] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [aba, setAba] = useState("agenda");
  const carregar = useCallback(async () => {
    try {
      const c = await cl("contexto");
      setCtx(c);
      if (!c.sem_clinica) setEmpresas((await cl("empresas")).empresas || []);
    } catch (e) { alert(e.message); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  if (!ctx) return <div className="p-4 md:p-8 max-w-6xl mx-auto"><Cabecalho titulo="Clínica" /><Vazio>Carregando…</Vazio></div>;
  if (ctx.sem_clinica) return <div className="p-4 md:p-8 max-w-4xl mx-auto"><Cabecalho titulo="Clínica" subtitulo="Agenda, atendimento médico ocupacional e ASO." /><CriarClinica aoCriar={carregar} /></div>;

  const abas = [["agenda", "Agenda"], ["fila", "Fila de atendimento"], ["convocacao", "Convocação"], ["empresas", "Empresas e financeiro"]];
  if (ctx.perfil === "admin") abas.push(["equipe", "Equipe"]);
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Cabecalho titulo={ctx.clinica.nome} subtitulo={`Você está como ${PERFIS[ctx.perfil]}${ctx.medico ? " (emite ASO)" : ""}.`} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <Indicador rotulo="Empresas atendidas" valor={empresas.length} onClick={() => setAba("empresas")} />
        <Indicador rotulo="Avulsas" valor={empresas.filter((e) => e.tipo_cliente === "avulso").length} />
        <Indicador rotulo="Kits com saldo baixo" valor={empresas.filter((e) => e.tipo_cliente === "kit" && e.kit_saldo <= 3).length} cor="#8A5A00" />
        <Indicador rotulo="Com pendência financeira" valor={empresas.filter((e) => e.situacao_financeira !== "em_dia").length} cor="#B42318" />
      </div>
      <Abas abas={abas} aba={aba} setAba={setAba} />
      {aba === "agenda" && <Agenda ctx={ctx} empresas={empresas} />}
      {aba === "fila" && <Fila />}
      {aba === "convocacao" && <Convocacao ctx={ctx} empresas={empresas} />}
      {aba === "empresas" && <Empresas empresas={empresas} recarregar={carregar} ctx={ctx} />}
      {aba === "equipe" && <Equipe ctx={ctx} recarregar={carregar} />}
    </div>
);
}