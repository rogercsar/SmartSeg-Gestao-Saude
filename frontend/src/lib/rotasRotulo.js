// Mapa de rotas -> rótulo amigável, usado pelo rastreador de retomada e pelo painel.
export const ROTAS_ROTULO = {
  "/": "Início",
  "/assistente-ia": "Assistente IA",
  "/vencimentos": "Pendências e vencimentos",
  "/empresas": "Empresas",
  "/funcionarios": "Colaboradores",
  "/terceiros": "Terceiros",
  "/importacao": "Importar planilha",
  "/programas": "PGR, PCMSO e laudos",
  "/psicossocial": "Riscos psicossociais",
  "/documentos": "Documentos operacionais",
  "/catalogos-sst": "Catálogos técnicos",
  "/autos": "Autos de infração",
  "/clinica": "Clínica: agenda e ASO",
  "/atestados": "Atestados e FAP",
  "/espaco-zela": "Canal de escuta",
  "/epi": "EPI",
  "/treinamentos": "Treinamentos",
  "/inspecoes": "Inspeções e planos de ação",
  "/cipa": "CIPA",
  "/acidentes": "Acidentes e CAT",
  "/recusas": "Direito de recusa",
  "/relatorios": "Relatórios",
  "/dossie": "Dossiê da fiscalização",
  "/esocial": "eSocial",
  "/painel-negocio": "Painel do negócio",
  "/financeiro": "Financeiro",
  "/organizacao": "Equipe e permissões",
  "/consumo": "Plano e consumo",
  "/assinaturas": "Assinaturas",
  "/suporte": "Suporte",
  "/suporte-n2": "Suporte (analista)",
  "/manual": "Manual do sistema",
};

// Retorna o rótulo de uma rota, considerando rotas dinâmicas (ex.: /empresas/:id).
export function rotuloDe(path) {
  if (!path) return null;
  if (ROTAS_ROTULO[path]) return ROTAS_ROTULO[path];
  const seg = "/" + (path.split("/")[1] || "");
  return ROTAS_ROTULO[seg] || null;
}