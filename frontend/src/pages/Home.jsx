import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44, organizacaoAtual } from "@/api/base44Client";
import { useAppState } from "@/lib/AppState";
import { Building2, Users, AlertTriangle, CalendarClock, FileCheck2, ClipboardCheck, Stethoscope, HardHat, Sparkles, ArrowRight, Plus, ShieldCheck, FolderCheck } from "lucide-react";
import { WORK } from "@/lib/sst";
import { hojeLocal, addDias, dataBR } from "@/lib/sstGestao";
import { montarVencimentos } from "@/pages/Vencimentos";
import { situacaoTreinamentos } from "@/pages/Treinamentos";
import { situacaoEpiColaborador } from "@/pages/Epi";
import { Etiqueta, Vazio } from "@/components/programas/ui";
import Retomada from "@/components/Retomada";

const DOCS = { pgr: "PGR", pcmso: "PCMSO", ltcat: "LTCAT", insalubridade: "Laudo de insalubridade", periculosidade: "Laudo de periculosidade" };
const COR = { ok: "#146C43", atencao: "#8A5A00", critico: "#B42318", nd: "#5F6368" };
const GERAL_TXT = { ok: "Em dia", atencao: "Atenção", critico: "Crítico" };
const lst = (e, ord, lim = 5000) => base44.entities[e].list(ord, lim).catch(() => []);

function Kpi({ icone: Icon, rotulo, valor, detalhe, cor, to }) {
  const corpo = (
    <div className="rounded-xl border p-4 h-full" style={{ background: "#fff", borderColor: WORK.border }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: WORK.muted }}>{rotulo}</span>
        <Icon size={16} style={{ color: cor || WORK.accent }} />
      </div>
      <p className="text-3xl font-bold leading-none" style={{ color: cor || WORK.text }}>{valor}</p>
      {detalhe && <p className="text-[11px] mt-2" style={{ color: WORK.muted }}>{detalhe}</p>}
    </div>
  );
  return to ? <Link to={to}>{corpo}</Link> : corpo;
}

// Situação de um documento obrigatório da empresa
function sitDoc(programas, companyId, tipo) {
  const p = programas.filter((x) => x.company_id === companyId && x.tipo === tipo).sort((a, b) => (b.data_emissao || "").localeCompare(a.data_emissao || ""))[0];
  if (!p) return { k: "critico", txt: "Ausente" };
  if (p.status !== "emitido") return { k: "atencao", txt: "Rascunho" };
  if (p.vigencia_ate && p.vigencia_ate < hojeLocal()) return { k: "critico", txt: `Vencido ${dataBR(p.vigencia_ate)}` };
  if (p.vigencia_ate && p.vigencia_ate <= addDias(hojeLocal(), 60)) return { k: "atencao", txt: `Vence ${dataBR(p.vigencia_ate)}` };
  return { k: "ok", txt: "Vigente" };
}

// Recorta todos os arrays do conjunto de dados para uma única empresa.
function filtrarEmpresa(d, cid) {
  const por = (arr) => (arr || []).filter((x) => x.company_id === cid);
  return {
    ...d,
    empresas: d.empresas.filter((e) => e.id === cid),
    trabalhadores: por(d.trabalhadores),
    matriz: por(d.matriz),
    treinamentos: por(d.treinamentos),
    riscos: por(d.riscos),
    entregas: por(d.entregas),
    itensEpi: por(d.itensEpi),
    programas: por(d.programas),
    equipamentos: d.equipamentos, // equipamentos de medição não têm empresa vinculada
    docsTerceiros: por(d.docsTerceiros),
    terceiras: por(d.terceiras),
    terceirasNome: d.terceirasNome, // mantém o mapa de nomes
    mandatos: por(d.mandatos),
    reunioes: por(d.reunioes),
    acoes: por(d.acoes),
    atestados: por(d.atestados),
    vacinas: por(d.vacinas),
    emitidos: por(d.emitidos),
  };
}

function Stat({ rotulo, valor, cor }) {
  return (
    <div className="rounded-lg border p-3" style={{ background: WORK.bg, borderColor: WORK.border }}>
      <p className="text-[11px] mb-0.5" style={{ color: WORK.muted }}>{rotulo}</p>
      <p className="text-sm font-semibold" style={{ color: cor || WORK.text }}>{valor}</p>
    </div>
  );
}

export default function Home() {
  const nav = useNavigate();
  const { activeCompanyId } = useAppState();
  const [d, setD] = useState(null);

  useEffect(() => {
    (async () => {
      const [empresas, trabalhadores, matriz, treinamentos, riscos, entregas, itensEpi, programas, equipamentos, docsTerceiros, terceiras, mandatos, reunioes, acoes, atestados, vacinas, emitidos] = await Promise.all([
        lst("Company", "razao_social"), lst("Trabalhador"), lst("MatrizTreinamento"), lst("Treinamento"), lst("Risco"), lst("EntregaEpi"), lst("EpiItem"),
        lst("ProgramaSST"), lst("Equipamento"), lst("DocumentoTerceiro"), lst("Terceira"), lst("MandatoCipa"), lst("ReuniaoCipa"), lst("PlanoAcao"),
        lst("Atestado"), lst("Vacina"), lst("Autenticacao", "-emitido_em", 8),
      ]);
      setD({ empresas, trabalhadores, matriz, treinamentos, riscos, entregas, itensEpi, programas, equipamentos, docsTerceiros, terceiras, terceirasNome: Object.fromEntries(terceiras.map((t) => [t.id, t.razao_social])), mandatos, reunioes, acoes, atestados, vacinas, emitidos });
    })();
  }, []);

  // Empresa ativa e definição do modo: matriz (ou nenhuma) => visão consolidada de todos os clientes.
  const empresaAtiva = useMemo(() => (d ? d.empresas.find((e) => e.id === activeCompanyId) : null), [d, activeCompanyId]);
  const consolidado = !empresaAtiva || empresaAtiva.e_matriz === true;

  const r = useMemo(() => {
    if (!d) return null;
    const data = consolidado ? d : filtrarEmpresa(d, activeCompanyId);
    const venc = montarVencimentos(data);
    const vencidos = venc.filter((v) => v.sit.k === "vencido");
    const proximos = venc.filter((v) => v.sit.k === "vence");
    const h = hojeLocal();
    const ativos = data.trabalhadores.filter((t) => t.status !== "inativo");
    // conformidade por cliente
    const clientes = data.empresas.map((e) => {
      const trab = ativos.filter((t) => t.company_id === e.id);
      const treino = situacaoTreinamentos(trab, data.matriz.filter((m) => m.company_id === e.id), data.treinamentos.filter((x) => x.company_id === e.id));
      const itensTreino = treino.flatMap((s) => s.itens);
      const treinoOk = itensTreino.length ? Math.round((itensTreino.filter((i) => i.sit.k === "ok" || i.sit.k === "vence").length / itensTreino.length) * 100) : null;
      const riscosE = data.riscos.filter((x) => x.company_id === e.id);
      const entregasE = data.entregas.filter((x) => x.company_id === e.id);
      const epiPend = trab.filter((t) => situacaoEpiColaborador(t, riscosE, entregasE).pendentes.length).length;
      const atrasadas = data.acoes.filter((a) => a.company_id === e.id && a.status !== "concluida" && a.prazo && a.prazo < h).length;
      const pgr = sitDoc(data.programas, e.id, "pgr"), pcmso = sitDoc(data.programas, e.id, "pcmso");
      const pontos = [pgr.k, pcmso.k, treinoOk === null ? "nd" : treinoOk >= 90 ? "ok" : treinoOk >= 70 ? "atencao" : "critico", epiPend ? "critico" : "ok", atrasadas ? "atencao" : "ok"];
      const geral = pontos.includes("critico") ? "critico" : pontos.includes("atencao") ? "atencao" : "ok";
      return { e, vidas: trab.length, pgr, pcmso, treinoOk, epiPend, atrasadas, geral };
    }).sort((a, b) => ({ critico: 0, atencao: 1, ok: 2 }[a.geral] - { critico: 0, atencao: 1, ok: 2 }[b.geral]));
    return {
      data, venc, vencidos, proximos, ativos: ativos.length, clientes,
      empresaCliente: clientes[0] || null,
      emConformidade: clientes.filter((c) => c.geral === "ok").length,
      totalClientes: data.empresas.length,
      acoesAtrasadas: data.acoes.filter((a) => a.status !== "concluida" && a.prazo && a.prazo < h).length,
    };
  }, [d, activeCompanyId, consolidado]);

  const org = organizacaoAtual();
  const saudacao = (() => { const hh = new Date().getHours(); return hh < 12 ? "Bom dia" : hh < 18 ? "Boa tarde" : "Boa noite"; })();

  if (!d || !r) return <div className="p-4 md:p-8 max-w-7xl mx-auto"><p className="text-sm" style={{ color: WORK.muted }}>Carregando painel…</p></div>;

  if (!d.empresas.length) return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="rounded-xl border p-8 text-center" style={{ background: "#fff", borderColor: WORK.border }}>
        <Building2 size={32} className="mx-auto mb-3" style={{ color: WORK.accent }} />
        <h1 className="text-xl font-bold mb-2" style={{ color: WORK.text }}>Comece cadastrando seus clientes</h1>
        <p className="text-sm mb-5" style={{ color: WORK.muted }}>Cadastre as empresas atendidas uma a uma ou importe tudo de uma vez por planilha (empresas, colaboradores e histórico de ASOs).</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={() => nav("/empresas")} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: WORK.accent }}>Cadastrar empresa</button>
          <button onClick={() => nav("/importacao")} className="px-4 py-2.5 rounded-lg text-sm font-semibold border" style={{ borderColor: WORK.accent, color: WORK.accent }}>Importar planilha</button>
        </div>
      </div>
    </div>
  );

  const cli = r.empresaCliente;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <p className="text-sm" style={{ color: WORK.muted }}>{saudacao} · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: WORK.text }}>{consolidado ? (org?.org?.nome || "Painel de SST") : empresaAtiva?.razao_social}</h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: consolidado ? "rgba(20,108,67,0.10)" : "rgba(11,111,168,0.10)", color: consolidado ? COR.ok : WORK.accent }}>
              {consolidado ? "Visão consolidada · todos os clientes" : "Cliente"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[["/programas", "Novo documento", ClipboardCheck], ["/atestados", "Lançar atestado", Stethoscope], ["/epi", "Entregar EPI", HardHat], ["/assistente-ia", "Perguntar à IA", Sparkles]].map(([to, l, I]) => (
            <Link key={to} to={to} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border" style={{ borderColor: WORK.border, color: WORK.text, background: "#fff" }}><I size={15} style={{ color: WORK.accent }} />{l}</Link>
          ))}
        </div>
      </header>

      <Retomada empresas={d.empresas} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {consolidado ? (
          <>
            <Kpi icone={Building2} rotulo="Clientes" valor={d.empresas.length} detalhe={`${r.ativos.toLocaleString("pt-BR")} colaboradores ativos`} to="/empresas" />
            <Kpi icone={ShieldCheck} rotulo="Clientes em conformidade" valor={`${r.emConformidade}/${d.empresas.length}`} detalhe="PGR, PCMSO, treinamentos, EPI e ações" cor={r.emConformidade === d.empresas.length ? COR.ok : COR.atencao} />
          </>
        ) : (
          <>
            <Kpi icone={Users} rotulo="Colaboradores ativos" valor={r.ativos} detalhe={empresaAtiva?.razao_social} to="/funcionarios" />
            <Kpi icone={ShieldCheck} rotulo="Conformidade" valor={GERAL_TXT[cli?.geral] || "—"} detalhe="PGR, PCMSO, treinamentos, EPI e ações" cor={COR[cli?.geral] || COR.nd} to={`/empresas/${activeCompanyId}`} />
          </>
        )}
        <Kpi icone={AlertTriangle} rotulo="Pendências vencidas" valor={r.vencidos.length} detalhe="exigem ação imediata" cor={r.vencidos.length ? COR.critico : COR.ok} to="/vencimentos" />
        <Kpi icone={CalendarClock} rotulo="Vencem em 30 dias" valor={r.proximos.length} detalhe="programe as renovações" cor={r.proximos.length ? COR.atencao : COR.ok} to="/vencimentos" />
        <Kpi icone={ClipboardCheck} rotulo="Ações atrasadas" valor={r.acoesAtrasadas} detalhe="planos de ação fora do prazo" cor={r.acoesAtrasadas ? COR.critico : COR.ok} to="/inspecoes" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {consolidado ? (
          <section className="xl:col-span-2 rounded-xl border p-4" style={{ background: "#fff", borderColor: WORK.border }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold" style={{ color: WORK.text }}>Conformidade por cliente</h2>
              <Link to="/dossie" className="text-xs inline-flex items-center gap-1" style={{ color: WORK.accent }}><FolderCheck size={13} /> Dossiê da fiscalização</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ color: WORK.text }}>
                <thead><tr className="text-xs text-left" style={{ color: WORK.muted }}><th className="p-2">Cliente</th><th className="p-2">Situação</th><th className="p-2">PGR</th><th className="p-2">PCMSO</th><th className="p-2">Treinamentos</th><th className="p-2">EPI</th><th className="p-2">Ações</th></tr></thead>
                <tbody>
                  {r.clientes.slice(0, 15).map((c) => (
                    <tr key={c.e.id} className="border-t" style={{ borderColor: WORK.border }}>
                      <td className="p-2"><Link to={`/empresas/${c.e.id}`} className="font-medium hover:underline">{c.e.razao_social}</Link><span className="block text-[11px]" style={{ color: WORK.muted }}>{c.vidas} colaboradores</span></td>
                      <td className="p-2"><Etiqueta cor={COR[c.geral]}>{GERAL_TXT[c.geral]}</Etiqueta></td>
                      <td className="p-2 text-xs" style={{ color: COR[c.pgr.k] }}>{c.pgr.txt}</td>
                      <td className="p-2 text-xs" style={{ color: COR[c.pcmso.k] }}>{c.pcmso.txt}</td>
                      <td className="p-2 text-xs" style={{ color: c.treinoOk === null ? COR.nd : c.treinoOk >= 90 ? COR.ok : c.treinoOk >= 70 ? COR.atencao : COR.critico }}>{c.treinoOk === null ? "Sem matriz" : `${c.treinoOk}% em dia`}</td>
                      <td className="p-2 text-xs" style={{ color: c.epiPend ? COR.critico : COR.ok }}>{c.epiPend ? `${c.epiPend} pendente(s)` : "Em dia"}</td>
                      <td className="p-2 text-xs" style={{ color: c.atrasadas ? COR.atencao : COR.ok }}>{c.atrasadas ? `${c.atrasadas} atrasada(s)` : "Em dia"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {r.clientes.length > 15 && <p className="text-xs mt-2" style={{ color: WORK.muted }}>Mostrando os 15 clientes que mais precisam de atenção.</p>}
          </section>
        ) : (
          <section className="xl:col-span-2 rounded-xl border p-4" style={{ background: "#fff", borderColor: WORK.border }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold" style={{ color: WORK.text }}>Situação do cliente</h2>
              <Link to={`/empresas/${activeCompanyId}`} className="text-xs inline-flex items-center gap-1" style={{ color: WORK.accent }}>Abrir cadastro <ArrowRight size={12} /></Link>
            </div>
            {cli ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Stat rotulo="PGR" valor={cli.pgr.txt} cor={COR[cli.pgr.k]} />
                <Stat rotulo="PCMSO" valor={cli.pcmso.txt} cor={COR[cli.pcmso.k]} />
                <Stat rotulo="Treinamentos" valor={cli.treinoOk === null ? "Sem matriz" : `${cli.treinoOk}% em dia`} cor={cli.treinoOk === null ? COR.nd : cli.treinoOk >= 90 ? COR.ok : cli.treinoOk >= 70 ? COR.atencao : COR.critico} />
                <Stat rotulo="EPI pendente" valor={cli.epiPend ? `${cli.epiPend} colaborador(es)` : "Em dia"} cor={cli.epiPend ? COR.critico : COR.ok} />
                <Stat rotulo="Ações atrasadas" valor={cli.atrasadas || 0} cor={cli.atrasadas ? COR.atencao : COR.ok} />
                <Stat rotulo="Colaboradores ativos" valor={r.ativos} cor={WORK.text} />
              </div>
            ) : <Vazio>Sem dados para esta empresa.</Vazio>}
          </section>
        )}

        <div className="space-y-4">
          <section className="rounded-xl border p-4" style={{ background: "#fff", borderColor: WORK.border }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold" style={{ color: WORK.text }}>Pendências críticas</h2>
              <Link to="/vencimentos" className="text-xs inline-flex items-center gap-1" style={{ color: WORK.accent }}>Ver todas <ArrowRight size={12} /></Link>
            </div>
            {r.vencidos.length === 0 && <Vazio>Nenhuma pendência vencida.</Vazio>}
            <div className="space-y-1.5">
              {r.vencidos.slice(0, 8).map((v, i) => (
                <div key={i} className="text-sm rounded-lg p-2" style={{ background: WORK.bg, color: WORK.text }}>
                  {v.descricao}
                  <span className="block text-[11px]" style={{ color: COR.critico }}>{v.empresa ? v.empresa + " · " : ""}{v.sit.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border p-4" style={{ background: "#fff", borderColor: WORK.border }}>
            <h2 className="font-semibold mb-3" style={{ color: WORK.text }}>Documentos emitidos recentemente</h2>
            {r.data.emitidos.length === 0 && <Vazio>Nenhum documento emitido com código de autenticidade.</Vazio>}
            <div className="space-y-1.5">
              {r.data.emitidos.map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-sm rounded-lg p-2" style={{ background: WORK.bg, color: WORK.text }}>
                  <FileCheck2 size={15} className="mt-0.5 shrink-0" style={{ color: a.status === "valido" ? COR.ok : COR.nd }} />
                  <span className="flex-1">{DOCS[a.documento_tipo] || a.documento_nome || a.documento_tipo} · {a.empresa_nome}
                    <span className="block text-[11px]" style={{ color: WORK.muted }}>{a.emitido_em ? new Date(a.emitido_em).toLocaleDateString("pt-BR") : ""} · código {a.codigo}{a.status !== "valido" ? " · substituído" : ""}</span>
                  </span>
                </div>
              ))}
            </div>
            <Link to="/programas" className="mt-3 inline-flex items-center gap-1 text-xs" style={{ color: WORK.accent }}><Plus size={12} /> Novo documento</Link>
          </section>
        </div>
      </div>
      <p className="text-[11px] mt-4" style={{ color: WORK.muted }}>Critério de conformidade: PGR e PCMSO emitidos e vigentes, ao menos 90% dos treinamentos exigidos em dia, nenhum EPI exigido pendente e nenhuma ação atrasada. Atualizado em {dataBR(hojeLocal())}. <Users size={11} className="inline" /> Os dados respeitam as permissões do seu perfil.</p>
    </div>
  );
}