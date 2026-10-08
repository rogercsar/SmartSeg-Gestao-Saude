import { base44 } from "@/api/base44Client";

// Monta a árvore hierárquica: Unidade → Setor → Cargo (com riscos, exames, trabalhadores)
export function montarArvore({ unidades, setores, cargos, trabalhadores, riscos, exames }) {
  const agrupar = (lista, chave) => {
    const map = {};
    for (const it of lista) {
      const k = typeof chave === "function" ? chave(it) : it[chave];
      if (!k) continue;
      if (!map[k]) map[k] = [];
      map[k].push(it);
    }
    return map;
  };

  const riscosPorCargo = {};
  for (const r of riscos) {
    for (const cid of r.cargo_ids || []) {
      if (!riscosPorCargo[cid]) riscosPorCargo[cid] = [];
      riscosPorCargo[cid].push(r);
    }
  }
  const examesPorCargo = agrupar(exames, "cargo_id");
  const trabPorCargo = agrupar(trabalhadores, "cargo_id");
  const cargosPorSetor = agrupar(cargos, "setor_id");

  const setoresPorUnidade = agrupar(setores, "unidade_id");
  const setoresSemUnidade = setores.filter((s) => !s.unidade_id);

  const noCargo = (c) => ({
    tipo: "cargo",
    item: c,
    riscos: riscosPorCargo[c.id] || [],
    exames: examesPorCargo[c.id] || [],
    trabalhadores: trabPorCargo[c.id] || [],
  });

  const noSetor = (s) => ({
    tipo: "setor",
    item: s,
    filhos: (cargosPorSetor[s.id] || []).map(noCargo),
  });

  const arvore = unidades.map((u) => ({
    tipo: "unidade",
    item: u,
    filhos: (setoresPorUnidade[u.id] || []).map(noSetor),
  }));

  if (setoresSemUnidade.length) {
    arvore.push({
      tipo: "sem_unidade",
      item: { id: null, nome: "Sem unidade" },
      filhos: setoresSemUnidade.map(noSetor),
    });
  }

  return arvore;
}

// Copia setores (com cargos, riscos, exames e caracterizações) para outra unidade.
// Cria cópias independentes — não altera nem deduplica registros existentes no destino.
export async function copiarEstrutura({ companyId, unidadeDestinoId, setoresSelecionados }) {
  const counts = { setores: 0, cargos: 0, riscos: 0, exames: 0 };

  for (const setorOrig of setoresSelecionados) {
    const novoSetor = await base44.entities.Setor.create({
      company_id: companyId,
      unidade_id: unidadeDestinoId,
      nome: setorOrig.nome,
      descricao_ambiente: setorOrig.descricao_ambiente || "",
    });
    counts.setores++;

    const cargos = await base44.entities.CargoFuncao.filter({ setor_id: setorOrig.id });
    const cargoMap = {}; // id original → id novo

    for (const cargoOrig of cargos) {
      const novoCargo = await base44.entities.CargoFuncao.create({
        company_id: companyId,
        nome_cargo: cargoOrig.nome_cargo,
        cbo: cargoOrig.cbo,
        setor_id: novoSetor.id,
        unidade_id: unidadeDestinoId,
        ghe: cargoOrig.ghe,
        jornada: cargoOrig.jornada,
        quantidade_funcionarios: cargoOrig.quantidade_funcionarios,
        atividades: cargoOrig.atividades,
        riscos_identificados: cargoOrig.riscos_identificados || [],
        epis_obrigatorios: cargoOrig.epis_obrigatorios || [],
        procedimentos_emergencia: cargoOrig.procedimentos_emergencia,
      });
      cargoMap[cargoOrig.id] = novoCargo.id;
      counts.cargos++;
    }

    // Riscos únicos do setor (um risco pode estar em vários cargos — deduplica por id)
    const riscosVistos = new Set();
    const riscosUnicos = [];
    for (const cid of Object.keys(cargoMap)) {
      const rs = await base44.entities.Risco.filter({ cargo_ids: cid });
      for (const r of rs) {
        if (!riscosVistos.has(r.id)) {
          riscosVistos.add(r.id);
          riscosUnicos.push(r);
        }
      }
    }
    for (const riscoOrig of riscosUnicos) {
      const { id, created_date, updated_date, created_by, created_by_id, ...dados } = riscoOrig; // eslint-disable-line no-unused-vars
      const novosCargoIds = (riscoOrig.cargo_ids || []).map((c) => cargoMap[c]).filter(Boolean);
      await base44.entities.Risco.create({
        ...dados,
        cargo_ids: novosCargoIds.length ? novosCargoIds : [],
      });
      counts.riscos++;
    }

    // Exames por cargo
    for (const cargoOrig of cargos) {
      const exames = await base44.entities.ExamePcmso.filter({ cargo_id: cargoOrig.id });
      for (const exameOrig of exames) {
        const { id, created_date, updated_date, created_by, created_by_id, ...dados } = exameOrig; // eslint-disable-line no-unused-vars
        await base44.entities.ExamePcmso.create({
          ...dados,
          cargo_id: cargoMap[cargoOrig.id],
        });
        counts.exames++;
      }
    }
  }

  return counts;
}