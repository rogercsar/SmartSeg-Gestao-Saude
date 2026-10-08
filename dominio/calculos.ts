// @ts-nocheck — TIPAGEM PENDENTE (48 avisos do TypeScript): lógica validada no protótipo e coberta pelos testes; adicionar tipos ao portar.
// Origem: referencia-base44/src/lib/calculos.js — higiene (ruído, calor, frio, iluminação NHO 11, vibração, químicos, sílica) com critério NR × NHO
// Cálculos de higiene ocupacional (NR-15, NR-9 Anexos, NHOs da Fundacentro).
// Funções puras: recebem números, devolvem resultado + conclusão. Testadas em /tmp (ver histórico).

const log10 = Math.log10;
const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
const num = (v) => (v === "" || v === null || v === undefined ? NaN : Number(String(v).replace(",", ".")));

// ===================== RUÍDO CONTÍNUO/INTERMITENTE =====================
// NR-15 Anexo 1: critério 85 dB(A), incremento de duplicação q = 5
// NHO-01:        critério 85 dB(A), q = 3 (nível de ação 82 dB(A) / dose 50%)
export function tempoPermitidoMin(nivel, q) {
  return 480 / Math.pow(2, (nivel - 85) / q);
}

// periodos: [{ nivel: dB(A), minutos }]
export function ruidoPorPeriodos(periodos) {
  const todos = periodos.map((x) => ({ nivel: num(x.nivel), minutos: num(x.minutos) }));
  const p = todos.filter((x) => x.nivel > 0 && x.minutos > 0);
  if (!p.length) return null;
  const te = p.reduce((s, x) => s + x.minutos, 0);
  const calc = (q, corte) => {
    const dose = p.reduce((s, x) => (x.nivel < corte ? s : s + x.minutos / tempoPermitidoMin(x.nivel, q)), 0);
    return dose;
  };
  // NR-15: níveis abaixo de 80 dB(A) não contam na dose; NHO-01 integra a partir de 80 dB(A)
  const doseNR = calc(5, 80);
  const doseNHO = calc(3, 80);
  const out = montarRuido(doseNR, doseNHO, te);
  const ignorados = todos.length - p.length;
  if (ignorados) out.aviso_dados = `${ignorados} período(s) ignorado(s) por dados incompletos.`;
  // NR-15 Anexo 1, item 7: acima de 115 dB(A) sem proteção = risco grave e iminente
  if (p.some((x) => x.nivel > 115)) {
    out.teto = true;
    out.conclusao = "Período acima de 115 dB(A) — risco grave e iminente (NR-15 Anexo 1, item 7). " + out.conclusao;
  }
  return out;
}

// Leitura direta do dosímetro: dose (%) medida em "minutos" de amostragem, projetada para a jornada
export function ruidoPorDose({ dose_nr15, dose_nho01, minutos_amostra, minutos_jornada }) {
  const ta = num(minutos_amostra);
  const tj = num(minutos_jornada) || ta;
  if (!(ta > 0)) return null;
  const f = tj / ta;
  const dNR = num(dose_nr15) > 0 ? (num(dose_nr15) / 100) * f : NaN;
  const dNHO = num(dose_nho01) > 0 ? (num(dose_nho01) / 100) * f : NaN;
  return montarRuido(dNR, dNHO, tj);
}

function montarRuido(doseNR, doseNHO, te) {
  const out = { tempo_min: r1(te) };
  if (doseNR > 0) {
    // Nível equivalente na jornada (NR-15): 85 + 16,61·log10(D·480/Te) ; normalizado para 8 h: 85 + 16,61·log10(D)
    out.nr15 = {
      dose_pct: r1(doseNR * 100),
      ne: r1(85 + 16.61 * log10((doseNR * 480) / te)),
      ne_8h: r1(85 + 16.61 * log10(doseNR)),
      excede: doseNR > 1,
      acao: doseNR >= 0.5,
    };
  }
  if (doseNHO > 0) {
    // NHO-01: NE na jornada e NEN (normalizado 8 h) = NE + 10·log10(Te/480)
    const ne = 85 + (3 / log10(2)) * log10((doseNHO * 480) / te);
    out.nho01 = {
      dose_pct: r1(doseNHO * 100),
      ne: r1(ne),
      nen: r1(ne + 10 * log10(te / 480)),
      excede: doseNHO > 1,
      acao: doseNHO >= 0.5,
    };
  }
  const ex = out.nr15?.excede || out.nho01?.excede;
  const ac = out.nr15?.acao || out.nho01?.acao;
  // A insalubridade é caracterizada pelo critério da NR-15; a NHO-01 (mais restritiva) orienta prevenção e aposentadoria especial
  out.conclusao = out.nr15?.excede
    ? "Acima do limite da NR-15 (dose > 100%) — caracteriza insalubridade grau médio (Anexo 1) e exige controle imediato."
    : out.nho01?.excede
      ? "Acima do limite da NHO-01 (NEN > 85 dB(A)) — exige medidas de controle e deve ser avaliado para aposentadoria especial (LTCAT); pelo critério da NR-15 não caracteriza insalubridade."
      : ac
        ? "Acima do nível de ação (dose ≥ 50%) — incluir no PCA (audiometrias, NR-7 Anexo II) e em medidas preventivas."
        : "Abaixo do nível de ação.";
  out.valor = out.nho01?.nen ?? out.nr15?.ne_8h;
  out.unidade = "dB(A)";
  out.limite = "85 dB(A) / dose 100%";
  out.insalubre = !!out.nr15?.excede;
  // Usados pelas cores da lista de medições (vermelho = acima do limite, amarelo = nível de ação)
  out.excede = !!ex;
  out.acao = !!ac;
  return out;
}

// Ruído de impacto (NR-15 Anexo 2): LT 130 dB (linear) ou 120 dB(C) em resposta rápida
export function ruidoImpacto({ pico, escala, criterio, impactos }) {
  const v = num(pico);
  if (!(v > 0)) return null;
  if (criterio === "nho01") {
    // NHO-01: nível de pico máximo admissível Np = 160 − 10·log(n), n = nº de impactos na jornada
    const n = num(impactos);
    if (!(n > 0)) return { valor: v, unidade: "dB(lin)", limite: "informe o nº de impactos na jornada", excede: false, insalubre: false, conclusao: "Informe o número de impactos por jornada para aplicar a NHO-01." };
    if (n > 10000) return { valor: v, unidade: "dB(lin)", limite: "—", excede: false, insalubre: false, conclusao: "Mais de 10.000 impactos por jornada: avaliar como ruído contínuo/intermitente (NHO-01)." };
    const np = r1(160 - 10 * log10(n));
    return {
      valor: v, unidade: "dB(lin)", limite: `${np} dB(lin) (Np para ${n} impactos)`, excede: v > np, acao: v > np, insalubre: false,
      conclusao: v > np ? "Acima do nível de pico admissível da NHO-01 — medidas de controle. A insalubridade segue a NR-15 Anexo 2." : "Dentro do critério da NHO-01.",
    };
  }
  const lim = escala === "C" ? 120 : 130;
  return {
    valor: v, unidade: escala === "C" ? "dB(C)" : "dB(lin)", limite: `${lim} ${escala === "C" ? "dB(C)" : "dB(lin)"}`,
    excede: v > lim, insalubre: v > lim,
    conclusao: v > lim ? "Acima do limite — insalubridade grau médio (NR-15 Anexo 2)." : "Dentro do limite de tolerância.",
  };
}

// ===================== CALOR (NR-15 Anexo 3 / NHO-06) =====================
// IBUTG sem carga solar: 0,7·tbn + 0,3·tg ; com carga solar: 0,7·tbn + 0,1·tbs + 0,2·tg
export function ibutg({ tbn, tg, tbs, solar }) {
  const n = num(tbn), g = num(tg), s = num(tbs);
  if (isNaN(n) || isNaN(g)) return NaN;
  return solar ? 0.7 * n + 0.1 * s + 0.2 * g : 0.7 * n + 0.3 * g;
}

// Limite de exposição e nível de ação em função da taxa metabólica M (W) — NHO-06 / Anexo 3 (Quadros 1 e 2)
export const limiteCalor = (m) => 56.7 - 11.5 * log10(m);
export const acaoCalor = (m) => 59.9 - 14.1 * log10(m);

// ciclos: [{ tbn, tg, tbs, solar, m (W), minutos }] cobrindo os 60 min mais desfavoráveis
// Quadro 4 do Anexo III da NR-09 — incremento no IBUTG médio por vestimenta (+1 °C com capuz)
export const VESTIMENTAS_CALOR = {
  uniforme: { nome: "Uniforme de trabalho (calça e camisa de manga comprida)", ajuste: 0 },
  macacao_tecido: { nome: "Macacão de tecido", ajuste: 0 },
  sms: { nome: "Macacão de polipropileno SMS", ajuste: 0.5 },
  poliolefina: { nome: "Macacão de poliolefina", ajuste: 2 },
  forrado: { nome: "Vestimenta ou macacão forrado (tecido duplo)", ajuste: 3 },
  avental_impermeavel: { nome: "Avental longo de manga comprida impermeável ao vapor", ajuste: 4 },
  macacao_impermeavel: { nome: "Macacão impermeável ao vapor", ajuste: 10 },
  impermeavel_sobreposto: { nome: "Macacão impermeável ao vapor sobreposto à roupa de trabalho", ajuste: 12 },
};

// Quadro 3 do Anexo III da NR-09 = Quadro 2 do Anexo 3 da NR-15 — taxa metabólica (W)
const _tm = (grupo, lista) => lista.map(([atividade, m]) => ({ grupo, atividade, m }));
export const TAXAS_METABOLICAS = [
  ..._tm("Sentado", [["Em repouso", 100], ["Trabalho leve com as mãos", 126], ["Trabalho moderado com as mãos", 153], ["Trabalho pesado com as mãos", 171], ["Trabalho leve com um braço", 162], ["Trabalho moderado com um braço", 198], ["Trabalho pesado com um braço", 234], ["Trabalho leve com dois braços", 216], ["Trabalho moderado com dois braços", 252], ["Trabalho pesado com dois braços", 288], ["Trabalho leve com braços e pernas", 324], ["Trabalho moderado com braços e pernas", 441], ["Trabalho pesado com braços e pernas", 603]]),
  ..._tm("Em pé, agachado ou ajoelhado", [["Em repouso", 126], ["Trabalho leve com as mãos", 153], ["Trabalho moderado com as mãos", 180], ["Trabalho pesado com as mãos", 198], ["Trabalho leve com um braço", 189], ["Trabalho moderado com um braço", 225], ["Trabalho pesado com um braço", 261], ["Trabalho leve com dois braços", 243], ["Trabalho moderado com dois braços", 279], ["Trabalho pesado com dois braços", 315], ["Trabalho leve com o corpo", 351], ["Trabalho moderado com o corpo", 468], ["Trabalho pesado com o corpo", 630]]),
  ..._tm("Em pé, em movimento", [["Andando no plano, sem carga, 2 km/h", 198], ["Andando no plano, sem carga, 3 km/h", 252], ["Andando no plano, sem carga, 4 km/h", 297], ["Andando no plano, sem carga, 5 km/h", 360], ["Andando no plano, 10 kg, 4 km/h", 333], ["Andando no plano, 30 kg, 4 km/h", 450], ["Correndo no plano, 9 km/h", 787], ["Correndo no plano, 12 km/h", 873], ["Correndo no plano, 15 km/h", 990],
    ["Subindo rampa sem carga, 5°, 4 km/h", 324], ["Subindo rampa sem carga, 15°, 3 km/h", 378], ["Subindo rampa sem carga, 25°, 3 km/h", 540], ["Subindo rampa com 20 kg, 15°, 4 km/h", 486], ["Subindo rampa com 20 kg, 25°, 4 km/h", 738],
    ["Descendo rampa sem carga, 5°, 5 km/h", 243], ["Descendo rampa sem carga, 15°, 5 km/h", 252], ["Descendo rampa sem carga, 25°, 5 km/h", 324],
    ["Subindo escada (80 degraus/min) sem carga", 522], ["Subindo escada (80 degraus/min) com 20 kg", 648], ["Descendo escada (80 degraus/min) sem carga", 279], ["Descendo escada (80 degraus/min) com 20 kg", 400],
    ["Trabalho moderado de braços (ex.: varrer, almoxarifado)", 320], ["Trabalho moderado de levantar ou empurrar", 349], ["Empurrar carrinho de mão com carga, no plano", 391], ["Carregar pesos ou movimentos vigorosos com os braços (ex.: foice)", 495], ["Trabalho pesado de levantar, empurrar ou arrastar (ex.: pá, valas)", 524]]),
];

// NR-09 Anexo III (Portaria MTE 105/2026) + NR-15 Anexo 3:
// - Quadro 2 da NR-09 = Quadro 1 da NR-15: limite para ACLIMATIZADOS → critério de insalubridade
// - Quadro 1 da NR-09: nível de ação para aclimatizados E limite para NÃO aclimatizados (alteração de 2026)
// - Insalubridade por calor não se aplica a céu aberto sem fonte artificial (NR-15 Anexo 3, 1.1.1)
// As fórmulas reproduzem os 91 pontos do Quadro 1 da NR-15 e o Quadro 1 da NR-09 (arredondamento a 0,1 °C).
export function calor(ciclos, opcoes = {}) {
  const o = typeof opcoes === "object" && opcoes !== null ? opcoes : { ajuste: opcoes };
  const todos = ciclos.map((x) => ({ i: ibutg(x), m: num(x.m), t: num(x.minutos) }));
  const c = todos.filter((x) => !isNaN(x.i) && x.m > 0 && x.t > 0);
  if (!c.length) return null;
  const ignorados = todos.length - c.length;
  const tt = c.reduce((s, x) => s + x.t, 0);
  const ibMedido = c.reduce((s, x) => s + x.i * x.t, 0) / tt;
  const vest = o.vestimenta && VESTIMENTAS_CALOR[o.vestimenta] ? VESTIMENTAS_CALOR[o.vestimenta].ajuste : 0;
  const ajuste = vest + (o.capuz ? 1 : 0) + (num(o.ajuste) || 0);
  const ib = r1(ibMedido + ajuste);
  const mMed = c.reduce((s, x) => s + x.m * x.t, 0) / tt;
  const aclim = o.aclimatizado !== false;
  const ceuAberto = o.ambiente === "ceu_aberto_sem_fonte";
  const leAclim = r1(limiteCalor(mMed));
  const q1 = r1(acaoCalor(mMed));
  const limitePrev = aclim ? leAclim : q1;
  const excede = ib > limitePrev;
  const acao = aclim ? ib > q1 : excede;
  const insalubre = !ceuAberto && ib > leAclim;

  const avisos = [];
  if (mMed < 100 || mMed > 606) avisos.push("Taxa metabólica fora da faixa dos quadros (100 a 606 W): limite extrapolado pela fórmula — justifique tecnicamente.");
  if (ceuAberto) avisos.push("Céu aberto sem fonte artificial: o Anexo 3 da NR-15 não se aplica (sem insalubridade por calor), mas as medidas da NR-09 continuam obrigatórias. O IBUTG pode ser estimado pela ferramenta da Fundacentro (NR-09 Anexo III, 3.3.2).");
  if (!aclim) avisos.push("Trabalhador não aclimatizado: limite do Quadro 1 da NR-09 (Portaria MTE 105/2026). Preveja plano de aclimatização no PCMSO.");

  const medidas = [];
  if (acao || excede) {
    medidas.push(["Disponibilizar água fresca potável e incentivar a ingestão (NR-09 Anexo III, 4.1.1 a)", "coletiva"]);
    medidas.push(["Programar trabalhos acima de 414 W nos períodos termicamente mais amenos (NR-09 Anexo III, 4.1.1 b)", "administrativa"]);
    if (!ceuAberto) medidas.push(["Fornecer vestimentas de trabalho adaptadas à exposição ao calor (NR-09 Anexo III, 4.1.2)", "individual"]);
    medidas.push(["Prever aclimatização no PCMSO e procedimento de emergência para o calor (NR-09 Anexo III, itens 5 e 6)", "administrativa"]);
    medidas.push(["Orientar sobre riscos, sinais e sintomas do calor; treinamento anual quando indicado (NR-09 Anexo III, 3.1.1 e 3.1.2)", "administrativa"]);
  }
  if (excede) {
    medidas.push(["Adequar processos e rotinas, alternar operações e garantir locais mais amenos para pausas (NR-09 Anexo III, 4.2.2)", "administrativa"]);
    if (!ceuAberto) medidas.push(["Adaptar postos, reduzir temperatura/emissividade das fontes, barreiras ao calor radiante e ventilação (NR-09 Anexo III, 4.2.2.1)", "coletiva"]);
    medidas.push(["Incluir no PCMSO avaliações, exames complementares e monitoramento fisiológico (NR-09 Anexo III, 4.2.3)", "administrativa"]);
  }

  return {
    ibutg_medido: r1(ibMedido), ajuste_vestimenta: ajuste, ibutg_medio: ib, m_medio: Math.round(mMed), tempo_min: tt,
    aclimatizado: aclim, ambiente: ceuAberto ? "ceu_aberto_sem_fonte" : "fechado_ou_fonte_artificial",
    nivel_acao: aclim ? q1 : null, limite_nr15: leAclim, avisos, medidas,
    aviso_dados: ignorados ? `${ignorados} ciclo(s) ignorado(s) por dados incompletos (confira tbn, tg, M, minutos e tbs com carga solar).` : "",
    aviso_tempo: tt !== 60 ? "A NHO-06 avalia os 60 minutos corridos mais desfavoráveis; a soma dos períodos deveria ser 60 min." : "",
    excede, acao, insalubre,
    valor: ib, unidade: "°C IBUTG", limite: `${limitePrev} °C IBUTG${aclim ? "" : " (não aclimatizado)"}`, limite_valor: limitePrev,
    conclusao: insalubre
      ? "Acima do limite do Quadro 1 da NR-15 em ambiente fechado/com fonte artificial — insalubridade grau médio (NR-15 Anexo 3); adotar as medidas corretivas da NR-09 Anexo III."
      : excede
        ? (ceuAberto ? "Acima do limite de exposição a céu aberto — medidas corretivas obrigatórias (NR-09 Anexo III); não caracteriza insalubridade pelo Anexo 3 da NR-15." : "Acima do limite para trabalhador não aclimatizado — medidas corretivas e plano de aclimatização (NR-09 Anexo III); pelo critério da NR-15 não caracteriza insalubridade.")
        : acao ? "Acima do nível de ação — medidas preventivas (hidratação, tarefas pesadas em horários amenos, aclimatização, PCMSO)." : "Abaixo do nível de ação.",
  };
}

// ===================== FRIO (NR-15 Anexo 9 + CLT art. 253) =====================
// Ambiente artificialmente frio: < 15 °C (zonas 1–3), < 12 °C (zona 4), < 10 °C (zonas 5–7) — mapa oficial de zonas climáticas
export function frio({ temperatura, zona, vento_kmh, camara }) {
  const t = num(temperatura);
  if (isNaN(t)) return null;
  const z = Number(zona) || 4;
  const lim = z <= 3 ? 15 : z === 4 ? 12 : 10;
  const frioArt = t < lim;
  const v = num(vento_kmh);
  const wct = v >= 4.8 && t <= 10 ? r1(13.12 + 0.6215 * t - 11.37 * Math.pow(v, 0.16) + 0.3965 * t * Math.pow(v, 0.16)) : null;
  const insalubre = !!camara || frioArt;
  return {
    valor: t, unidade: "°C", limite: `${lim} °C (zona ${z})`, wct,
    frio_artificial: frioArt, insalubre, excede: frioArt,
    conclusao: (frioArt || camara)
      ? "Ambiente frio: insalubridade grau médio por avaliação qualitativa (NR-15 Anexo 9) se não houver proteção adequada; pausa de 20 min a cada 1h40 trabalhada (CLT art. 253)."
      : "Temperatura acima do limite de ambiente artificialmente frio para a zona.",
  };
}

// ===================== ILUMINAÇÃO (NR-17 + NBR ISO/CIE 8995-1) =====================
// NHO 11 (Fundacentro, 2018) — exigida pela NR-17. Quadro 1 (amostra dos ambientes mais usados; E em lux, IRC mínimo)
export const AMBIENTES_NHO11 = [
  ["Áreas gerais", "Área de circulação e corredor", 100, 40], ["Áreas gerais", "Escada, escada rolante e esteira", 150, 40], ["Áreas gerais", "Rampa de carregamento", 150, 40],
  ["Áreas gerais", "Refeitório e cantina", 200, 80], ["Áreas gerais", "Sala de descanso", 100, 80], ["Áreas gerais", "Vestiário, banheiro e toalete", 200, 80],
  ["Áreas gerais", "Enfermaria", 500, 80], ["Áreas gerais", "Sala para atendimento médico", 500, 90], ["Áreas gerais", "Depósito, estoque e câmara fria", 100, 60],
  ["Áreas gerais", "Depósito/estoque continuamente ocupado", 200, 60], ["Áreas gerais", "Expedição", 300, 60], ["Áreas gerais", "Estação de controle", 150, 60],
  ["Escritórios", "Arquivamento, cópia, circulação", 300, 80], ["Escritórios", "Escrever, teclar, ler e processar dados", 500, 80], ["Escritórios", "Desenho técnico", 750, 80],
  ["Escritórios", "Sala de reunião e conferência", 500, 80], ["Escritórios", "Recepção", 300, 80], ["Escritórios", "Arquivo", 200, 80],
  ["Metal", "Forjamento de molde aberto", 200, 60], ["Metal", "Forjamento, soldagem e moldagem a frio", 300, 60], ["Metal", "Usinagem grosseira e média (> 0,1 mm)", 300, 60],
  ["Metal", "Usinagem de precisão: retificação", 500, 60], ["Metal", "Trabalho em folha de metal < 5 mm", 300, 60], ["Metal", "Usinagem de placa ≥ 5 mm", 200, 60],
  ["Metal", "Ferramentaria e equipamentos de corte", 750, 60], ["Metal", "Montagem bruta", 200, 80], ["Metal", "Montagem média", 300, 80], ["Metal", "Montagem fina", 500, 80],
  ["Metal", "Montagem de precisão", 750, 80], ["Metal", "Galvanoplastia", 300, 80], ["Metal", "Pintura e preparação de superfícies", 750, 80],
  ["Metal", "Mecânica de precisão e micromecânica", 1000, 80],
  ["Alimentos", "Cervejaria, lavagem, limpeza, conservas, açúcar", 200, 80], ["Alimentos", "Triagem e lavagem, moagem, mistura e embalagem", 300, 80],
  ["Alimentos", "Abatedouros, açougues, leiteiras, refinarias de açúcar", 500, 80], ["Alimentos", "Corte e triagem de frutas e vegetais", 300, 80],
  ["Alimentos", "Alimentos finos e cozinha", 500, 80], ["Alimentos", "Laboratórios", 500, 80],
  ["Química/plástico", "Processamento operado remotamente", 50, 20], ["Química/plástico", "Processamento com intervenção manual limitada", 150, 40],
  ["Química/plástico", "Processamento com trabalho manual constante", 300, 80], ["Química/plástico", "Metrologia e laboratórios", 500, 80],
  ["Construção/cimento", "Preparação de materiais, fornos e misturadores", 200, 40], ["Construção/cimento", "Trabalhos em máquinas em geral", 300, 80],
  ["Elétrica", "Montagem média (quadros de distribuição)", 500, 80], ["Elétrica", "Oficina eletrônica, ensaio e ajuste", 1500, 80],
  ["Marcenaria", "Sistema de serras", 300, 60], ["Marcenaria", "Bancada de carpintaria, colagem e montagem", 300, 80], ["Marcenaria", "Máquinas de marcenaria", 500, 80],
  ["Têxtil", "Fiação, bobinar, tecer, malha", 500, 80], ["Têxtil", "Costura e trabalho fino em malha", 750, 90],
  ["Veículos", "Chassi e montagem", 500, 80], ["Veículos", "Pintura e câmara de pulverização", 750, 80],
  ["Subestações", "Sala de máquinas", 200, 80], ["Subestações", "Sala de controle", 500, 80],
  ["Varejo", "Área de vendas grande", 500, 80], ["Varejo", "Área da caixa registradora", 500, 80],
  ["Saúde", "Sala de exames geral", 500, 90], ["Saúde", "Exame e tratamento", 1000, 90], ["Saúde", "Sala de esterilização", 300, 80],
  ["Restaurantes", "Cozinha", 500, 80], ["Educação", "Sala de aula", 300, 80],
].map(([grupo, nome, e, irc]) => ({ grupo, nome, e, irc }));
export const ESCALA_ILUMINANCIA = [20, 30, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000];
const ajustarEscala = (e, passos) => {
  if (!passos) return e;
  let i = ESCALA_ILUMINANCIA.findIndex((x) => x >= e);
  if (i < 0) i = ESCALA_ILUMINANCIA.length - 1;
  return ESCALA_ILUMINANCIA[Math.max(0, Math.min(ESCALA_ILUMINANCIA.length - 1, i + passos))];
};
// Anexo 1 da NHO 11 — iluminância média (IM). Malha regular (≥ 2 fileiras) conferida com o exemplo do Anexo 4 (494,2 lux)
export function iluminanciaMedia({ modo, R, Q, T, P, N, M, pontos }) {
  const v = (x) => num(x);
  if (modo === "malha") {
    const n = Math.max(1, Math.floor(v(N))), m = Math.max(1, Math.floor(v(M)));
    if (m >= 2) return (v(R) * (n - 1) * (m - 1) + v(Q) * (n - 1) + v(T) * (m - 1) + v(P)) / (n * m);
    return (v(Q) * (n - 1) + v(P)) / n; // linha única de luminárias
  }
  if (modo === "central") return v(P);
  const p = (pontos || []).map(num).filter((x) => x >= 0);
  return p.length ? p.reduce((a, b) => a + b, 0) / p.length : NaN;
}
const ENTORNO = (e) => (e >= 750 ? 500 : e >= 500 ? 300 : e >= 300 ? 200 : e);
export function iluminacao(p) {
  const tarefa = (p.pontos_tarefa || p.pontos || []).map(num).filter((x) => x >= 0);
  if (!tarefa.length) return null;
  const amb = p.ambiente_idx !== undefined && p.ambiente_idx !== "" ? AMBIENTES_NHO11[Number(p.ambiente_idx)] : null;
  const eBase = amb ? amb.e : num(p.requerido);
  const E = eBase > 0 ? ajustarEscala(eBase, Number(p.ajuste_escala) || 0) : NaN;
  let IM = iluminanciaMedia({ modo: p.im_modo, R: p.R, Q: p.Q, T: p.T, P: p.P, N: p.N, M: p.M, pontos: p.pontos_gerais });
  if (!(IM > 0)) IM = tarefa.reduce((a, b) => a + b, 0) / tarefa.length;
  const minT = Math.min(...tarefa), maxT = Math.max(...tarefa);
  const exig = Math.max(E > 0 ? 0.9 * E : 0, 0.7 * IM, p.continua ? 200 : 0);
  const verif = [];
  if (E > 0) verif.push({ ok: minT >= 0.9 * E, texto: `Pontos da tarefa ≥ E ${E} lux com tolerância de 10% (${Math.round(0.9 * E)} lux)` });
  else verif.push({ ok: false, texto: "Escolha o ambiente/tarefa (Quadro 1 da NHO 11) ou informe E" });
  verif.push({ ok: minT >= 0.7 * IM, texto: `Pontos da tarefa ≥ 70% da iluminância média (${Math.round(0.7 * IM)} lux)` });
  if (p.continua) verif.push({ ok: minT >= 200, texto: "Tarefa contínua: mínimo de 200 lux" });
  if (maxT <= 2500) verif.push({ ok: maxT / IM <= 5, texto: `Razão maior valor / média ≤ 5:1 (${r2(maxT / IM)}:1)` });
  const irc = num(p.irc_medido);
  if (irc > 0 && amb) verif.push({ ok: irc >= amb.irc, texto: `IRC da lâmpada ≥ ${amb.irc} (medido/informado ${irc})` });
  const ent = num(p.entorno);
  if (ent > 0 && E > 0) verif.push({ ok: ent >= ENTORNO(E), texto: `Entorno imediato ≥ ${ENTORNO(E)} lux (medido ${ent})` });
  const falhas = verif.filter((x) => !x.ok);
  return {
    valor: Math.round(minT), unidade: "lux (menor ponto da tarefa)", limite: `${Math.round(exig)} lux (exigido no ponto)`,
    iluminancia_media: Math.round(IM), minimo: Math.round(minT), maximo: Math.round(maxT), uniformidade: r2(minT / IM), e_requerido: E || null,
    irc_minimo: amb?.irc ?? null, verificacoes: verif, excede: falhas.length > 0, acao: false, insalubre: false,
    conclusao: falhas.length ? `Não conforme com a NHO 11 em ${falhas.length} critério(s) — adequar o sistema de iluminação (NR-17). Iluminação não gera insalubridade.` : "Conforme com os critérios da NHO 11 (NR-17).",
  };
}

// ===================== POEIRA DE SÍLICA (NR-15 Anexo 12; coleta NHO 08, gravimetria NHO 03) =====================
// LT poeira respirável = 8 / (%quartzo + 2) mg/m³ ; LT poeira total = 24 / (%quartzo + 3) mg/m³
export function poeiraSilica({ amostras, quartzo, fracao }) {
  const a = (amostras || []).map((x) => ({ c: num(x.concentracao), t: num(x.minutos) })).filter((x) => x.c >= 0 && x.t > 0);
  const q = num(quartzo);
  if (!a.length || !(q >= 0)) return null;
  const tt = a.reduce((s2, x) => s2 + x.t, 0);
  const media = a.reduce((s2, x) => s2 + x.c * x.t, 0) / tt;
  const resp = fracao !== "total";
  const lt = resp ? 8 / (q + 2) : 24 / (q + 3);
  const excede = media > lt;
  return {
    valor: r2(media), unidade: "mg/m³", limite: `${r2(lt)} mg/m³ (poeira ${resp ? "respirável" : "total"}, ${q}% de quartzo)`, limite_valor: r2(lt),
    indice: r2(media / lt), excede, acao: media / lt >= 0.5, insalubre: excede,
    conclusao: excede ? "Acima do limite de tolerância — insalubridade grau máximo (NR-15 Anexo 12) e medidas de controle imediatas." : media / lt >= 0.5 ? "Acima do nível de ação (50% do LT, NR-09 9.6.1) — medidas preventivas e monitoramento." : "Abaixo do nível de ação.",
  };
}

// ===================== VIBRAÇÃO (NR-15 Anexo 8 / NR-9 Anexo 1 / NHO-09 e NHO-10) =====================
// segmentos: [{ aceleracao (m/s²), horas }] ; aren = √(Σ ai²·Ti / 8h)
export function vibracao({ segmentos, tipo, vdvr }) {
  const s = (segmentos || []).map((x) => ({ a: num(x.aceleracao), h: num(x.horas) })).filter((x) => x.a >= 0 && x.h > 0);
  if (!s.length && !(num(vdvr) > 0)) return null;
  const aren = s.length ? Math.sqrt(s.reduce((t, x) => t + x.a * x.a * x.h, 0) / 8) : NaN;
  const vci = tipo === "vci";
  const le = vci ? 1.1 : 5.0;
  const na = vci ? 0.5 : 2.5;
  const v = num(vdvr);
  const excedeVdv = vci && v > 21.0;
  const excede = aren > le || excedeVdv;
  return {
    valor: isNaN(aren) ? null : r2(aren), unidade: "m/s² (aren)", limite: `${le} m/s²${vci ? " ou VDVR 21,0 m/s^1,75" : ""}`,
    nivel_acao: vci ? "0,5 m/s² ou VDVR 9,1 m/s^1,75" : "2,5 m/s²",
    excede, acao: aren > na || (vci && v > 9.1), insalubre: excede,
    aviso_dados: vci && (isNaN(aren) || !(v > 0)) ? "Corpo inteiro: a NR-09 (Anexo I, 5.3.3.1) exige comprovar a avaliação dos DOIS parâmetros — aren e VDVR." : "",
    conclusao: excede ? "Acima do limite de exposição — insalubridade grau médio (NR-15 Anexo 8)."
      : (aren > na || (vci && v > 9.1)) ? "Acima do nível de ação — medidas preventivas (NR-9 Anexo 1)." : "Abaixo do nível de ação.",
  };
}

// ===================== AGENTES QUÍMICOS (NR-15 Anexo 11) =====================
// Fator de desvio (valor máximo = LT × FD)
export function fatorDesvio(lt) {
  if (lt <= 1) return 3;
  if (lt <= 10) return 2;
  if (lt <= 100) return 1.5;
  if (lt <= 1000) return 1.25;
  return 1.1;
}

// amostras: [{ concentracao, minutos }] ; lt ; horasJornadaDiaria (correção Brief & Scala opcional)
export function quimico({ amostras, lt, unidade, horas_dia, brief_scala }) {
  const a = (amostras || []).map((x) => ({ c: num(x.concentracao), t: num(x.minutos) })).filter((x) => x.c >= 0 && x.t > 0);
  const L = num(lt);
  if (!a.length || !(L > 0)) return null;
  const tt = a.reduce((s, x) => s + x.t, 0);
  const media = a.reduce((s, x) => s + x.c * x.t, 0) / tt;
  const maximo = Math.max(...a.map((x) => x.c));
  const h = num(horas_dia);
  let ltAj = L;
  let fr = 1;
  if (brief_scala && h > 8) { fr = (8 / h) * ((24 - h) / 16); ltAj = L * fr; }
  const vm = L * fatorDesvio(L);
  const excede = media > ltAj || maximo > vm;
  return {
    valor: r2(media), unidade: unidade || "ppm", limite: `${r2(ltAj)} ${unidade || "ppm"}${fr !== 1 ? ` (LT corrigido, FR ${r2(fr)})` : ""}`,
    valor_maximo_permitido: r2(vm), maior_amostra: r2(maximo), indice: r2(media / ltAj),
    excede, acao: media / ltAj >= 0.5, insalubre: excede,
    conclusao: excede
      ? (maximo > vm ? "Valor máximo (LT × fator de desvio) ultrapassado — situação de risco grave e iminente; " : "") + "concentração acima do limite — insalubridade no grau do agente (NR-15 Anexo 11)."
      : media / ltAj >= 0.5 ? "Acima do nível de ação (50% do LT) — monitoramento e medidas preventivas." : "Abaixo do nível de ação.",
  };
}

// Mistura de agentes com efeitos aditivos: Σ Ci/LTi > 1 excede
export function misturaQuimica(itens) {
  const s = (itens || []).map((x) => num(x.concentracao) / num(x.lt)).filter((x) => isFinite(x));
  if (!s.length) return null;
  const soma = s.reduce((a, b) => a + b, 0);
  return { indice: r2(soma), excede: soma > 1, conclusao: soma > 1 ? "Mistura acima do limite (Σ C/LT > 1)." : "Mistura dentro do limite (Σ C/LT ≤ 1)." };
}

// Critério de avaliação por agente: a NR define a obrigação legal (insalubridade/prevenção) e a NHO o método e o critério técnico
export const CRITERIOS = {
  ruido: { opcoes: { ambos: "NR-15 (q=5) e NHO-01 (q=3) — recomendado", nr15: "NR-15 Anexo 1 (q=5) — insalubridade", nho01: "NHO-01 (q=3) — prevenção (NR-09) e aposentadoria especial" }, padrao: "ambos",
    refs: "Insalubridade: NR-15 Anexo 1. Prevenção: NR-09 (nível de ação = 50% da dose). Método e critério técnico: NHO-01 (Fundacentro) — também é o critério da Previdência para aposentadoria especial (NEN)." },
  ruido_impacto: { opcoes: { nr15: "NR-15 Anexo 2 (130 dB lin / 120 dB C)", nho01: "NHO-01 (Np = 160 − 10·log n)" }, padrao: "nr15",
    refs: "Insalubridade: NR-15 Anexo 2. Critério técnico de prevenção: NHO-01 (nível de pico admissível em função do número de impactos)." },
  calor: { opcoes: { nr_nho06: "NR-15 Anexo 3 + NR-09 Anexo III — método NHO 06" }, padrao: "nr_nho06",
    refs: "Insalubridade: NR-15 Anexo 3 (Quadro 1). Prevenção: NR-09 Anexo III (Portaria MTE 105/2026). Método: NHO 06 (3ª edição, 2025), incluindo o Monitor IBUTG para áreas rurais a céu aberto." },
  frio: { opcoes: { nr15: "NR-15 Anexo 9 (qualitativo) + CLT art. 253" }, padrao: "nr15", refs: "Não há NHO para frio; avaliação qualitativa da NR-15 Anexo 9 e regime de pausas do art. 253 da CLT." },
  iluminacao: { opcoes: { nho11: "NR-17 — NHO 11 (2018)" }, padrao: "nho11", refs: "A NR-17 exige os níveis da NHO 11: E do Quadro 1 com 10% de tolerância, ponto a ponto ≥ 70% da média, mínimo de 200 lux em tarefa contínua, razão máx./média ≤ 5:1." },
  vibracao: { opcoes: { nr_nho: "NR-09 Anexo I + NR-15 Anexo 8 — métodos NHO 09 (VCI) e NHO 10 (VMB)" }, padrao: "nr_nho", refs: "Limites e níveis de ação: NR-09 Anexo I. Insalubridade: NR-15 Anexo 8. Procedimento de medição: NHO 09 (corpo inteiro) e NHO 10 (mãos e braços)." },
  quimico: { opcoes: { nr15: "NR-15 Anexo 11 — insalubridade e prevenção", acgih: "ACGIH (TLV) — só prevenção, quando a NR-15 não tem limite (NR-09 9.6.1.1)" }, padrao: "nr15",
    refs: "Insalubridade: NR-15 Anexo 11 (LT e valor máximo). Na falta de limite na NR-15, a NR-09 (9.6.1.1) manda usar a ACGIH para prevenção. Coleta: NHO 08 (particulados); calibração de bombas: NHO 07." },
  poeira: { opcoes: { nr15: "NR-15 Anexo 12 (sílica livre cristalizada)" }, padrao: "nr15", refs: "Limite: NR-15 Anexo 12 (fórmulas pelo % de quartzo). Coleta: NHO 08; análise gravimétrica: NHO 03; calibração de bombas: NHO 07." },
};

export const TIPOS_MEDICAO = {
  ruido: { label: "Ruído contínuo/intermitente", risco: "fisico", norma: "NR-15 Anexo 1 / NHO-01", equip: ["dosimetro", "decibelimetro"] },
  ruido_impacto: { label: "Ruído de impacto", risco: "fisico", norma: "NR-15 Anexo 2 / NHO-01", equip: ["decibelimetro"] },
  calor: { label: "Calor (IBUTG)", risco: "fisico", norma: "NR-15 Anexo 3 / NR-09 Anexo III / NHO 06", equip: ["termometro_ibutg"] },
  frio: { label: "Frio", risco: "fisico", norma: "NR-15 Anexo 9 / CLT art. 253", equip: ["termo_higrometro", "anemometro"] },
  iluminacao: { label: "Iluminação", risco: "ergonomico", norma: "NR-17 / NHO 11", equip: ["luximetro"] },
  vibracao: { label: "Vibração (VMB / VCI)", risco: "fisico", norma: "NR-15 Anexo 8 / NHO-09 e NHO-10", equip: ["vibracao"] },
  quimico: { label: "Agente químico", risco: "quimico", norma: "NR-15 Anexo 11 / NHO-08", equip: ["bomba_amostragem", "detector_gases"] },
  poeira: { label: "Poeira de sílica", risco: "quimico", norma: "NR-15 Anexo 12 / NHO-08 e NHO-03", equip: ["bomba_amostragem"] },
};

export const TIPOS_EQUIPAMENTO = {
  dosimetro: "Dosímetro de ruído",
  decibelimetro: "Medidor de nível de pressão sonora (decibelímetro)",
  calibrador_acustico: "Calibrador acústico",
  termometro_ibutg: "Medidor de estresse térmico (IBUTG)",
  termo_higrometro: "Termo-higrômetro",
  anemometro: "Anemômetro",
  luximetro: "Luxímetro",
  vibracao: "Medidor de vibração (acelerômetro)",
  bomba_amostragem: "Bomba de amostragem",
  detector_gases: "Detector de gases",
  outro: "Outro",
};

function aplicarCriterio(tipo, p, r) {
  if (!r) return r;
  const crit = p.criterio || CRITERIOS[tipo]?.padrao;
  const out = { ...r, criterio: crit, criterio_label: CRITERIOS[tipo]?.opcoes?.[crit] || "", referencias: CRITERIOS[tipo]?.refs || "" };
  if (tipo === "ruido") {
    if (crit === "nr15" && r.nr15) {
      Object.assign(out, { valor: r.nr15.ne_8h, excede: !!r.nr15.excede, acao: (r.nr15.dose_pct || 0) >= 50, limite: "85 dB(A) / dose 100% (NR-15)" });
      out.conclusao = r.nr15.excede ? "Acima do limite da NR-15 (dose > 100%) — insalubridade grau médio (Anexo 1)." : out.acao ? "Acima do nível de ação (dose ≥ 50%) — PCA e medidas preventivas." : "Abaixo do nível de ação.";
    } else if (crit === "nho01" && r.nho01) {
      Object.assign(out, { valor: r.nho01.nen, excede: !!r.nho01.excede, acao: (r.nho01.dose_pct || 0) >= 50, limite: "NEN 85 dB(A) / dose 100% (NHO-01)" });
      out.conclusao = (r.nho01.excede ? "Acima do limite da NHO-01 (NEN > 85 dB(A)) — medidas de controle e análise de aposentadoria especial." : out.acao ? "Acima do nível de ação (NHO-01) — PCA e medidas preventivas." : "Abaixo do nível de ação (NHO-01).") + " A insalubridade é sempre definida pela NR-15.";
    }
  }
  if (tipo === "quimico" && crit === "acgih") {
    out.insalubre = false;
    out.limite = String(r.limite || "").replace(/\s*\(LT corrigido.*\)/, "") + " (TLV ACGIH)";
    out.conclusao = (r.excede ? "Acima do TLV da ACGIH" : r.acao ? "Acima do nível de ação (50% do TLV)" : "Abaixo do nível de ação") + " — referência de prevenção (NR-09, 9.6.1.1); não caracteriza insalubridade, que exige limite da NR-15.";
  }
  return out;
}

export function calcular(tipo, p = {}) {
  let r = null;
  switch (tipo) {
    case "ruido": r = p.modo === "dose" ? ruidoPorDose(p) : ruidoPorPeriodos(p.periodos || []); break;
    case "ruido_impacto": r = ruidoImpacto(p); break;
    case "calor": r = calor(p.ciclos || [], { vestimenta: p.vestimenta, capuz: !!p.capuz, ajuste: p.ajuste_vestimenta, aclimatizado: p.aclimatizado !== "nao" && p.aclimatizado !== false, ambiente: p.ambiente }); break;
    case "frio": r = frio(p); break;
    case "iluminacao": r = iluminacao(p); break;
    case "vibracao": r = vibracao(p); break;
    case "quimico": r = quimico({ ...p, brief_scala: p.criterio === "acgih" ? false : p.brief_scala }); break;
    case "poeira": r = poeiraSilica(p); break;
    default: r = null;
  }
  return aplicarCriterio(tipo, p, r);
}
