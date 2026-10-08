// Pendências documentais da NR-01; não substituem a avaliação técnica no local.
export function pendenciasPgr(dados, programa) {
  const pendencias = [];
  if (!dados.unidades?.length) pendencias.push("Cadastre o estabelecimento onde o PGR se aplica (1.5.3.1).");
  if (!dados.setores?.length) pendencias.push("Caracterize os processos e ambientes de trabalho (1.5.7.3.2 a).");
  if (!dados.cargos?.length || dados.cargos.some((c) => !c.atividades?.trim())) pendencias.push("Descreva as atividades de todos os cargos (1.5.7.3.2 b).");
  if (!dados.riscos?.length) pendencias.push("Registre a identificação de perigos e o inventário de riscos (1.5.7.3.1).");
  for (const r of dados.riscos || []) {
    const nome = `Risco ${r.agente || "sem nome"}`;
    if (!r.fonte_geradora || !r.possiveis_danos || !r.cargo_ids?.length) pendencias.push(`${nome}: informe fonte, possíveis danos e grupos expostos (1.5.4.3.1).`);
    if (!r.severidade || !r.probabilidade || !r.criterio_avaliacao) pendencias.push(`${nome}: fundamente severidade e probabilidade (1.5.4.4.2).`);
    if (!r.data_avaliacao) pendencias.push(`${nome}: informe a data da avaliação para acompanhar revisões (1.5.4.4.6).`);
    if (!r.revisado) pendencias.push(`${nome}: aguarda revisão técnica.`);
    for (const a of r.plano_acao || []) {
      if (!a.acao || !a.prazo || !a.acompanhamento || !a.afericao_resultado) pendencias.push(`${nome}: complete ação, prazo, acompanhamento e aferição (1.5.5.2.2).`);
      if (a.status === "concluida" && !a.registro_implementacao) pendencias.push(`${nome}: registre a implementação da medida concluída (1.5.5.3.1).`);
    }
  }
  if (!programa?.data_emissao) pendencias.push("Informe a data de emissão do PGR (1.5.7.2).");
  if (!programa?.responsavel?.nome) pendencias.push("Identifique o responsável pelo documento (1.5.7.2).");
  // NR-01/2026: fatores psicossociais relacionados ao trabalho devem integrar o GRO
  const temRiscoPsicossocial = (dados.riscos || []).some((r) => r.tipo === "psicossocial");
  if (!temRiscoPsicossocial) pendencias.push("Avalie fatores psicossociais relacionados ao trabalho (1.5.4.3.1 — NR-01/2026).");
  return pendencias;
}