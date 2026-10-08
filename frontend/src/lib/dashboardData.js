// Dashboard de Gestão Estratégica e Financeira — carregamento e cálculos.
import { base44 } from "@/api/base44Client";

const num = (x) => (Number(x) || 0);
const pad = (n) => String(n).padStart(2, "0");
function parseD(s) { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); }
function fmtD(dt) { return dt.toISOString().slice(0, 10); }
function addDays(s, n) { const dt = parseD(s); if (!dt) return s; dt.setUTCDate(dt.getUTCDate() + n); return fmtD(dt); }
function addMonths(s, n) { const dt = parseD(s); if (!dt) return s; dt.setUTCMonth(dt.getUTCMonth() + n); return fmtD(dt); }
export const diffDias = (de, para) => { const a = parseD(de), b = parseD(para); if (!a || !b) return 0; return Math.round((b - a) / 86400000); };
export const hojeStr = () => new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);
export const brl = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const pct = (v) => (Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";

export const PRESETS = [
  { id: "hoje", label: "Hoje" },
  { id: "este_mes", label: "Este mês" },
  { id: "ultimo_mes", label: "Último mês" },
  { id: "trimestre", label: "Trimestre" },
  { id: "ano", label: "Ano" },
  { id: "custom", label: "Customizado" },
];

export function rangePreset(preset, customStart, customEnd) {
  const now = new Date(Date.now() - 4 * 3600 * 1000);
  const y = now.getUTCFullYear(), m = now.getUTCMonth();
  switch (preset) {
    case "hoje": { const s = fmtD(now); return { start: s, end: addDays(s, 1) }; }
    case "este_mes": { const s = `${y}-${pad(m + 1)}-01`; return { start: s, end: addMonths(s, 1) }; }
    case "ultimo_mes": { const s = `${m === 0 ? y - 1 : y}-${pad(m === 0 ? 12 : m)}-01`; return { start: s, end: `${y}-${pad(m + 1)}-01` }; }
    case "trimestre": { const q = Math.floor(m / 3); const s = `${y}-${pad(q * 3 + 1)}-01`; return { start: s, end: addMonths(s, 3) }; }
    case "ano": return { start: `${y}-01-01`, end: `${y + 1}-01-01` };
    case "custom": return { start: customStart || "", end: customEnd ? addDays(customEnd, 1) : (customStart ? addDays(customStart, 1) : "") };
    default: return {};
  }
}

export async function loadAll(filtros) {
  const [catsP, clientsP, providersP] = await Promise.all([
    base44.entities.ServiceCategory.filter({}, { limit: 200 }),
    base44.entities.Client.filter({}, { limit: 1000 }),
    base44.entities.Provider.filter({}, { limit: 1000 }),
  ]);
  const cats = catsP.items || [], clients = clientsP.items || [], providers = providersP.items || [];

  const execQ = {};
  if (filtros.start) execQ.date = { $gte: filtros.start, $lt: filtros.end };
  if (filtros.categoryId) execQ.categoryId = filtros.categoryId;
  if (filtros.providerId) execQ.providerId = filtros.providerId;
  const execs = (await base44.entities.ServiceExecution.filter(execQ, { limit: 5000, sort: "-date" })).items || [];

  // Transações: carrega todas (caixa/aging consideram todo o saldo em aberto)
  const txQ = {};
  if (filtros.categoryId) txQ.categoryId = filtros.categoryId;
  const txs = (await base44.entities.FinancialTransaction.filter(txQ, { limit: 5000, sort: "-dueDate" })).items || [];

  return { cats, clients, providers, execs, txs };
}

export function kpis(execs) {
  const completed = execs.filter((e) => e.status === "COMPLETED");
  const revenue = completed.reduce((s, e) => s + num(e.salePrice), 0);
  const cost = completed.reduce((s, e) => s + num(e.costPrice), 0);
  const margin = revenue - cost;
  const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;
  const avgTicket = completed.length ? revenue / completed.length : 0;
  const noShow = execs.filter((e) => e.status === "NO_SHOW").length;
  const base = execs.filter((e) => ["SCHEDULED", "COMPLETED", "NO_SHOW"].includes(e.status)).length;
  const noShowRate = base ? (noShow / base) * 100 : 0;
  return { revenue, cost, margin, marginPct, avgTicket, noShowRate, totalExecucoes: completed.length };
}

export function ticketPorCategoria(execs, cats) {
  const map = {};
  execs.filter((e) => e.status === "COMPLETED").forEach((e) => { if (!e.categoryId) return; map[e.categoryId] = map[e.categoryId] || { sum: 0, count: 0 }; map[e.categoryId].sum += num(e.salePrice); map[e.categoryId].count++; });
  return cats.map((c) => ({ id: c.id, name: c.name, ticket: map[c.id]?.count ? map[c.id].sum / map[c.id].count : 0, sum: map[c.id]?.sum || 0, count: map[c.id]?.count || 0 }));
}

export function rentabilidadePorCategoria(execs, cats) {
  const map = {};
  execs.filter((e) => e.status === "COMPLETED").forEach((e) => { const cid = e.categoryId || "_"; map[cid] = map[cid] || { receita: 0, custo: 0 }; map[cid].receita += num(e.salePrice); map[cid].custo += num(e.costPrice); });
  return cats.map((c) => ({ name: c.name, receita: map[c.id]?.receita || 0, custo: map[c.id]?.custo || 0, margem: (map[c.id]?.receita || 0) - (map[c.id]?.custo || 0) }));
}

export function rankingPrestadores(execs, providers, txs) {
  const map = {};
  execs.filter((e) => e.status === "COMPLETED" && e.providerId).forEach((e) => { const p = e.providerId; map[p] = map[p] || { volume: 0, custo: 0, receita: 0 }; map[p].volume++; map[p].custo += num(e.costPrice); map[p].receita += num(e.salePrice); });
  const prazo = {};
  txs.filter((t) => t.type === "PAYABLE" && t.status === "PAID" && t.providerId && t.paymentDate && t.dueDate).forEach((t) => { const p = t.providerId; prazo[p] = prazo[p] || { soma: 0, count: 0 }; prazo[p].soma += diffDias(t.dueDate, t.paymentDate); prazo[p].count++; });
  return providers.map((p) => {
    const m = map[p.id] || { volume: 0, custo: 0, receita: 0 };
    const pr = prazo[p.id];
    return { id: p.id, name: p.name, serviceType: p.serviceType, volume: m.volume, custo: m.custo, margem: m.receita - m.custo, prazoMedio: pr && pr.count ? pr.soma / pr.count : (p.defaultPaymentTermDays || 0) };
  }).filter((r) => r.volume > 0).sort((a, b) => b.custo - a.custo);
}

export function caixa(txs) {
  const h = hojeStr();
  const receivables = txs.filter((t) => t.type === "RECEIVABLE" && ["PENDING", "OVERDUE"].includes(t.status));
  const aging = { emDia: 0, a30: 0, a60: 0, mais60: 0 };
  receivables.forEach((t) => { const due = t.dueDate; if (!due) return; const v = num(t.amount); const atraso = diffDias(due, h); if (atraso <= 0) aging.emDia += v; else if (atraso <= 30) aging.a30 += v; else if (atraso <= 60) aging.a60 += v; else aging.mais60 += v; });
  const totalReceber = receivables.reduce((s, t) => s + num(t.amount), 0);
  const payablesPend = txs.filter((t) => t.type === "PAYABLE" && ["PENDING", "OVERDUE"].includes(t.status));
  const totalPagar = payablesPend.reduce((s, t) => s + num(t.amount), 0);
  const media = (arr) => arr.length ? arr.reduce((s, t) => s + diffDias(t.dueDate, t.paymentDate), 0) / arr.length : 0;
  const dso = media(txs.filter((t) => t.type === "RECEIVABLE" && t.status === "PAID" && t.paymentDate && t.dueDate));
  const dpo = media(txs.filter((t) => t.type === "PAYABLE" && t.status === "PAID" && t.paymentDate && t.dueDate));
  return { aging, totalReceber, totalPagar, dso, dpo };
}

export function carteira(execs, clients) {
  const map = {}; let total = 0;
  execs.filter((e) => e.status === "COMPLETED" && e.clientId).forEach((e) => { map[e.clientId] = (map[e.clientId] || 0) + num(e.salePrice); total += num(e.salePrice); });
  const arr = Object.entries(map).map(([id, receita]) => ({ id, name: clients.find((c) => c.id === id)?.name || "—", receita, pct: total ? (receita / total) * 100 : 0 })).sort((a, b) => b.receita - a.receita);
  return { top5: arr.slice(0, 5), total, alertas: arr.filter((c) => c.pct > 25) };
}

export const TIPO_SERVICO = { laboratorio: "Laboratório", radiologia: "Radiologia", medico: "Médico", consultoria: "Consultoria", palestras: "Palestras", outro: "Outro" };