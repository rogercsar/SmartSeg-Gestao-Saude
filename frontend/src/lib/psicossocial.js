// Fatores de risco psicossociais (NR-1, item 1.5 + NR-17): instrumentos, importação e geração de riscos no PGR.

const FREQ = [["Nunca", 0], ["Raramente", 1], ["Às vezes", 2], ["Frequentemente", 3], ["Sempre", 4]].map(([rotulo, valor]) => ({ rotulo, valor }));
const OCORRENCIA = [["Não", 0], ["Sim, poucas vezes", 1], ["Sim, mensalmente", 2], ["Sim, semanalmente", 3], ["Sim, diariamente", 4]].map(([rotulo, valor]) => ({ rotulo, valor }));

// Roteiro de TRIAGEM baseado nos grupos de fatores do guia do MTE. Não é instrumento validado:
// para a avaliação formal, importe um instrumento validado (ex.: COPSOQ II – versão brasileira).
export const INSTRUMENTO_TRIAGEM = {
  nome: "Triagem de fatores psicossociais (roteiro NR-1/NR-17)",
  referencia: "Roteiro de triagem elaborado a partir dos grupos de fatores do Guia de Fatores de Riscos Psicossociais do MTE. Não substitui instrumento validado.",
  validado: false,
  min_respostas_grupo: 5,
  dimensoes: [
    { codigo: "D1", nome: "Demandas e ritmo de trabalho", grupo: "risco", calculo: "soma", cortes: [2, 5] },
    { codigo: "D2", nome: "Autonomia e controle", grupo: "recurso", calculo: "soma", cortes: [3, 5] },
    { codigo: "D3", nome: "Apoio da liderança e dos colegas", grupo: "recurso", calculo: "soma", cortes: [3, 5] },
    { codigo: "D4", nome: "Reconhecimento e justiça", grupo: "recurso", calculo: "soma", cortes: [3, 5] },
    { codigo: "D5", nome: "Clareza de papel e comunicação", grupo: "recurso", calculo: "soma", cortes: [3, 5] },
    { codigo: "D6", nome: "Exigências emocionais e conflitos", grupo: "risco", calculo: "soma", cortes: [2, 5] },
    { codigo: "D7", nome: "Violência e assédio (últimos 12 meses)", grupo: "risco", calculo: "soma", cortes: [0, 0] },
    { codigo: "D8", nome: "Equilíbrio entre trabalho e vida pessoal", grupo: "risco", calculo: "soma", cortes: [2, 5] },
  ],
  itens: [
    ["P1", "D1", "Tenho mais trabalho do que consigo fazer no tempo disponível."],
    ["P2", "D1", "Preciso trabalhar muito rápido ou sob pressão de prazos e metas."],
    ["P3", "D2", "Tenho liberdade para decidir como fazer o meu trabalho."],
    ["P4", "D2", "Posso influenciar a quantidade de trabalho que recebo."],
    ["P5", "D3", "Recebo ajuda e apoio da minha chefia quando preciso."],
    ["P6", "D3", "Recebo ajuda e apoio dos meus colegas quando preciso."],
    ["P7", "D4", "Meu trabalho é reconhecido e valorizado."],
    ["P8", "D4", "Sou tratado(a) de forma justa no trabalho."],
    ["P9", "D5", "Sei exatamente o que se espera de mim no trabalho."],
    ["P10", "D5", "Sou informado(a) com antecedência sobre mudanças importantes."],
    ["P11", "D6", "Meu trabalho me coloca em situações emocionalmente desgastantes."],
    ["P12", "D6", "Existem conflitos frequentes no ambiente de trabalho."],
    ["P13", "D7", "Nos últimos 12 meses, sofri humilhações, ameaças ou assédio moral no trabalho?", true],
    ["P14", "D7", "Nos últimos 12 meses, sofri assédio sexual ou violência física no trabalho?", true],
    ["P15", "D8", "O trabalho consome tanta energia que prejudica minha vida pessoal."],
    ["P16", "D8", "A jornada (horas extras, turnos, sobreaviso) prejudica o meu descanso."],
  ].map(([codigo, dimensao, texto, violencia]) => ({ codigo, dimensao, texto, opcoes: violencia ? OCORRENCIA : FREQ, invertido: false, binario: !!violencia })),
};

// Medidas de prevenção sugeridas por tipo de fator (o técnico revisa e ajusta)
const MEDIDAS = {
  D1: ["Rever dimensionamento de pessoal e distribuição de tarefas", "Revisar metas e prazos com participação dos trabalhadores"],
  D2: ["Ampliar a participação dos trabalhadores nas decisões sobre o próprio trabalho", "Permitir flexibilidade na organização das tarefas quando possível"],
  D3: ["Capacitar lideranças em gestão de pessoas e comunicação não violenta", "Criar rotinas de apoio e feedback entre equipes"],
  D4: ["Implantar práticas de reconhecimento e critérios transparentes de avaliação", "Garantir tratamento isonômico e canal para contestação"],
  D5: ["Definir e comunicar atribuições e responsabilidades por cargo", "Comunicar mudanças com antecedência e explicar seus motivos"],
  D6: ["Oferecer suporte psicológico e pausas após situações desgastantes", "Treinar equipes em gestão de conflitos e mediação"],
  D7: ["Aplicar política de prevenção e combate ao assédio e à violência (Lei 14.457/2022)", "Divulgar canal de denúncia sigiloso e apurar todos os relatos"],
  D8: ["Controlar horas extras, escalas e sobreaviso", "Garantir intervalos e descanso entre jornadas"],
};

// Riscos para o inventário do PGR a partir dos resultados agregados
export function riscosDosResultados(ap, res) {
  const out = [];
  for (const d of res?.geral || []) {
    if (!d.nivel || d.nivel === "baixo") continue;
    const probabilidade = d.desfavoravel >= 75 ? 5 : d.desfavoravel >= 50 ? 4 : d.desfavoravel >= 35 ? 3 : 2;
    const severidade = d.codigo === "D7" ? 4 : 3;
    out.push({
      company_id: ap.company_id,
      tipo: "psicossocial",
      agente: `Fator psicossocial: ${d.nome}`,
      fonte_geradora: `Organização do trabalho — resultado da pesquisa "${ap.nome}" (${res.total} respostas anônimas)`,
      possiveis_danos: "Estresse ocupacional, ansiedade, depressão, esgotamento (burnout), distúrbios do sono e adoecimentos relacionados",
      exposicao: "habitual_permanente",
      tipo_avaliacao: "qualitativa",
      tecnica_medicao: `${ap.instrumento?.nome || "Questionário"} — ${d.desfavoravel}% dos respondentes em situação desfavorável`,
      criterio_avaliacao: `Probabilidade pela proporção de respondentes em situação desfavorável (${d.desfavoravel}%); severidade pelo potencial de agravo à saúde mental${d.codigo === "D7" ? " (violência/assédio)" : ""}.`,
      severidade, probabilidade,
      origem: "levantamento", revisado: false,
      medidas_existentes: [],
      plano_acao: (MEDIDAS[d.codigo] || ["Definir medidas com participação dos trabalhadores"]).map((acao) => ({ acao, tipo_medida: "administrativa", responsavel: "", prazo: "", status: "pendente" })),
      data_avaliacao: new Date().toISOString().slice(0, 10),
    });
  }
  return out;
}

// Importação de instrumento por planilha (CSV ou XLSX) — uma linha por pergunta
export const COLUNAS_MODELO = ["codigo", "pergunta", "dimensao_codigo", "dimensao_nome", "grupo (risco|recurso)", "opcoes (rotulo=valor;...)", "invertido (sim|nao)", "binario (sim|nao)", "corte1", "corte2", "calculo (soma|media)"];
export function modeloCsv() {
  const ex = ["1A", "Você tem que trabalhar muito rapidamente?", "D1", "Ritmo de trabalho", "risco", "Nunca=0;Raramente=1;Às vezes=2;Frequentemente=3;Sempre=4", "nao", "nao", "2", "5", "soma"];
  return "\uFEFF" + [COLUNAS_MODELO, ex].map((l) => l.map((c) => `"${c}"`).join(";")).join("\n");
}
export async function lerInstrumento(file, nome) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const linhas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false }).filter((l) => l.some((c) => String(c || "").trim()));
  const corpo = linhas.slice(1);
  const sim = (v) => /^(s|sim|true|1|x)$/i.test(String(v || "").trim());
  const itens = [], dims = {};
  corpo.forEach((l, idx) => {
    const [codigo, pergunta, dcod, dnome, grupo, opcoes, inv, bin, c1, c2, calc] = l.map((c) => String(c ?? "").trim());
    if (!codigo || !pergunta || !dcod) throw new Error(`Linha ${idx + 2}: código, pergunta e dimensão são obrigatórios.`);
    const ops = opcoes.split(";").map((o) => o.split("=")).filter((p) => p.length === 2 && p[0].trim() !== "" && p[1].trim() !== "").map(([r, v]) => ({ rotulo: r.trim(), valor: Number(v.replace(",", ".")) }));
    if (ops.length < 2 || ops.some((o) => !Number.isFinite(o.valor))) throw new Error(`Linha ${idx + 2}: opções inválidas (use rótulo=valor;...).`);
    itens.push({ codigo, texto: pergunta, dimensao: dcod, opcoes: ops, invertido: sim(inv), binario: sim(bin) });
    if (!dims[dcod]) dims[dcod] = { codigo: dcod, nome: dnome || dcod, grupo: /recurso/i.test(grupo) ? "recurso" : "risco", calculo: /media|média/i.test(calc) ? "media" : "soma", cortes: [Number(String(c1).replace(",", ".")) || 0, Number(String(c2).replace(",", ".")) || 0] };
  });
  if (!itens.length) throw new Error("A planilha não tem perguntas.");
  return { nome: nome || file.name.replace(/\.(csv|xlsx|xls)$/i, ""), referencia: "Importado por planilha", validado: false, min_respostas_grupo: 5, itens, dimensoes: Object.values(dims) };
}
