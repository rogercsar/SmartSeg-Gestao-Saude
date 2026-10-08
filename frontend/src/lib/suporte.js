import { base44 } from "@/api/base44Client";

export const WORK = {
  bg: "#F6F9FB",
  surface: "#FFFFFF",
  border: "#E3E8EE",
  accent: "#0B6FA8",
  text: "#1F2328",
  muted: "#5F6368",
  pos: "#16A34A",
  neg: "#DC2626",
  warn: "#F97316",
};

export const STATUS_META = {
  open: { label: "Aberto", color: "#64748B" },
  analyzing: { label: "Analisando (IA)", color: "#0B6FA8" },
  resolved_ai: { label: "Resolvido pela IA", color: "#16A34A" },
  escalated_n2: { label: "Escalonado N2", color: "#F97316" },
  resolved_n2: { label: "Resolvido N2", color: "#16A34A" },
};

export function gerarProtocolo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SUP-${ymd}-${rand}`;
}

export function formatData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Resolve URIs privadas de anexos para URLs assinadas temporárias (cliente).
export async function resolverAnexos(uris) {
  if (!uris?.length) return [];
  const out = [];
  for (const u of uris) {
    try {
      const r = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: u });
      out.push(r?.signed_url || "");
    } catch (e) { out.push(""); }
  }
  return out;
}