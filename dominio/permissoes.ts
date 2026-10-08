// Origem: referencia-base44/src/lib/organizacao.js — módulos com permissão e rotas por módulo


// Módulos com permissão configurável pelo administrador
export const MODULOS = [
  ["cadastros", "Empresas e colaboradores", "Empresas, unidades, setores, cargos, colaboradores e terceiros (leitura sempre liberada a membros)"],
  ["programas", "PGR, PCMSO e laudos", "Riscos, medições, equipamentos, exames do PCMSO, programas e laudos"],
  ["saude", "Atestados e saúde", "Atestados, absenteísmo, FAP, relatórios de saúde e vacinas"],
  ["sensiveis", "Dados sensíveis (CID)", "Ver o CID dos atestados — dado de saúde protegido pela LGPD"],
  ["seguranca", "Segurança do trabalho", "EPI, treinamentos, inspeções, planos de ação, CIPA, acidentes e recusas"],
  ["documentos", "Documentos e IA", "Documentos, textos técnicos, autos de infração, Chat NR e normas"],
  ["esocial", "eSocial", "Eventos do eSocial"],
  ["clinica", "Clínica", "Menu da clínica (o acesso aos dados clínicos segue a equipe da clínica)"],
  ["vencimentos", "Painel de vencimentos", "Visão de tudo que vence"],
  ["financeiro", "Financeiro", "Contratos, folha e lançamentos financeiros"],
  ["consumo", "Consumo e fatura", "Créditos de IA, limite de gasto e demonstrativo"],
];
export const SO_VER = ["clinica", "vencimentos", "consumo", "sensiveis"];
export const PERFIS_ORG = { admin: "Administrador", gestor: "Gestor", funcionario: "Funcionário" };

// Rota → módulo exigido (rotas não listadas são livres para qualquer membro)
const ROTAS = [
  ["/vencimentos", "vencimentos"], ["/clinica", "clinica"],
  ["/empresas", "cadastros"], ["/funcionarios", "cadastros"], ["/importacao", "cadastros"], ["/trabalhadores", "cadastros"], ["/terceiros", "cadastros"],
  ["/catalogos-sst", "programas"], ["/programas", "programas"], ["/psicossocial", "programas"], ["/atestados", "saude"], ["/indicadores", "saude"],
  ["/epi", "seguranca"], ["/inspecoes", "seguranca"], ["/cipa", "seguranca"], ["/treinamentos", "seguranca"], ["/acidentes", "seguranca"], ["/recusas", "seguranca"],
  ["/documentos", "documentos"], ["/textos-tecnicos", "documentos"], ["/autos", "documentos"], ["/chat", "documentos"], ["/assistente-ia", "documentos"], ["/normas", "documentos"],
  ["/esocial", "esocial"], ["/financeiro", "financeiro"], ["/dashboard-financeiro", "financeiro"], ["/painel-negocio", "financeiro"], ["/dossie", "vencimentos"], ["/consumo", "consumo"], ["/planos", "consumo"],
];
export const moduloDaRota = (path) => (ROTAS.find(([r]) => path === r || path.startsWith(r + "/")) || [])[1] || null;

export function podeVer(ctx, modulo) {
  if (!modulo) return true;
  if (!ctx?.permissoes) return true; // sem contexto ainda: não bloqueia a navegação
  return !!ctx.permissoes["pv_" + modulo];
}
export const podeEditar = (ctx, modulo) => !!ctx?.permissoes?.["pe_" + modulo];