// Regras de atestados/afastamentos (eSocial S-2230, INSS, NR-7) e ligação com o FAP.
// Funções puras e testadas. Prazos conforme o MOS; o prazo "mês seguinte" usa o dia 7 (conservador).

export const PRAZO_DIA_MES_SEGUINTE = 7;

export const MOTIVOS = {
  doenca: { label: "Doença / acidente não ligado ao trabalho", cod: "03" },
  trabalho: { label: "Acidente ou doença do trabalho", cod: "01" },
  trajeto: { label: "Acidente de trajeto", cod: "01" },
  outro: { label: "Outro", cod: "03" },
};

// Data de hoje no fuso de Cuiabá (evita marcar prazos como atrasados à noite)
export const hojeLocal = (tz = "America/Cuiaba", agora = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);

const D = (s) => new Date(s + "T12:00:00Z");
const S = (d) => d.toISOString().slice(0, 10);
export const addDias = (s, n) => { const d = D(s); d.setUTCDate(d.getUTCDate() + n); return S(d); };
export const diffDias = (a, b) => Math.round((D(a) - D(b)) / 86400000);
export const fimAfastamento = (a) => addDias(a.data_inicio, Math.max(1, Number(a.dias) || 1) - 1);
export const grupoCid = (cid) => String(cid || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
export const dataBR = (s) => (s ? D(s).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—");
const diaMesSeguinte = (s) => { const d = D(s); return S(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, PRAZO_DIA_MES_SEGUINTE, 12))); };
const menor = (a, b) => (!a ? b : !b ? a : a < b ? a : b);

// Grupos de CID com nexo epidemiológico frequente com a atividade (indício, não substitui a Lista C do Anexo II do Decreto 3.048)
const NTEP_FREQUENTE = [/^F/, /^M/, /^G56/, /^H83/, /^H90/, /^H91/, /^J45/, /^L2[345]/, /^I83/, /^S/, /^T/];
export const riscoNtep = (g) => !!g && NTEP_FREQUENTE.some((r) => r.test(g));

// Analisa todos os atestados de uma empresa. Retorna { [id]: análise }
export function analisarAtestados(atestados, hoje = hojeLocal()) {
  const out = {};
  const porTrab = {};
  [...atestados]
    .filter((a) => a.data_inicio && Number(a.dias) > 0)
    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio))
    .forEach((a) => { (porTrab[a.trabalhador_id || a.trabalhador_nome] ||= []).push(a); });

  Object.values(porTrab).forEach((lista) => {
    const cadeias = []; // { grupo, inicio, membros: [] }

    lista.forEach((a) => {
      const g = grupoCid(a.cid);
      const fim = fimAfastamento(a);
      let cadeia = null;
      if (a.mesma_doenca_manual !== "nao") {
        const candidatas = cadeias.filter((c) => diffDias(a.data_inicio, c.inicio) <= 60 && (a.mesma_doenca_manual === "sim" || (g && c.grupo === g)));
        cadeia = candidatas[candidatas.length - 1] || null;
      }
      // Nova licença até 60 dias após o retorno de afastamento anterior da mesma doença que gerou benefício (> 15 dias)
      const aposBeneficio = !!g && cadeias.some((c) => {
        if (c === cadeia || c.grupo !== g) return false;
        const tot = c.membros.reduce((s, m) => s + Number(m.dias), 0);
        const gerou = tot > 15 || c.membros.some((m) => ["b31", "b91"].includes(m.beneficio_inss));
        const ultimoFim = c.membros.map(fimAfastamento).sort().pop();
        const dif = diffDias(a.data_inicio, ultimoFim);
        return gerou && dif > 0 && dif <= 60;
      });
      if (!cadeia) { cadeia = { grupo: g, inicio: a.data_inicio, membros: [] }; cadeias.push(cadeia); }
      cadeia.membros.push(a);
      out[a.id] = { fim, grupo: g, cadeia, aposBeneficio };
    });

    // Consolida cada atestado com os dados finais da cadeia
    lista.forEach((a) => {
      const r = out[a.id];
      const c = r.cadeia;
      const total = c.membros.reduce((s, m) => s + Number(m.dias), 0);
      // data em que a soma chega ao 16º dia
      let data16 = null;
      let acum = 0;
      for (const m of c.membros) {
        const d = Number(m.dias);
        if (acum + d >= 16) { data16 = addDias(m.data_inicio, 16 - acum - 1); break; }
        acum += d;
      }
      const dias = Number(a.dias);
      const trabalho = a.motivo === "trabalho" || a.motivo === "trajeto";
      const primeiro = c.membros[0].id === a.id;
      const alertas = [];
      let obrigatorio = false;
      let prazo = null;

      if (trabalho) { obrigatorio = true; prazo = dias > 15 ? addDias(a.data_inicio, 15) : diaMesSeguinte(a.data_inicio); }
      else if (dias > 15) { obrigatorio = true; prazo = addDias(a.data_inicio, 15); }
      else if (dias >= 3) { obrigatorio = true; prazo = diaMesSeguinte(a.data_inicio); }
      if (total > 15 && c.membros.length > 1 && data16) { obrigatorio = true; prazo = menor(prazo, a.data_inicio > data16 ? a.data_inicio : data16); }
      if (r.aposBeneficio) { obrigatorio = true; prazo = a.data_inicio; alertas.push("Nova licença pela mesma doença até 60 dias após benefício do INSS: enviar no 1º dia."); }
      if (prazo && prazo < a.data_inicio) prazo = a.data_inicio; // evento não pode ser enviado antes do início

      const mesmoMotivo = !primeiro || r.aposBeneficio;
      const inss = total > 15 || dias > 15;
      if (inss) alertas.push(`Encaminhar ao INSS: a empresa paga os 15 primeiros dias; benefício a partir do 16º dia${data16 ? ` (${dataBR(data16)})` : ""}.`);
      if (dias >= 30) alertas.push(`Exame de retorno ao trabalho (NR-7) antes de reassumir, previsto para ${dataBR(addDias(r.fim, 1))}.`);
      if (trabalho && !a.cat_id) alertas.push("Emitir/vincular a CAT (prazo: 1º dia útil após o acidente; óbito: imediato).");
      if (!a.cid && a.motivo === "doenca") alertas.push("Sem CID: o sistema não consegue somar atestados pela mesma doença (regra dos 60 dias).");

      let fap = null;
      if (a.motivo === "trabalho" && inss) fap = { entra: true, texto: "Deve gerar B91 e entrar no FAP (frequência, gravidade 0,10 e custo)." };
      else if (a.motivo === "trajeto") fap = { entra: false, texto: "Acidente de trajeto: excluído do cálculo do FAP (mas exige CAT)." };
      else if (a.motivo !== "trabalho" && inss && riscoNtep(r.grupo)) fap = { entra: false, ntep: true, texto: `CID ${r.grupo} tem nexo epidemiológico frequente: risco de o INSS converter em B91 por NTEP e impactar o FAP. Avalie contestar o nexo.` };

      out[a.id] = {
        fim: r.fim, grupo: r.grupo, cod_motivo: MOTIVOS[a.motivo]?.cod || "03",
        total_mesma_doenca: total, dias_na_cadeia: c.membros.length, data16, mesmo_motivo: mesmoMotivo,
        obrigatorio, prazo, atrasado: obrigatorio && a.esocial_status !== "enviado" && prazo && prazo < hoje,
        inss, retorno_exame: dias >= 30 ? addDias(r.fim, 1) : null, fap, alertas,
        em_curso: a.data_inicio <= hoje && r.fim >= hoje,
      };
    });
  });
  return out;
}

// Indicadores do FAP a partir dos registros do SmartSeg (monitoramento; o FAP oficial depende dos percentis da CNAE)
export function indicadoresFap({ atestados, analise, empresa, numTrabalhadores, hoje = hojeLocal() }) {
  const inicioJanela = addDias(hoje, -730);
  const eventos = atestados.filter((a) => {
    const r = analise[a.id];
    return r && a.data_inicio >= inicioJanela && (r.fap?.entra || a.beneficio_inss === "b91");
  });
  const ntep = atestados.filter((a) => analise[a.id]?.fap?.ntep && a.data_inicio >= inicioJanela);
  const vinc = Number(empresa.vinculos_medios) || numTrabalhadores || 0;
  const fap = Number(empresa.fap) || null;
  const rat = Number(empresa.rat) || null;
  const folha = Number(empresa.folha_mensal) || null;
  const anual = (f) => (folha && rat ? folha * 13.33 * (rat / 100) * f : null); // 12 meses + 13º + 1/3 férias
  return {
    eventos: eventos.length,
    ntep: ntep.length,
    vinculos: vinc,
    freq: vinc ? (eventos.length / vinc) * 1000 : null,
    grav: vinc ? ((eventos.length * 0.1) / vinc) * 1000 : null,
    aliquota_efetiva: fap && rat ? rat * fap : null,
    custo_atual: fap ? anual(fap) : null,
    custo_min: anual(0.5),
    custo_neutro: anual(1),
    custo_max: anual(2),
  };
}
