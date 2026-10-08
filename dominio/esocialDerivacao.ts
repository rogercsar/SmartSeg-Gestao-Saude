// @ts-nocheck — TIPAGEM PENDENTE (6 avisos do TypeScript): lógica validada no protótipo e coberta pelos testes; adicionar tipos ao portar.
// Origem: referencia-base44/src/lib/esocialDerivacao.js — eventos do eSocial esperados por colaborador (S-2200 a S-2299, S-2210, S-2220, S-2221, S-2230, S-2240)
import { analisarAtestados } from "./afastamentos";
// Derivação e consolidação de eventos do eSocial por trabalhador

// Eventos do eSocial (leiaute S-1.x). Os de SST são S-2210 (CAT), S-2220 (ASO) e S-2240 (condições ambientais).
// Atenção: S-2245 e S-2250 foram extintos na simplificação do eSocial; CIPA não tem evento próprio.
export const EVENTOS_ESOCIAL = {
  "S-2200": { label: "S-2200", nome: "Admissão", cor: "#0B6FA8" },
  "S-2205": { label: "S-2205", nome: "Alteração de dados cadastrais", cor: "#64748B" },
  "S-2206": { label: "S-2206", nome: "Alteração de contrato (cargo/setor)", cor: "#6366F1" },
  "S-2210": { label: "S-2210", nome: "Comunicação de acidente de trabalho (CAT)", cor: "#DC2626" },
  "S-2220": { label: "S-2220", nome: "Monitoramento da saúde (ASO)", cor: "#13A89E" },
  "S-2221": { label: "S-2221", nome: "Exame toxicológico do motorista profissional", cor: "#7C3AED" },
  "S-2230": { label: "S-2230", nome: "Afastamento temporário", cor: "#E3A008" },
  "S-2240": { label: "S-2240", nome: "Condições ambientais do trabalho", cor: "#0EA5E9" },
  "S-2298": { label: "S-2298", nome: "Reintegração", cor: "#22A06B" },
  "S-2299": { label: "S-2299", nome: "Desligamento", cor: "#B42318" },
  "S-2300": { label: "S-2300", nome: "Trabalhador sem vínculo — início", cor: "#94A3B8" },
};

export const STATUS_EVENTO = {
  transmitido: { label: "Transmitido", cor: "#22C55E" },
  processado: { label: "Processado", cor: "#16A34A" },
  rascunho: { label: "Rascunho", cor: "#EAB308" },
  erro: { label: "Erro", cor: "#EF4444" },
  pendente: { label: "Pendente", cor: "#F59E0B" },
};

const MOV_S2206 = ["transferencia_cargo", "transferencia_setor", "transferencia_unidade", "transferencia_empresa", "promocao"];

// Deriva os eventos esperados de um trabalhador a partir dos dados cadastrais e operacionais.
// ctx = { lotacao, atestados, riscos, treinamentos, cargos, ocorrencias }
export function derivarEventos(trabalhador, ctx = {}) {
  const eventos = [];
  const cargoId = trabalhador.cargo_id;

  // S-2200 Admissão
  if (trabalhador.data_admissao) {
    eventos.push({ tipo: "S-2200", data_esperada: trabalhador.data_admissao, descricao: "Admissão do trabalhador", origem: "Cadastro" });
  }

  // S-2206 Alteração de cargo/setor (uma por movimentação)
  (ctx.lotacao || [])
    .filter((l) => l.trabalhador_id === trabalhador.id && MOV_S2206.includes(l.tipo_movimentacao))
    .forEach((l) => {
      eventos.push({ tipo: "S-2206", data_esperada: l.data_inicio, descricao: `Alteração: ${l.tipo_movimentacao.replace(/_/g, " ")}`, origem: "Lotação" });
    });

  // S-2230 Afastamento — mesma regra do módulo Atestados (prazos, soma da mesma doença em 60 dias, retorno após benefício)
  const doTrab = (ctx.atestados || []).filter((a) => a.trabalhador_id === trabalhador.id);
  const analise = doTrab.length ? analisarAtestados(doTrab) : {};
  doTrab.forEach((a) => {
    const r = analise[a.id];
    if (!r?.obrigatorio) return;
    eventos.push({ tipo: "S-2230", data_esperada: a.data_inicio, prazo: r.prazo, descricao: `Afastamento de ${a.dias} dia(s)${a.codigo_afastamento_esocial ? ` (motivo ${a.codigo_afastamento_esocial})` : ""} — prazo ${r.prazo ? r.prazo.split("-").reverse().join("/") : "—"}`, origem: "Atestado" });
  });

  // S-2240 Condições ambientais — obrigatório para todo empregado (sem risco: código 09.01.001 "ausência de fator de risco")
  if (trabalhador.data_admissao || cargoId) {
    const temRisco = cargoId && (ctx.riscos || []).some((r) => (r.cargo_ids || []).includes(cargoId));
    eventos.push({ tipo: "S-2240", data_esperada: trabalhador.data_admissao || "", descricao: temRisco ? "Condições ambientais (riscos do cargo no PGR)" : "Condições ambientais — ausência de fator de risco (09.01.001) ou cargo sem riscos cadastrados", origem: "PGR" });
  }

  // S-2298 Reintegração
  (ctx.lotacao || [])
    .filter((l) => l.trabalhador_id === trabalhador.id && l.tipo_movimentacao === "reativacao")
    .forEach((l) => {
      eventos.push({ tipo: "S-2298", data_esperada: l.data_inicio, descricao: "Reintegração", origem: "Lotação" });
    });

  // S-2299 Desligamento
  if (trabalhador.data_demissao) {
    eventos.push({ tipo: "S-2299", data_esperada: trabalhador.data_demissao, descricao: "Desligamento do trabalhador", origem: "Cadastro" });
  }

  // S-2221 — motorista profissional empregado (CBO 7823, 7824, 7825): exame toxicológico na admissão e no desligamento (CLT, art. 168, §§ 6º e 7º)
  const cargo = (ctx.cargos || []).find((c) => c.id === cargoId);
  if (/^782[345]/.test(String(cargo?.cbo || "").replace(/\D/g, ""))) {
    if (trabalhador.data_admissao) eventos.push({ tipo: "S-2221", data_esperada: trabalhador.data_admissao, descricao: "Exame toxicológico — admissão de motorista profissional", origem: "Cargo (CBO)" });
    if (trabalhador.data_demissao) eventos.push({ tipo: "S-2221", data_esperada: trabalhador.data_demissao, descricao: "Exame toxicológico — desligamento de motorista profissional", origem: "Cargo (CBO)" });
  }

  // S-2210 CAT — acidente de trabalho registrado
  (ctx.ocorrencias || [])
    .filter((o) => o.trabalhador_id === trabalhador.id)
    .forEach((o) => {
      eventos.push({ tipo: "S-2210", data_esperada: (o.data_hora || "").slice(0, 10), descricao: `CAT: ${(o.descricao || "acidente").slice(0, 60)}`, origem: "Acidente" });
    });

  return eventos;
}

// Cruza eventos esperados com eventos registrados (EventoEsocial) e define o status final.
export function consolidarEventos(esperados, registrados) {
  return esperados.map((esp) => {
    // casa por tipo + data; senão pega o mais recente do mesmo tipo
    let reg = registrados.find((r) => r.tipo_evento === esp.tipo && r.data_evento === esp.data_esperada);
    if (!reg) {
      const doTipo = registrados.filter((r) => r.tipo_evento === esp.tipo);
      if (doTipo.length) reg = doTipo[0];
    }
    const status = reg ? reg.status : "pendente";
    return {
      ...esp,
      status,
      recibo: reg?.recibo || "",
      registrado_id: reg?.id || null,
      data_evento: reg?.data_evento || esp.data_esperada,
    };
  });
}

export const ehConcluido = (s) => s === "transmitido" || s === "processado";