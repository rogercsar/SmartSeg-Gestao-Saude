import { base44 } from "@/api/base44Client";

// Busca trechos de NR relevantes a partir da pergunta do usuário.
// Primeiro por código de NR mencionado, depois por palavra-chave no texto.
export async function searchNormaTrechos(query, limit = 8) {
  if (!query || query.trim().length < 3) return [];
  try {
    const nrMatches = (query.match(/NR-?\s?\d{1,2}/gi) || []).map((m) =>
      "NR-" + m.replace(/NR-?\s?/i, "").trim()
    );
    const keywords = query
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !/^NR/i.test(w))
      .slice(0, 4);

    let trechos = [];
    if (nrMatches.length > 0) {
      const res = await base44.entities.NormaTrecho.filter(
        { nr_codigo: { $in: nrMatches } },
        { limit }
      );
      trechos = res.items || res || [];
    }
    if (trechos.length < limit && keywords.length > 0) {
      const res = await base44.entities.NormaTrecho.filter(
        { texto: { $regex: keywords.join("|"), $options: "i" } },
        { limit: limit - trechos.length }
      );
      const extra = res.items || res || [];
      const ids = new Set(trechos.map((t) => t.id));
      trechos = [...trechos, ...extra.filter((t) => !ids.has(t.id))];
    }
    return trechos.slice(0, limit);
  } catch {
    return [];
  }
}

// Formata trechos para incluir como contexto no prompt do chat.
export function formatTrechos(trechos) {
  if (!trechos || trechos.length === 0) return "";
  return trechos
    .map(
      (t) =>
        `[${t.nr_codigo}${t.item ? " · item " + t.item : ""}] ${t.titulo || ""}\n${t.texto}`
    )
    .join("\n\n---\n\n");
}

// Divide um texto colado de uma NR em trechos por item/subitem.
// Heurística simples: linhas que começam com número (ex: "6.1", "35.5.1") iniciam novo trecho.
export function splitNrIntoTrechos(nrCodigo, rawText) {
  const lines = rawText.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const trechos = [];
  let current = null;
  const itemRegex = /^(\d{1,2}(?:\.\d{1,2}){0,3})\b[)\-.:\s]/;
  for (const line of lines) {
    const m = line.match(itemRegex);
    if (m) {
      if (current) trechos.push(current);
      current = { nr_codigo: nrCodigo, item: m[1], titulo: "", texto: line };
    } else if (current) {
      current.texto += "\n" + line;
    } else {
      // Linha inicial sem número — pode ser título
      current = { nr_codigo: nrCodigo, item: "", titulo: line, texto: line };
    }
  }
  if (current) trechos.push(current);
  return trechos.filter((t) => t.texto.trim().length > 0);
}