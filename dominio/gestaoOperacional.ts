// @ts-nocheck — TIPAGEM PENDENTE (8 avisos do TypeScript): lógica validada no protótipo e coberta pelos testes; adicionar tipos ao portar.
// Regras operacionais que no protótipo estavam dentro das telas (vencimentos, treinamentos, EPI, calibração, inspeções, importação)
import { situacao, hojeLocal, addDias, dataBR, addMeses } from "./sstGestao";
import { analisarAtestados } from "./afastamentos";

const nrKey = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^NR0?/, "NR");

export function situacaoTreinamentos(trabalhadores, matriz, registros, hoje = hojeLocal()) {
  return trabalhadores.map((t) => {
    const exig = matriz.filter((m) => m.cargo_id === t.cargo_id && m.obrigatorio !== false);
    const itens = exig.map((m) => {
      const regs = registros.filter((r) => r.trabalhador_id === t.id && nrKey(r.nr) === nrKey(m.nr)).sort((a, b) => (b.data_realizacao || "").localeCompare(a.data_realizacao || ""));
      const ult = regs[0];
      if (!ult) return { m, ult: null, sit: { k: "pendente", label: "Não realizado", cor: "#B42318" } };
      const validade = ult.validade || (Number(m.reciclagem_meses) > 0 ? addMeses(ult.data_realizacao, m.reciclagem_meses) : null);
      const sit = validade ? situacao(validade, 30, hoje) : { k: "ok", label: `Realizado em ${dataBR(ult.data_realizacao)}`, cor: "#146C43" };
      return { m, ult, validade, sit };
    });
    return { t, itens, pend: itens.filter((i) => i.sit.k === "pendente" || i.sit.k === "vencido").length, vence: itens.filter((i) => i.sit.k === "vence").length };
  });
}
const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const soNum = (s) => String(s || "").replace(/\D/g, "");

export function situacaoEpiColaborador(t, riscos, entregas) {
  const exigidos = [];
  riscos.filter((r) => (r.cargo_ids || []).includes(t.cargo_id)).forEach((r) =>
    (r.epi || []).forEach((e) => { if (e?.nome && !exigidos.some((x) => norm(x.nome) === norm(e.nome))) exigidos.push({ nome: e.nome, ca: e.ca }); }));
  const minhas = entregas.filter((e) => e.trabalhador_id === t.id && !e.devolvido_em);
  const atende = (x) => minhas.some((e) => (soNum(x.ca) && soNum(e.ca) === soNum(x.ca)) || norm(e.epi_nome) === norm(x.nome) || norm(e.epi_nome).includes(norm(x.nome)) || norm(x.nome).includes(norm(e.epi_nome)));
  const pendentes = exigidos.filter((x) => !atende(x));
  // última entrega de cada EPI define a próxima troca
  const ultimas = {};
  minhas.forEach((e) => { const k = e.epi_id || norm(e.epi_nome); if (!ultimas[k] || e.data_entrega > ultimas[k].data_entrega) ultimas[k] = e; });
  const trocas = Object.values(ultimas).filter((e) => e.proxima_troca).map((e) => ({ ...e, sit: situacao(e.proxima_troca, 15) }));
  return { exigidos, pendentes, trocas, entregas: minhas };
}
export function statusCalibracao(eq, naData) {
  if (!eq?.validade_calibracao) return { label: "Sem calibração", cor: "#EF4444", ok: false };
  const ref = naData || hoje();
  if (eq.validade_calibracao < ref) return { label: `Vencida em ${dataBR(eq.validade_calibracao)}`, cor: "#EF4444", ok: false };
  const dias = (new Date(eq.validade_calibracao) - new Date(ref)) / 86400000;
  if (dias <= 30) return { label: `Vence em ${Math.ceil(dias)} dia(s)`, cor: "#EAB308", ok: true };
  return { label: `Válida até ${dataBR(eq.validade_calibracao)}`, cor: "#22C55E", ok: true };
}
const DOCS = { pgr: "PGR", pcmso: "PCMSO", ltcat: "LTCAT", insalubridade: "Laudo de insalubridade", periculosidade: "Laudo de periculosidade" };

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
export const conformidade = (resps) => {
  const c = resps.filter((r) => r.resposta === "conforme").length;
  const n = resps.filter((r) => r.resposta === "nao_conforme").length;
  return c + n ? Math.round((c / (c + n)) * 100) : null;
};

export function cpfValido(cpf) {
  const d = String(cpf || "").replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n) => { let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}
export function data(v) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) { const a = m[3].length === 2 ? (Number(m[3]) > 40 ? "19" : "20") + m[3] : m[3]; return `${a}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; }
  if (/^\d{4,6}$/.test(s)) { const d = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86400000); return d.toISOString().slice(0, 10); }
  return null;
}
export const formatarCpf = (c) => String(c || "").replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
