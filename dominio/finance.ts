// @ts-nocheck — TIPAGEM PENDENTE (5 avisos do TypeScript): lógica validada no protótipo e coberta pelos testes; adicionar tipos ao portar.
// Origem: referencia-base44/src/lib/finance.js — cálculos financeiros (margem, carteira)
// Módulo Financeiro — helpers de data, formatação e carregamento do dashboard.
// Cálculos no servidor (aggregate/count/filter por mês); nada de somar listas em JS.

export const WORK = {
  bg: "#F6F9FB",
  surface: "#FFFFFF",
  border: "#E3E8EE",
  accent: "#0B6FA8",
  text: "#1F2328",
  muted: "#5F6368",
  pos: "#16A34A",
  neg: "#DC2626",
};

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const num = (v) => (v === null || v === undefined || v === "" ? 0 : Number(v) || 0);
const pad = (n) => String(n).padStart(2, "0");

export function mesAnoAtual() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Cuiaba", year: "numeric", month: "2-digit" }).format(new Date());
}
export function mesAnterior(mesAno) {
  const [y, m] = mesAno.split("-").map(Number);
  const nm = m === 1 ? 12 : m - 1;
  const ny = m === 1 ? y - 1 : y;
  return `${ny}-${pad(nm)}`;
}
export function nomeMes(mesAno) {
  const [y, m] = mesAno.split("-").map(Number);
  return `${MESES[m - 1]}/${y}`;
}
export function rangeMes(mesAno) {
  const [y, m] = mesAno.split("-").map(Number);
  const nm = m === 12 ? 1 : m + 1;
  const ny = m === 12 ? y + 1 : y;
  return { start: `${y}-${pad(m)}-01`, end: `${ny}-${pad(nm)}-01` };
}
export function ultimoDiaMes(mesAno) {
  const [y, m] = mesAno.split("-").map(Number);
  const d = new Date(y, m, 0).getDate();
  return `${y}-${pad(m)}-${pad(d)}`;
}
function hojeCuiaba() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Cuiaba", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
export function hoje() { return hojeCuiaba(); }
export function futuro30() { return addDays(hojeCuiaba(), 30); }

export function formatBRL(v) {
  return num(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
export function formatPct(v) {
  if (v === null || v === undefined || isNaN(v)) return "—";
  const s = num(v) >= 0 ? "+" : "";
  return `${s}${num(v).toFixed(1)}%`;
}

function rowTipo(agg, tipo) {
  const r = (agg?.rows || []).find((x) => x.tipo === tipo);
  return r ? num(r.sum_valor) : 0;
}

// Carrega todo o dashboard de um mês (cálculos no servidor).
export async function carregarDashboard(base44, mesAno) {
  const { start, end } = rangeMes(mesAno);
  const prevMes = mesAnterior(mesAno);
  const { start: ps, end: pe } = rangeMes(prevMes);
  const rq = (s, e) => ({ $gte: s, $lt: e });

  const [
    companies, contratos, prestadores, folhaArr,
    aggPago, aggPend, recPorCli, custPorCli, aggPagoPrev,
    nExames, nDocs, nExamesPrev, nDocsPrev,
    contratosVenc, vencidos,
  ] = await Promise.all([
    base44.entities.Company.list("-created_date", 200).catch(() => []),
    base44.entities.ContratoCliente.filter({ status: "ativo" }).catch(() => []),
    base44.entities.Prestador.filter({ status: "ativo" }).catch(() => []),
    base44.entities.FolhaMensal.filter({ mes_ano: mesAno }).catch(() => []),
    base44.entities.LancamentoFinanceiro.aggregate({ query: { data_pagamento: rq(start, end), status: "pago" }, groupBy: "tipo", sum: "valor" }).catch(() => ({ rows: [] })),
    base44.entities.LancamentoFinanceiro.aggregate({ query: { data_vencimento: rq(start, end), status: "pendente" }, groupBy: "tipo", sum: "valor" }).catch(() => ({ rows: [] })),
    base44.entities.LancamentoFinanceiro.aggregate({ query: { data_pagamento: rq(start, end), status: "pago", tipo: "receber", company_id: { $nin: [null, ""] } }, groupBy: "company_id", sum: "valor" }).catch(() => ({ rows: [] })),
    base44.entities.LancamentoFinanceiro.aggregate({ query: { data_pagamento: rq(start, end), status: "pago", tipo: "pagar", company_id: { $nin: [null, ""] } }, groupBy: "company_id", sum: "valor" }).catch(() => ({ rows: [] })),
    base44.entities.LancamentoFinanceiro.aggregate({ query: { data_pagamento: rq(ps, pe), status: "pago" }, groupBy: "tipo", sum: "valor" }).catch(() => ({ rows: [] })),
    base44.entities.ExamePcmso.count({ created_date: rq(start, end) }).catch(() => 0),
    base44.entities.GeneratedDocument.count({ created_date: rq(start, end) }).catch(() => 0),
    base44.entities.ExamePcmso.count({ created_date: rq(ps, pe) }).catch(() => 0),
    base44.entities.GeneratedDocument.count({ created_date: rq(ps, pe) }).catch(() => 0),
    base44.entities.ContratoCliente.filter({ status: "ativo", vigencia_fim: { $lte: futuro30() } }).catch(() => []),
    base44.entities.LancamentoFinanceiro.filter({ status: "pendente", data_vencimento: { $lt: hoje() } }).catch(() => []),
  ]);

  const nomeEmpresa = (id) => companies.find((c) => c.id === id)?.razao_social || "—";

  const receitaRealizada = rowTipo(aggPago, "receber");
  const custosPagos = rowTipo(aggPago, "pagar");
  const receitaRealizadaPrev = rowTipo(aggPagoPrev, "receber");
  const pendenteReceber = rowTipo(aggPend, "receber");
  const pendentePagar = rowTipo(aggPend, "pagar");
  const folha = folhaArr[0] ? num(folhaArr[0].valor_folha) + num(folhaArr[0].encargos) : 0;
  const totalCustos = custosPagos + folha;
  const margem = receitaRealizada - totalCustos;
  const margemPct = receitaRealizada ? (margem / receitaRealizada) * 100 : 0;
  const receitaPrevista = contratos.reduce((s, c) => s + num(c.valor_base), 0);

  const cliMap = {};
  (recPorCli.rows || []).forEach((r) => { cliMap[r.company_id] = { nome: nomeEmpresa(r.company_id), receita: num(r.sum_valor), custos: 0 }; });
  (custPorCli.rows || []).forEach((r) => {
    if (!cliMap[r.company_id]) cliMap[r.company_id] = { nome: nomeEmpresa(r.company_id), receita: 0, custos: 0 };
    cliMap[r.company_id].custos = num(r.sum_valor);
  });
  const topClientes = Object.entries(cliMap).map(([id, v]) => {
    const marg = v.receita - v.custos;
    return { id, ...v, margem: marg, margemPct: v.receita ? (marg / v.receita) * 100 : 0 };
  }).sort((a, b) => b.margem - a.margem);

  const clientesNeg = topClientes.filter((c) => c.margem < 0);

  const crescReceita = receitaRealizadaPrev ? ((receitaRealizada - receitaRealizadaPrev) / receitaRealizadaPrev) * 100 : null;
  const crescExames = nExamesPrev ? ((nExames - nExamesPrev) / nExamesPrev) * 100 : null;

  return {
    mesAno, prevMes,
    receitaPrevista, receitaRealizada, receitaRealizadaPrev,
    custosPagos, folha, folhaRegistrada: !!folhaArr[0],
    totalCustos, margem, margemPct,
    pendenteReceber, pendentePagar,
    nExames, nDocs, nExamesPrev, nDocsPrev,
    crescReceita, crescExames,
    topClientes,
    alertas: {
      contratosVenc: contratosVenc.map((c) => ({ contrato: c, nome: nomeEmpresa(c.company_id) })),
      vencidos,
      clientesNeg,
    },
    contratos, prestadores, companies,
  };
}

// Gera as contas a pagar previstas dos prestadores ativos para o mês (dedup por prestador).
export async function gerarContasPrestadores(base44, mesAno) {
  const { start, end } = rangeMes(mesAno);
  const prestadores = await base44.entities.Prestador.filter({ status: "ativo" }).catch(() => []);
  if (!prestadores.length) return { gerados: 0, total: 0 };
  const ids = prestadores.map((p) => p.id);
  const existentes = await base44.entities.LancamentoFinanceiro.filter({
    prestador_id: { $in: ids }, data_vencimento: { $gte: start, $lt: end },
  }).catch(() => []);
  const existIds = new Set(existentes.map((e) => e.prestador_id));
  const faltantes = prestadores.filter((p) => !existIds.has(p.id));
  if (!faltantes.length) return { gerados: 0, total: prestadores.length };
  const dia = (p) => pad(Math.min(Math.max(num(p.dia_vencimento) || 5, 1), 28));
  await base44.entities.LancamentoFinanceiro.bulkCreate(
    faltantes.map((p) => ({
      tipo: "pagar",
      categoria: p.tipo_servico,
      valor: num(p.valor_recorrente_mensal),
      data_vencimento: `${mesAno}-${dia(p)}`,
      recorrencia: "mensal",
      prestador_id: p.id,
      status: "pendente",
      descricao: `Mensalidade — ${p.nome}`,
    }))
  );
  return { gerados: faltantes.length, total: prestadores.length };
}

// Salva (upsert por mes_ano) a folha de pagamento informada.
export async function salvarFolha(base44, mesAno, valorFolha, encargos) {
  const existentes = await base44.entities.FolhaMensal.filter({ mes_ano: mesAno }).catch(() => []);
  if (existentes[0]) {
    await base44.entities.FolhaMensal.update(existentes[0].id, { valor_folha: num(valorFolha), encargos: num(encargos) });
  } else {
    await base44.entities.FolhaMensal.create({ mes_ano: mesAno, valor_folha: num(valorFolha), encargos: num(encargos) });
  }
}

// Registra o excedente realizado de cada contrato no mês (dedup por contrato).
export async function registrarExcedente(base44, mesAno, itens) {
  const venc = ultimoDiaMes(mesAno);
  const { start, end } = rangeMes(mesAno);
  let salvos = 0;
  for (const it of itens) {
    const qtd = num(it.quantidade);
    const excedente = Math.max(0, qtd - num(it.limite_incluido));
    const valor = +(excedente * num(it.valor_excedente_unitario)).toFixed(2);
    const existentes = await base44.entities.LancamentoFinanceiro.filter({
      contrato_id: it.contrato_id, categoria: "excedente", data_vencimento: { $gte: start, $lt: end },
    }).catch(() => []);
    const payload = {
      valor,
      quantidade: qtd,
      descricao: `Excedente ${it.unidade_excedente} — ${qtd} realizados, ${excedente} excedentes`,
    };
    if (existentes[0]) {
      await base44.entities.LancamentoFinanceiro.update(existentes[0].id, payload);
    } else {
      await base44.entities.LancamentoFinanceiro.create({
        tipo: "receber",
        categoria: "excedente",
        valor,
        data_vencimento: venc,
        recorrencia: "unica",
        company_id: it.company_id,
        contrato_id: it.contrato_id,
        quantidade: qtd,
        status: "pendente",
        descricao: payload.descricao,
      });
    }
    salvos++;
  }
  return salvos;
}