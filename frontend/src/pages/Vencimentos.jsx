import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Mail, RefreshCw, Loader2 } from "lucide-react";
import { WORK } from "@/lib/sst";
import { situacao, hojeLocal, addDias, dataBR } from "@/lib/sstGestao";
import { analisarAtestados } from "@/lib/afastamentos";
import { situacaoTreinamentos } from "@/pages/Treinamentos";
import { situacaoEpiColaborador } from "@/pages/Epi";
import { statusCalibracao } from "@/components/programas/Medicoes";
import { Botao, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";
import { useEmpresa, SeletorEmpresa, Cabecalho, Indicador } from "@/components/sst/useEmpresa";

const CATEGORIAS = {
  treinamento: ["Treinamentos", "/treinamentos"], epi: ["EPI", "/epi"], documento: ["Programas e laudos", "/programas"], calibracao: ["Calibração", "/programas?aba=medicoes"],
  terceiro: ["Terceiros", "/terceiros"], cipa: ["CIPA", "/cipa"], acao: ["Planos de ação", "/inspecoes"], esocial: ["eSocial S-2230", "/atestados"], vacina: ["Vacinas", "/empresas"],
};
const DOCS = { pgr: "PGR", pcmso: "PCMSO", ltcat: "LTCAT", insalubridade: "Laudo de insalubridade", periculosidade: "Laudo de periculosidade" };

async function listar(entidade, filtro) {
  try { return filtro ? await base44.entities[entidade].filter(filtro, undefined, 5000) : await base44.entities[entidade].list(undefined, 5000); } catch { return []; }
}

export function montarVencimentos(x, hoje = hojeLocal()) {
  const empNome = Object.fromEntries(x.empresas.map((e) => [e.id, e.razao_social]));
  const out = [];
  const add = (cat, company_id, descricao, data, extra = {}) => out.push({ cat, company_id, empresa: empNome[company_id] || "", descricao, data, sit: extra.sit || situacao(data, 30, hoje), ...extra });

  // Treinamentos (matriz por cargo)
  for (const cid of new Set(x.trabalhadores.map((t) => t.company_id))) {
    const trab = x.trabalhadores.filter((t) => t.company_id === cid && t.status !== "inativo");
    situacaoTreinamentos(trab, x.matriz.filter((m) => m.company_id === cid), x.treinamentos.filter((r) => r.company_id === cid), hoje).forEach((s) =>
      s.itens.forEach((i) => {
        if (i.sit.k === "pendente") add("treinamento", cid, `${s.t.nome} — ${i.m.nr} ${i.m.titulo || ""} (não realizado)`, null, { sit: { k: "vencido", label: "Pendente", cor: "#B42318" } });
        else if (i.validade) add("treinamento", cid, `${s.t.nome} — ${i.m.nr} ${i.m.titulo || ""}`, i.validade);
      }));
    // EPI por colaborador
    const riscos = x.riscos.filter((r) => r.company_id === cid);
    const entregas = x.entregas.filter((e) => e.company_id === cid);
    trab.forEach((t) => {
      const s = situacaoEpiColaborador(t, riscos, entregas);
      s.pendentes.forEach((p) => add("epi", cid, `${t.nome} — ${p.nome} exigido no PGR e não entregue`, null, { sit: { k: "vencido", label: "Pendente", cor: "#B42318" } }));
      s.trocas.forEach((e) => add("epi", cid, `${t.nome} — troca de ${e.epi_nome}`, e.proxima_troca));
    });
  }
  x.itensEpi.filter((i) => i.ativo !== false).forEach((i) => {
    if (i.validade_ca) add("epi", i.company_id, `CA ${i.ca || "?"} — ${i.nome}`, i.validade_ca);
    if (Number(i.estoque_minimo) > 0 && Number(i.estoque_atual || 0) <= Number(i.estoque_minimo)) add("epi", i.company_id, `Estoque no mínimo — ${i.nome} (${i.estoque_atual || 0} ${i.unidade || ""})`, null, { sit: { k: "vence", label: "Repor estoque", cor: "#8A5A00" } });
  });
  x.programas.forEach((p) => p.vigencia_ate && add("documento", p.company_id, `${DOCS[p.tipo] || p.tipo} — revisão/vigência`, p.vigencia_ate, { sit: situacao(p.vigencia_ate, 60, hoje) }));
  x.equipamentos.forEach((e) => {
    const s = statusCalibracao(e);
    add("calibracao", "", `${e.modelo} nº ${e.numero_serie || "—"}`, e.validade_calibracao, { sit: e.validade_calibracao ? situacao(e.validade_calibracao, 30, hoje) : { k: "vencido", label: s.label, cor: "#B42318" } });
  });
  x.docsTerceiros.forEach((dt) => dt.data_validade && add("terceiro", dt.company_id, `${x.terceirasNome[dt.terceira_id] || "Terceiro"} — ${dt.nome || dt.tipo}`, dt.data_validade));
  x.terceiras.forEach((t) => t.contrato_fim && t.status !== "inativa" && add("terceiro", t.company_id, `Contrato — ${t.razao_social}`, t.contrato_fim));
  x.mandatos.filter((m) => m.status !== "encerrado").forEach((m) => {
    add("cipa", m.company_id, "Fim do mandato da CIPA", m.fim, { sit: situacao(m.fim, 90, hoje) });
    if (m.eleicao?.edital) add("cipa", m.company_id, "Publicação do edital da eleição da CIPA", m.eleicao.edital);
  });
  x.reunioes.filter((r) => r.status === "agendada").forEach((r) => add("cipa", r.company_id, `Reunião ${r.tipo === "extraordinaria" ? "extraordinária" : "ordinária"} da CIPA`, r.data, { sit: situacao(r.data, 7, hoje) }));
  x.acoes.filter((a) => a.status !== "concluida").forEach((a) => add("acao", a.company_id, a.descricao, a.prazo));
  for (const cid of new Set(x.atestados.map((a) => a.company_id))) {
    const lista = x.atestados.filter((a) => a.company_id === cid);
    const an = analisarAtestados(lista, hoje);
    lista.forEach((a) => { const r = an[a.id]; if (r?.obrigatorio && a.esocial_status !== "enviado") add("esocial", cid, `S-2230 — ${a.trabalhador_nome} (início ${dataBR(a.data_inicio)})`, r.prazo, { sit: situacao(r.prazo, 3, hoje) }); });
  }
  x.vacinas.forEach((v) => v.proxima_dose && add("vacina", v.company_id, `${v.trabalhador_nome} — ${v.vacina} (próxima dose)`, v.proxima_dose));
  const ordem = { vencido: 0, vence: 1, sem: 2, ok: 3 };
  return out.sort((a, b) => ordem[a.sit.k] - ordem[b.sit.k] || (a.data || "").localeCompare(b.data || ""));
}

export default function Vencimentos() {
  const { user } = useAuth();
  const { empresas, empresaId, setEmpresaId } = useEmpresa({ permitirTodas: true });
  const [x, setX] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [janela, setJanela] = useState("30");
  const [cat, setCat] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const f = empresaId ? { company_id: empresaId } : null;
    const [trabalhadores, matriz, treinamentos, riscos, entregas, itensEpi, programas, equipamentos, docsTerceiros, terceiras, mandatos, reunioes, acoes, atestados, vacinas] = await Promise.all(
      ["Trabalhador", "MatrizTreinamento", "Treinamento", "Risco", "EntregaEpi", "EpiItem", "ProgramaSST", "Equipamento", "DocumentoTerceiro", "Terceira", "MandatoCipa", "ReuniaoCipa", "PlanoAcao", "Atestado", "Vacina"]
        .map((e) => listar(e, e === "Equipamento" ? null : f)));
    setX({ empresas, trabalhadores, matriz, treinamentos, riscos, entregas, itensEpi, programas, equipamentos, docsTerceiros, terceiras, terceirasNome: Object.fromEntries(terceiras.map((t) => [t.id, t.razao_social])), mandatos, reunioes, acoes, atestados, vacinas });
    setCarregando(false);
  }, [empresaId, empresas]);
  useEffect(() => { if (empresas.length) carregar(); }, [carregar, empresas.length]);

  const todos = useMemo(() => (x ? montarVencimentos(x) : []), [x]);
  const limite = addDias(hojeLocal(), Number(janela));
  const lista = todos.filter((v) => (!cat || v.cat === cat) && (v.sit.k === "vencido" || v.sit.k === "vence" || (v.data && v.data <= limite)));
  const vencidos = todos.filter((v) => v.sit.k === "vencido");
  const proximos = todos.filter((v) => v.sit.k !== "vencido" && v.data && v.data <= limite);

  const enviarEmail = async () => {
    if (!user?.email) return;
    setEnviando(true);
    try {
      const linhas = (arr) => arr.slice(0, 60).map((v) => `• [${CATEGORIAS[v.cat][0]}] ${v.empresa ? v.empresa + " — " : ""}${v.descricao}: ${v.sit.label}${v.data ? ` (${dataBR(v.data)})` : ""}`).join("\n");
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `SmartSeg — ${vencidos.length} vencido(s) e ${proximos.length} a vencer em ${janela} dias`,
        body: `Resumo de vencimentos em ${dataBR(hojeLocal())}${empresaId ? ` — ${empresas.find((e) => e.id === empresaId)?.razao_social}` : " — todas as empresas"}.\n\nVENCIDOS / PENDENTES (${vencidos.length}):\n${linhas(vencidos) || "nenhum"}\n\nA VENCER EM ${janela} DIAS (${proximos.length}):\n${linhas(proximos) || "nenhum"}\n\nAcesse o painel de vencimentos no SmartSeg para detalhes.`,
      });
      alert(`Resumo enviado para ${user.email}.`);
    } catch (e) { alert("Não foi possível enviar: " + (e?.message || "")); } finally { setEnviando(false); }
  };

  const porCat = Object.keys(CATEGORIAS).map((k) => [k, todos.filter((v) => v.cat === k && (v.sit.k === "vencido" || (v.data && v.data <= limite))).length]).filter(([, n]) => n);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Cabecalho titulo="Painel de vencimentos" subtitulo="Tudo o que vence ou está pendente, em um só lugar: treinamentos, EPI e CA, documentos, calibrações, terceiros, CIPA, planos de ação, S-2230 e vacinas.">
        <SeletorEmpresa empresas={empresas} empresaId={empresaId} setEmpresaId={setEmpresaId} permitirTodas />
        <select value={janela} onChange={(e) => setJanela(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: WORK.border }}>
          <option value="30">Próximos 30 dias</option><option value="60">Próximos 60 dias</option><option value="90">Próximos 90 dias</option>
        </select>
        <Botao onClick={carregar}>{carregando ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Atualizar</Botao>
        <Botao tipo="primario" onClick={enviarEmail} carregando={enviando} disabled={!x}><Mail size={14} /> Enviar resumo por e-mail</Botao>
      </Cabecalho>

      {!x ? <Cartao><Vazio>Carregando…</Vazio></Cartao> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <Indicador rotulo="Vencidos / pendentes" valor={vencidos.length} cor={vencidos.length ? "#B42318" : "#146C43"} />
            <Indicador rotulo={`A vencer em ${janela} dias`} valor={proximos.length} cor={proximos.length ? "#8A5A00" : "#146C43"} />
            <Indicador rotulo="Itens monitorados" valor={todos.length} />
            <Indicador rotulo="Empresas" valor={empresaId ? 1 : empresas.length} />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button onClick={() => setCat("")} className="px-2.5 py-1 rounded-full text-xs border" style={{ borderColor: !cat ? WORK.accent : WORK.border, color: !cat ? WORK.accent : WORK.muted }}>Todas</button>
            {porCat.map(([k, n]) => (
              <button key={k} onClick={() => setCat(k)} className="px-2.5 py-1 rounded-full text-xs border" style={{ borderColor: cat === k ? WORK.accent : WORK.border, color: cat === k ? WORK.accent : WORK.muted }}>{CATEGORIAS[k][0]} ({n})</button>
          ))}
          </div>
          <Cartao>
            {lista.length === 0 && <Vazio>Nada vencido ou a vencer nesse período. </Vazio>}
            <div className="space-y-1.5">
              {lista.map((v, i) => (
                <Link key={i} to={CATEGORIAS[v.cat][1]} onClick={() => v.company_id && setEmpresaId(v.company_id)} className="flex flex-wrap items-center gap-2 rounded-lg p-2.5 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
                  <Etiqueta cor={WORK.accent}>{CATEGORIAS[v.cat][0]}</Etiqueta>
                  <span className="flex-1 min-w-[200px]">{v.descricao}{!empresaId && v.empresa && <span className="block text-xs" style={{ color: WORK.muted }}>{v.empresa}</span>}</span>
                  {v.data && <span className="text-xs" style={{ color: WORK.muted }}>{dataBR(v.data)}</span>}
                  <Etiqueta cor={v.sit.cor}>{v.sit.label}</Etiqueta>
                </Link>
            ))}
            </div>
          </Cartao>
          <p className="text-[11px] mt-3" style={{ color: WORK.muted }}>ASOs e exames periódicos entram no painel quando o registro de exames realizados for implantado.</p>
        </>
    )}
    </div>
);
}