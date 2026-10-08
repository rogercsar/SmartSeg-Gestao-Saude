import { base44 } from "@/api/base44Client";

let cache = null;
let loadingPromise = null;

// Carrega os três catálogos globais uma vez por sessão (com cache compartilhado).
export async function carregarCatalogos(forca = false) {
  if (cache && !forca) return cache;
  if (loadingPromise && !forca) return loadingPromise;
  loadingPromise = (async () => {
    const [r, e, a] = await Promise.all([
      base44.entities.RiscoCatalogo.filter({}, { sort: "agente", limit: 500 }).then((x) => x.items || []).catch(() => []),
      base44.entities.ExameCatalogo.filter({}, { sort: "exame", limit: 500 }).then((x) => x.items || []).catch(() => []),
      base44.entities.AptidaoCatalogo.filter({}, { sort: "nome", limit: 500 }).then((x) => x.items || []).catch(() => []),
    ]);
    cache = { riscos: r, exames: e, aptidoes: a };
    loadingPromise = null;
    return cache;
  })();
  return loadingPromise;
}

export function limparCacheCatalogo() {
  cache = null;
}

// Exames de catálogo associados a um risco de catálogo.
export function examesDoRisco(cat, riscoCatalogoId) {
  const rc = cat.riscos.find((x) => x.id === riscoCatalogoId);
  if (!rc?.exame_ids?.length) return [];
  return rc.exame_ids.map((id) => cat.exames.find((x) => x.id === id)).filter(Boolean);
}

export function aptidoesDoRisco(cat, riscoCatalogoId) {
  const rc = cat.riscos.find((x) => x.id === riscoCatalogoId);
  if (!rc?.aptidao_ids?.length) return [];
  return rc.aptidao_ids.map((id) => cat.aptidoes.find((x) => x.id === id)).filter(Boolean);
}

// Riscos de catálogo associados a um exame de catálogo (locação reversa).
export function riscosDoExame(cat, exameCatalogoId) {
  if (!exameCatalogoId) return [];
  return cat.riscos.filter((rc) => (rc.exame_ids || []).includes(exameCatalogoId));
}

export function exameCatalogoPorNome(cat, nome) {
  const n = (nome || "").trim().toLowerCase();
  if (!n) return null;
  return cat.exames.find((x) => (x.exame || "").trim().toLowerCase() === n) || null;
}