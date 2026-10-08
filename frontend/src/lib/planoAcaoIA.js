// Sugestões de plano de ação por IA (NR-01 1.5.5.2 — hierarquia de controle).
// Toda chamada passa pelo controle de créditos da função "ai-invoke" (recurso plano_acao_ia).
import { invokeAI } from "@/lib/ai";

const REGRAS = `Você é engenheiro(a) de segurança do trabalho sênior no Brasil.
Siga a NR-01 (1.5.5.2 — hierarquia de controle: eliminação do perigo > medidas de proteção coletiva > medidas administrativas/organização do trabalho > EPI).
Seja objetivo e exequível. Não invente e-mails de responsáveis; indique apenas o cargo/função responsável.
Responda em português do Brasil.`;

const SCHEMA = {
  type: "object",
  properties: {
    acoes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          descricao: { type: "string" },
          tipo_medida: { type: "string", enum: ["eliminacao", "coletiva", "administrativa", "individual"] },
          responsavel: { type: "string" },
          escopo_tipo: { type: "string", enum: ["empresa", "unidade", "setor", "cargo", "trabalhador"] },
          prazo_dias: { type: "number" },
          justificativa: { type: "string" },
        },
      },
    },
  },
};

function hoje() {
  return new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);
}
function somaDias(dias) {
  const d = new Date(Date.now() - 4 * 3600 * 1000);
  d.setUTCDate(d.getUTCDate() + (Number(dias) || 30));
  return d.toISOString().slice(0, 10);
}

// Sugere ações para um risco caracterizado (fluxo 1 do PRD: sugestão na caracterização).
// ctx = { empresa, setor, cargo, unidade } (opcionais)
export async function sugerirAcoesRisco(empresa, risco, ctx = {}) {
  const contexto = [
    empresa && `Empresa: ${empresa.razao_social} | CNAE ${empresa.cnae || "?"} | Grau de risco ${empresa.grau_de_risco || "?"}`,
    ctx.unidade && `Unidade: ${ctx.unidade.nome}`,
    ctx.setor && `Setor: ${ctx.setor.nome}`,
    ctx.cargo && `Cargo: ${ctx.cargo.nome_cargo}`,
  ].filter(Boolean).join("\n");

  const r = risco || {};
  const prompt = `${REGRAS}

${contexto}

Risco caracterizado:
- Tipo: ${r.tipo || "?"}
- Agente/perigo: ${r.agente || "?"}
- Fonte geradora: ${r.fonte_geradora || "—"}
- Possíveis danos: ${r.possiveis_danos || "—"}
- Exposição: ${r.exposicao || "—"}
- Severidade (1-5): ${r.severidade || "?"} · Probabilidade (1-5): ${r.probabilidade || "?"}
- Medidas de controle existentes: ${JSON.stringify(r.medidas_existentes || [])}
- EPC: ${JSON.stringify((r.epc || []).map((e) => e.nome))}
- EPI: ${JSON.stringify((r.epi || []).map((e) => e.nome))}

Proponha um plano de ação seguindo a hierarquia de controle da NR-01 (1.5.5.2), priorizando eliminação e proteção coletiva antes de EPI.
Para cada ação informe: descricao (objetiva), tipo_medida, responsavel (cargo/função), escopo_tipo (empresa|unidade|setor|cargo|trabalhador), prazo_dias (a partir de hoje) e justificativa técnica curta.`;

  const res = await invokeAI("plano_acao_ia", { prompt, response_json_schema: SCHEMA });
  const ini = hoje();
  return (res?.acoes || []).map((a) => ({
    company_id: empresa?.id || "",
    origem: "risco_ia",
    risco_id: r.id || "",
    risco_agente: r.agente || "",
    descricao: a.descricao || "",
    justificativa: a.justificativa || "",
    tipo_medida: a.tipo_medida || "administrativa",
    estrutura: "pdca",
    escopo: { tipo: a.escopo_tipo || "empresa", ids: [], descricao: "" },
    responsavel: a.responsavel || "",
    responsavel_email: "",
    responsaveis_extras: [],
    data_inicio: ini,
    prazo: somaDias(a.prazo_dias || 30),
    prioridade: "media",
    status: "pendente",
    pendente_aprovacao: true,
    lembretes: [],
    evidencias: [],
    notificacoes_enviadas: [],
  }));
}