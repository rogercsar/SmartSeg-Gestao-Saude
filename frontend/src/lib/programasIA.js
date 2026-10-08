// Prompts e esquemas de IA do módulo Programas. Toda chamada passa pelo controle de créditos.
import { invokeAI, invokeAIArquivo } from "@/lib/ai";

const REGRAS = `Você é engenheiro(a) de segurança do trabalho e médico(a) do trabalho sênior no Brasil.
Siga NR-1 (GRO/PGR), NR-9, NR-7, NR-15, NR-16, NR-17, Decreto 3.048/99 (Anexo IV), IN PRES/INSS 128/2022 e o leiaute do eSocial (Tabelas 24 e 27).
Seja técnico, objetivo e conservador. Não invente medições: se não houver dado quantitativo, indique avaliação qualitativa e recomende a medição.
Códigos eSocial: preencha SOMENTE se tiver certeza do código oficial; caso contrário deixe o campo vazio (o responsável técnico completará).
Severidade e probabilidade sempre de 1 a 5 (5 = pior), considerando as medidas de controle existentes.
Responda em português do Brasil.`;

const RISCO_PROPS = {
  tipo: { type: "string", enum: ["fisico", "quimico", "biologico", "ergonomico", "acidente", "psicossocial"] },
  agente: { type: "string" },
  codigo_esocial: { type: "string" },
  fonte_geradora: { type: "string" },
  possiveis_danos: { type: "string" },
  meio_propagacao: { type: "string" },
  exposicao: { type: "string", enum: ["habitual_permanente", "habitual_intermitente", "eventual"] },
  tipo_avaliacao: { type: "string", enum: ["qualitativa", "quantitativa"] },
  unidade_medida: { type: "string" },
  limite_tolerancia: { type: "string" },
  tecnica_medicao: { type: "string" },
  severidade: { type: "number" },
  probabilidade: { type: "number" },
  medidas_existentes: { type: "array", items: { type: "string" } },
  epc: { type: "array", items: { type: "object", properties: { nome: { type: "string" }, eficaz: { type: "boolean" } } } },
  epi: { type: "array", items: { type: "object", properties: { nome: { type: "string" }, ca: { type: "string" }, eficaz: { type: "boolean" } } } },
  plano_acao: { type: "array", items: { type: "object", properties: { acao: { type: "string" }, prazo: { type: "string" } } } },
};

const LISTA_RISCOS = {
  type: "object",
  properties: { riscos: { type: "array", items: { type: "object", properties: RISCO_PROPS } }, observacoes: { type: "string" } },
};

function contexto({ empresa, unidade, setor, cargo }) {
  return [
    empresa && `Empresa: ${empresa.razao_social} | CNAE ${empresa.cnae || "?"} | ${empresa.setor_descricao || ""} | Grau de risco ${empresa.grau_de_risco || "?"}`,
    unidade && `Unidade: ${unidade.nome} (${unidade.municipio || ""}/${unidade.uf || ""}) CNAE ${unidade.cnae || ""}`,
    setor && `Setor: ${setor.nome}. Ambiente: ${setor.descricao_ambiente || "não descrito"}`,
    cargo && `Cargo: ${cargo.nome_cargo} (CBO ${cargo.cbo || "?"}). Jornada: ${cargo.jornada || "?"}. Atividades: ${cargo.atividades || "não descritas"}`,
  ].filter(Boolean).join("\n");
}

const limparRisco = (r) => ({
  ...r,
  severidade: Math.min(5, Math.max(1, Math.round(Number(r.severidade) || 3))),
  probabilidade: Math.min(5, Math.max(1, Math.round(Number(r.probabilidade) || 3))),
  plano_acao: (r.plano_acao || []).map((a) => ({ ...a, status: "pendente", responsavel: "" })),
});

// 1) Sugere o inventário de riscos de um setor/cargo
export async function sugerirRiscos(ctx) {
  const r = await invokeAI("riscos_sugestao", {
    prompt: `${REGRAS}\n\n${contexto(ctx)}\n\nIdentifique e caracterize TODOS os perigos/riscos ocupacionais relevantes deste cargo neste setor (inclua ergonômicos e de acidente). Não repita riscos. Para cada um, preencha todos os campos.`,
    response_json_schema: LISTA_RISCOS,
  });
  return (r?.riscos || []).map(limparRisco);
}

// 2) Caracteriza um risco descrito com as palavras do usuário
export async function caracterizarRisco(texto, ctx) {
  const r = await invokeAI("risco_caracterizacao", {
    prompt: `${REGRAS}\n\n${contexto(ctx)}\n\nO usuário descreveu o seguinte perigo/risco com as palavras dele:\n"""${texto}"""\n\nCaracterize tecnicamente. Se a descrição contiver mais de um agente, retorne um item para cada.`,
    response_json_schema: LISTA_RISCOS,
  });
  return (r?.riscos || []).map(limparRisco);
}

// 3) Analisa foto do setor
export async function analisarFoto(file_uri, ctx) {
  const r = await invokeAIArquivo("foto_riscos", file_uri, "image/jpeg", {
    prompt: `${REGRAS}\n\n${contexto(ctx)}\n\nAnalise a FOTO deste ambiente de trabalho. Liste apenas os perigos/riscos VISÍVEIS ou claramente inferíveis (máquinas sem proteção, piso, iluminação, produtos, postura, ausência de EPI/EPC, sinalização, arranjo físico). Em "observacoes", descreva o que foi visto e as não conformidades.`,
    response_json_schema: LISTA_RISCOS,
  });
  return { riscos: (r?.riscos || []).map(limparRisco), observacoes: r?.observacoes || "" };
}

// 4) Converte respostas de formulário de levantamento em riscos
export async function analisarLevantamento(respostas, ctx) {
  const r = await invokeAI("levantamento_analise", {
    prompt: `${REGRAS}\n\n${contexto(ctx)}\n\nRespostas de um levantamento de riscos preenchido por ${respostas._quem || "um participante"}:\n${JSON.stringify(respostas, null, 2)}\n\nTransforme em riscos caracterizados tecnicamente. Use as queixas e acidentes relatados para calibrar a probabilidade. Em "observacoes", resuma os pontos de atenção relatados.`,
    response_json_schema: LISTA_RISCOS,
  });
  return { riscos: (r?.riscos || []).map(limparRisco), observacoes: r?.observacoes || "" };
}

// 5) Preenche severidade/probabilidade em lote (matriz automática)
export async function preencherMatriz(riscos, ctx) {
  const lista = riscos.map((r) => ({
    id: r.id, tipo: r.tipo, agente: r.agente, fonte: r.fonte_geradora, exposicao: r.exposicao,
    danos: r.possiveis_danos, controles: [...(r.medidas_existentes || []), ...(r.epc || []).map((e) => e.nome), ...(r.epi || []).map((e) => e.nome)],
    intensidade: r.intensidade, limite: r.limite_tolerancia,
  }));
  const res = await invokeAI("risco_caracterizacao", {
    prompt: `${REGRAS}\n\n${contexto(ctx)}\n\nAtribua severidade (1-5) e probabilidade (1-5) para cada risco abaixo, com uma justificativa curta.\n${JSON.stringify(lista)}`,
    response_json_schema: {
      type: "object",
      properties: { itens: { type: "array", items: { type: "object", properties: { id: { type: "string" }, severidade: { type: "number" }, probabilidade: { type: "number" }, justificativa: { type: "string" } } } } },
    },
  });
  return res?.itens || [];
}

// 6) Sugere exames do PCMSO para um cargo
export async function sugerirExames(cargo, riscos, empresa) {
  const res = await invokeAI("pcmso_exames", {
    prompt: `${REGRAS}\n\n${contexto({ empresa, cargo })}\nRiscos do cargo:\n${JSON.stringify(riscos.map((r) => ({ id: r.id, tipo: r.tipo, agente: r.agente, exposicao: r.exposicao, intensidade: r.intensidade })))}\n\nDefina os exames do PCMSO (NR-7 e seus anexos) para este cargo: sempre o exame clínico; complementares conforme os riscos (ex.: audiometria para ruído — Anexo II; indicadores biológicos — Anexo I; espirometria/RX conforme Anexo IV; etc.). Informe em quais momentos cada exame se aplica, a periodicidade em meses e a justificativa normativa. Em risco_ids, liste os ids dos riscos que justificam o exame.`,
    response_json_schema: {
      type: "object",
      properties: {
        exames: {
          type: "array",
          items: {
            type: "object",
            properties: {
              exame: { type: "string" },
              codigo_esocial: { type: "string" },
              momentos: { type: "array", items: { type: "string", enum: ["admissional", "periodico", "retorno", "mudanca_risco", "demissional"] } },
              periodicidade_meses: { type: "number" },
              justificativa: { type: "string" },
              risco_ids: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
  });
  return res?.exames || [];
}

// 7) Enquadramento de insalubridade, periculosidade e aposentadoria especial
export async function enquadrarLaudos(cargo, riscos, empresa) {
  const res = await invokeAI("laudo_enquadramento", {
    prompt: `${REGRAS}\n\n${contexto({ empresa, cargo })}\nRiscos:\n${JSON.stringify(riscos.map((r) => ({ id: r.id, tipo: r.tipo, agente: r.agente, exposicao: r.exposicao, avaliacao: r.tipo_avaliacao, intensidade: r.intensidade, unidade: r.unidade_medida, limite: r.limite_tolerancia, epi: r.epi, epc: r.epc })))}\n\nPara CADA risco, avalie: (a) insalubridade pela NR-15 (anexo e grau: minimo/medio/maximo), considerando que EPI eficaz com CA pode neutralizar; (b) periculosidade pela NR-16 (anexo: 1,2,3,4,5 ou radiacao); (c) enquadramento para aposentadoria especial no Anexo IV do Decreto 3.048/99 (código do anexo, ex. 2.0.1), considerando exposição habitual e permanente e a eficácia do EPI conforme a IN 128/2022. Fundamente cada conclusão de forma objetiva. Quando depender de medição inexistente, diga isso na fundamentação e não caracterize.`,
    response_json_schema: {
      type: "object",
      properties: {
        itens: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              insalubridade: { type: "object", properties: { caracteriza: { type: "boolean" }, anexo: { type: "string" }, grau: { type: "string", enum: ["", "minimo", "medio", "maximo"] }, fundamentacao: { type: "string" } } },
              periculosidade: { type: "object", properties: { caracteriza: { type: "boolean" }, anexo: { type: "string" }, fundamentacao: { type: "string" } } },
              aposentadoria_especial: { type: "object", properties: { enquadra: { type: "boolean" }, codigo_anexo_iv: { type: "string" }, fundamentacao: { type: "string" } } },
            },
          },
        },
      },
    },
  });
  return res?.itens || [];
}

// 8) Textos técnicos do documento
export async function gerarTextos(tipo, nomeDoc, base, resumo) {
  return invokeAI("documento_texto", {
    prompt: `${REGRAS}\n\nRedija os textos técnicos do documento "${nomeDoc}" (${base}) para a empresa abaixo, em linguagem formal de laudo, sem inventar dados que não estejam no resumo.\n${JSON.stringify(resumo)}\n\nCampos: introducao (objetivo e base legal), metodologia (como os riscos foram identificados e avaliados, critérios da matriz e dos enquadramentos), responsabilidades (empregador, trabalhadores, responsável técnico), conclusao (síntese dos achados e recomendações gerais), revisao (periodicidade de revisão e gatilhos de revisão).`,
    response_json_schema: {
      type: "object",
      properties: { introducao: { type: "string" }, metodologia: { type: "string" }, responsabilidades: { type: "string" }, conclusao: { type: "string" }, revisao: { type: "string" } },
    },
  });
}
