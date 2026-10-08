// @ts-nocheck — TIPAGEM PENDENTE (2 avisos do TypeScript): lógica validada no protótipo e coberta pelos testes; adicionar tipos ao portar.
// Origem: referencia-base44/src/lib/terceiros.js — gestão de terceiros
// Catálogos e helpers do módulo de Gestão de Terceiros

export const TIPOS_DOC_TERCEIRO = {
  contrato: { label: "Contrato", cor: "#0B6FA8" },
  art: { label: "ART (responsável técnico)", cor: "#7C3AED" },
  ppp: { label: "PPP", cor: "#0891B2" },
  pgr_terceiro: { label: "PGR da terceira", cor: "#F97316" },
  pcmso_terceiro: { label: "PCMSO da terceira", cor: "#10B981" },
  aso_lote: { label: "ASO (lote)", cor: "#22C55E" },
  fssp: { label: "Ficha/registro FGTS e SS", cor: "#EAB308" },
  certificacao_iso: { label: "Certificação (ISO/SST)", cor: "#3B82F6" },
  cipa: { label: "CIPA/SIPAT", cor: "#EC4899" },
  nr_comprovante: { label: "Comprovante de NR", cor: "#A16207" },
  treinamento_lote: { label: "Treinamentos (lote)", cor: "#6366F1" },
  outro: { label: "Outro", cor: "#94A3B8" },
};

export const STATUS_TERCEIRA = {
  ativa: { label: "Ativa", cor: "#22C55E" },
  suspensa: { label: "Suspensa", cor: "#F59E0B" },
  inativa: { label: "Inativa", cor: "#94A3B8" },
};

const hoje = () => new Date();
const diasAte = (dataStr) => {
  if (!dataStr) return null;
  const d = new Date(dataStr + "T12:00:00");
  return Math.ceil((d - hoje()) / (1000 * 60 * 60 * 24));
};

export function statusDocumento(doc) {
  if (!doc.data_validade) return { status: "ok", label: "Sem validade", dias: null, cor: "#22C55E" };
  const dias = diasAte(doc.data_validade);
  if (dias < 0) return { status: "vencido", label: "Vencido", dias, cor: "#EF4444" };
  if (dias <= 30) return { status: "vencendo", label: `Vence em ${dias}d`, dias, cor: "#F59E0B" };
  return { status: "ok", label: "Válido", dias, cor: "#22C55E" };
}

export function statusContrato(terceira) {
  if (!terceira.contrato_fim) return { status: "ok", label: "Sem fim definido", dias: null, cor: "#22C55E" };
  const dias = diasAte(terceira.contrato_fim);
  if (dias < 0) return { status: "vencido", label: "Vencido", dias, cor: "#EF4444" };
  if (dias <= 30) return { status: "vencendo", label: `Vence em ${dias}d`, dias, cor: "#F59E0B" };
  return { status: "ok", label: "Vigente", dias, cor: "#22C55E" };
}

export function resumoDocumentos(documentos) {
  let vencidos = 0, vencendo = 0, ok = 0;
  documentos.forEach((d) => {
    const s = statusDocumento(d).status;
    if (s === "vencido") vencidos++;
    else if (s === "vencendo") vencendo++;
    else ok++;
  });
  return { vencidos, vencendo, ok, total: documentos.length };
}

export const dataBR = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—");