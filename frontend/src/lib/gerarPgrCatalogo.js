import { invokeAI } from "@/lib/ai";
import { base44 } from "@/api/base44Client";

// 1) IA seleciona, no catálogo compartilhado, quais riscos se aplicam a cada cargo.
export async function gerarInventarioDoCatalogo(dados, cat) {
  const riscos = (cat.riscos || []).filter((r) => r.ativo !== false);
  const listaCat = riscos.map((r) => ({ id: r.id, tipo: r.tipo, agente: r.agente, descricao: (r.descricao || "").slice(0, 160), codigo_esocial: r.codigo_esocial, fonte: r.fonte_geradora }));
  const cargos = dados.cargos.map((c) => ({ id: c.id, nome: c.nome_cargo, cbo: c.cbo, atividades: (c.atividades || "").slice(0, 280), setor: dados.setores.find((s) => s.id === c.setor_id)?.nome }));
  const prompt = `Você é engenheiro(a) de segurança do trabalho no Brasil. Selecione, no catálogo de riscos compartilhado, quais riscos se aplicam a cada cargo desta empresa, com base nas atividades e no CNAE.

Empresa: ${dados.empresa.razao_social} | CNAE ${dados.empresa.cnae || "?"} | Grau de risco ${dados.empresa.grau_de_risco || "?"} | Atividade: ${dados.empresa.setor_descricao || ""}

Catálogo de riscos disponível (use SOMENTE estes ids):
${JSON.stringify(listaCat)}

Cargos:
${JSON.stringify(cargos)}

Para cada cargo, retorne os ids do catálogo aplicáveis. Seja objetivo: inclua ergonômicos e de acidente/mecânico quando houver atividade manual, máquinas ou deslocamento; inclua psicossocial quando aplicável. Não invente ids que não estejam no catálogo. Se nenhum risco se aplicar, retorne array vazio.`;

  const res = await invokeAI("riscos_sugestao", {
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        cargos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              cargo_id: { type: "string" },
              risco_catalogo_ids: { type: "array", items: { type: "string" } },
              justificativa: { type: "string" },
            },
          },
        },
      },
    },
  });
  return res?.cargos || [];
}

// 2) Aplica o mapeamento: cria Risco e ExamePcmso a partir dos itens do catálogo (sem duplicar).
export async function aplicarInventarioDoCatalogo(dados, mapping, cat) {
  const riscosCat = cat.riscos;
  const examesCat = cat.exames;
  let riscosCriados = 0, examesCriados = 0, cargosAfetados = 0;

  for (const m of mapping || []) {
    if (!m.risco_catalogo_ids?.length) continue;
    const cargo = dados.cargos.find((c) => c.id === m.cargo_id);
    if (!cargo) continue;
    cargosAfetados++;

    for (const rid of m.risco_catalogo_ids) {
      const rc = riscosCat.find((r) => r.id === rid);
      if (!rc) continue;

      const existente = dados.riscos.find((r) => r.catalogo_id === rc.id && (r.cargo_ids || []).includes(cargo.id));
      let riscoId = existente?.id;
      if (!existente) {
        const novo = await base44.entities.Risco.create({
          company_id: dados.empresa.id, setor_id: cargo.setor_id || null, cargo_ids: [cargo.id],
          tipo: rc.tipo, agente: rc.agente, codigo_esocial: rc.codigo_esocial || "", codigo_esocial_descricao: rc.codigo_esocial_descricao || "",
          catalogo_id: rc.id, aptidao_ids: rc.aptidao_ids || [],
          fonte_geradora: rc.fonte_geradora || "", possiveis_danos: rc.possiveis_danos || "", meio_propagacao: rc.meio_propagacao || "",
          exposicao: "habitual_permanente", tipo_avaliacao: "qualitativa", origem: "catalogo", revisado: false,
        });
        riscoId = novo.id;
        riscosCriados++;
      }

      for (const eid of rc.exame_ids || []) {
        const ec = examesCat.find((e) => e.id === eid);
        if (!ec) continue;
        const existenteEx = dados.exames.find((e) => e.cargo_id === cargo.id && (e.exame || "").trim().toLowerCase() === (ec.exame || "").trim().toLowerCase());
        if (existenteEx) {
          if (!(existenteEx.risco_ids || []).includes(riscoId)) {
            await base44.entities.ExamePcmso.update(existenteEx.id, { risco_ids: [...(existenteEx.risco_ids || []), riscoId] });
          }
          continue;
        }
        await base44.entities.ExamePcmso.create({
          company_id: dados.empresa.id, cargo_id: cargo.id, exame: ec.exame, catalogo_id: ec.id,
          codigo_esocial: ec.codigo_esocial || "", codigo_esocial_descricao: ec.codigo_esocial_descricao || "",
          momentos: ec.momentos_default || ["admissional", "periodico"], periodicidade_meses: ec.periodicidade_meses || 12,
          justificativa: ec.justificativa_modelo || "", risco_ids: [riscoId], origem: "catalogo", ativo: true,
        });
        examesCriados++;
      }
    }
  }
  return { riscosCriados, examesCriados, cargosAfetados };
}

// 3) Textos técnicos normativos do PGR (NR-01, NR-09, NR-15/16, Decreto 3.048/99, eSocial) — sem IA.
export function textosPgrDoCatalogo(dados) {
  const e = dados.empresa;
  const tipos = Array.from(new Set(dados.riscos.map((r) => r.tipo)));
  return {
    introducao: `O presente Programa de Gerenciamento de Riscos (PGR) foi elaborado para ${e.razao_social} (CNPJ ${e.cnpj || "—"}, CNAE ${e.cnae || "—"}, grau de risco ${e.grau_de_risco || "—"}) em atendimento ao Capítulo 1.5 da NR-1 — Gerenciamento de Riscos Ocupacionais (GRO), com vigência a partir de 26/05/2026, e à NR-9 (Avaliação das Exposições Ocupacionais). O PGR reúne a identificação de perigos, a avaliação dos riscos e o plano de ação, integrando-se ao Programa de Controle Médico de Saúde Ocupacional (PCMSO — NR-7) e ao Laudo Técnico das Condições Ambientais do Trabalho (LTCAT — Decreto 3.048/99, Anexo IV). A estrutura do inventário e os códigos de agentes nocivos seguem o leiaute do eSocial (Tabela 24 — evento S-2240); os exames seguem a Tabela 27 (evento S-2220).`,
    metodologia: `A identificação de perigos e a construção do inventário partiram do catálogo compartilhado de riscos e exames da plataforma, cruzado com as atividades de cada cargo e o CNAE do estabelecimento. Cada risco foi classificado quanto ao tipo (físico, químico, biológico, ergonômico, acidente/mecânico e psicossocial), à fonte geradora, aos possíveis danos e à via de exposição, conforme os itens 1.5.4.3.1 e 1.5.4.3.2 da NR-01. A avaliação foi feita por matriz de risco 5x5 (severidade x probabilidade), com classificação do nível em baixo, moderado, alto e crítico e a ação requerida correspondente (1.5.4.4). Os enquadramentos de insalubridade (NR-15), periculosidade (NR-16) e aposentadoria especial (Decreto 3.048/99, Anexo IV; IN PRES/INSS 128/2022) e as avaliações quantitativas devem ser complementados pelo responsável técnico com as medições e a análise no local. Os exames do PCMSO são sugeridos a partir das associações risco-exame do catálogo, conforme a NR-7.`,
    responsabilidades: `Empregador: aplicar as medidas de prevenção e de controle, elaborar e manter o PGR atualizado e divulgar os riscos aos trabalhadores (NR-01, 1.5.2 e 1.5.6). Trabalhadores: colaborar na identificação de perigos, cumprir as medidas de controle e comunicar falhas ou situações perigosas, podendo exercer o direito de interrupção de atividade de risco iminente (NR-01, 1.5.6.2 e 1.8). Responsável técnico (engenheiro(a) de segurança do trabalho): revisar tecnicamente os riscos, as avaliações e os enquadramentos, validar o PGR e manter a rastreabilidade das informações. Médico coordenador do PCMSO: articular os exames aos riscos identificados (NR-7).`,
    conclusao: `O inventário de riscos foi gerado a partir do catálogo compartilhado e das atividades da empresa, contemplando ${dados.riscos.length} risco(s) entre os tipos ${tipos.length ? tipos.join(", ") : "—"}. Os registros ficam como rascunho e ainda aguardam revisão técnica, complementação das medidas de controle existentes (EPC/EPI com CA) e, quando aplicável, avaliações quantitativas e enquadramentos. As pendências documentais são apresentadas na abertura deste documento e devem ser sanadas antes da emissão. O PGR deve ser revisado pelo menos a cada dois anos ou diante de mudanças, acidentes, ineficácia de medidas, alterações legais ou avaliação de risco residual (NR-01, 1.5.4.4.6).`,
    revisao: `O PGR deve ser revisado de forma contínua, no mínimo a cada dois anos, ou quando ocorrerem mudanças no processo ou no arranjo físico, aquisição de equipamentos, acidentes ou doenças relacionadas ao trabalho, ineficácia das medidas de controle ou atualização de requisitos legais (NR-01, 1.5.4.4.6). O histórico do inventário de riscos deve ser preservado por, no mínimo, 20 anos (NR-01, 1.5.7.3.3.1).`,
  };
}