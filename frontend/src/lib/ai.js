import { base44 } from "@/api/base44Client";
import { uploadPrivado } from "@/lib/privateFiles";

// Chamada genérica à função "ai-invoke" com tratamento de erro padronizado
async function chamar(payload) {
  try {
    const res = await base44.functions.invoke("ai-invoke", payload);
    const data = res?.data || {};
    if (data.saldo) window.dispatchEvent(new CustomEvent("zela:saldo", { detail: data.saldo }));
    return data;
  } catch (err) {
    // O SDK do Base44 entrega Base44Error com .status e .data
    const status = err?.status ?? err?.response?.status;
    const data = (err?.data && typeof err.data === "object" ? err.data : null) || err?.response?.data || {};
    if (status === 402) window.dispatchEvent(new CustomEvent("zela:sem-creditos", { detail: data }));
    const e = new Error(data.mensagem || err?.message || "Falha na IA.");
    e.code = data.error;
    e.status = status;
    throw e;
  }
}

// Toda chamada de IA do app passa por aqui (controla créditos e provedor).
// recurso: chave de custo definida na função (chat_nr, dds, pgr_riscos, ...)
export async function invokeAI(recurso, { prompt, response_json_schema, add_context_from_internet } = {}) {
  const data = await chamar({ recurso, prompt, response_json_schema, add_context_from_internet });
  return data.result;
}

// Transcreve áudio gravado (arquivo fica privado). recurso: transcricao_zeca | transcricao_acidente
// blob: o que o MediaRecorder gravou (webm no Chrome/Android, mp4 no iPhone)
export async function transcreverAudio(recurso, blob) {
  const tipo = blob.type || "audio/webm";
  const nome = tipo.includes("mp4") ? "audio.m4a" : tipo.includes("ogg") ? "audio.ogg" : "audio.webm";
  const file = new File([blob], nome, { type: tipo });
  const { file_uri } = await uploadPrivado(file);
  const data = await chamar({ recurso, file_uri, mime: tipo });
  return typeof data.result === "string" ? data.result : "";
}

// Lê um PDF (arquivo fica privado) e devolve os dados no formato do schema
export async function extrairPdf(recurso, file, schema, prompt) {
  const { file_uri } = await uploadPrivado(file);
  const data = await chamar({
    recurso,
    file_uri,
    mime: "application/pdf",
    response_json_schema: schema,
    prompt: prompt || "Extraia os dados deste documento. Se um campo não existir, deixe vazio.",
  });
  return { dados: data.result || {}, file_uri };
}

export async function getSaldoIA() {
  const res = await base44.functions.invoke("ai-invoke", { action: "saldo" });
  return res?.data;
}

// IA sobre um arquivo já enviado (ex.: foto de setor). recurso: foto_riscos
export async function invokeAIArquivo(recurso, file_uri, mime, { prompt, response_json_schema } = {}) {
  const data = await chamar({ recurso, file_uri, mime, prompt, response_json_schema });
  return data.result;
}

export async function acaoCreditos(action, params = {}) {
  const data = await chamar({ action, ...params });
  return data;
}
