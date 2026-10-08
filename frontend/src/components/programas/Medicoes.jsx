import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, X, FileCheck2, Upload } from "lucide-react";
import { WORK } from "@/lib/sst";
import { calcular, TIPOS_MEDICAO, TIPOS_EQUIPAMENTO, TAXAS_METABOLICAS, VESTIMENTAS_CALOR, CRITERIOS, AMBIENTES_NHO11 } from "@/lib/calculos";
import { uploadPrivado, linkTemporario } from "@/lib/privateFiles";
import { Botao, Campo, Modal, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";

const hoje = () => new Date().toISOString().slice(0, 10);
const dataBR = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—");

export function statusCalibracao(eq, naData) {
  if (!eq?.validade_calibracao) return { label: "Sem calibração", cor: "#EF4444", ok: false };
  const ref = naData || hoje();
  if (eq.validade_calibracao < ref) return { label: `Vencida em ${dataBR(eq.validade_calibracao)}`, cor: "#EF4444", ok: false };
  const dias = (new Date(eq.validade_calibracao) - new Date(ref)) / 86400000;
  if (dias <= 30) return { label: `Vence em ${Math.ceil(dias)} dia(s)`, cor: "#EAB308", ok: true };
  return { label: `Válida até ${dataBR(eq.validade_calibracao)}`, cor: "#22C55E", ok: true };
}

export const descEquip = (eq) => (eq ? `${TIPOS_EQUIPAMENTO[eq.tipo] || eq.tipo} ${eq.fabricante || ""} ${eq.modelo || ""} nº ${eq.numero_serie || "—"}`.replace(/\s+/g, " ") : "—");

const ANEXO_NR15 = { ruido: "1", ruido_impacto: "2", calor: "3", vibracao: "8", frio: "9", quimico: "11", poeira: "12" };

// ---------- editor de linhas (períodos, ciclos, amostras) ----------
function Linhas({ linhas = [], onChange, colunas, novo }) {
  const st = { background: WORK.bg, borderColor: WORK.border, color: WORK.text };
  const upd = (i, k, v) => onChange(linhas.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  return (
    <div className="space-y-1.5">
      {linhas.map((l, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2">
          {colunas.map((c) => c.tipo === "atividade" ? (
            <label key={c.k} className="text-[11px]" style={{ color: WORK.muted }}>
              {c.label}
              <select className="block w-56 px-2 py-1.5 rounded border text-sm" style={st} value={l.atividade ?? ""}
                onChange={(e) => { const t = TAXAS_METABOLICAS[Number(e.target.value)]; onChange(linhas.map((x, j) => (j === i ? { ...x, atividade: e.target.value, m: t ? String(t.m) : x.m } : x))); }}>
                <option value="">Escolher atividade…</option>
                {["Sentado", "Em pé, agachado ou ajoelhado", "Em pé, em movimento"].map((g) => (
                  <optgroup key={g} label={g}>
                    {TAXAS_METABOLICAS.map((t, k) => (t.grupo === g ? <option key={k} value={k}>{t.atividade} — {t.m} W</option> : null))}
                  </optgroup>
              ))}
              </select>
            </label>
        ) : c.tipo === "checkbox" ? (
            <label key={c.k} className="text-xs flex items-center gap-1 pb-2" style={{ color: WORK.muted }}>
              <input type="checkbox" checked={!!l[c.k]} onChange={(e) => upd(i, c.k, e.target.checked)} /> {c.label}
            </label>
        ) : (
            <label key={c.k} className="text-[11px]" style={{ color: WORK.muted }}>
              {c.label}
              <input type="number" step="any" className="block w-24 px-2 py-1.5 rounded border text-sm" style={st} value={l[c.k] ?? ""} onChange={(e) => upd(i, c.k, e.target.value)} />
            </label>
        ))}
          <button className="pb-2" onClick={() => onChange(linhas.filter((_, j) => j !== i))} style={{ color: WORK.muted }}><X size={14} /></button>
        </div>
    ))}
      <Botao onClick={() => onChange([...linhas, { ...novo }])}><Plus size={13} /> Linha</Botao>
    </div>
);
}

function Criterio({ tipo, p, set }) {
  const c = CRITERIOS[tipo];
  if (!c) return null;
  const opcoes = Object.keys(c.opcoes);
  return (
    <div className="rounded-lg p-2.5 mb-3 text-xs" style={{ background: "#EAF4F8", color: WORK.text }}>
      {opcoes.length > 1
        ? <Campo label="Critério de avaliação (NR × NHO)" tipo="select" opcoes={c.opcoes} valor={p.criterio || c.padrao} onChange={(x) => set({ ...p, criterio: x || c.padrao })} className="max-w-xl mb-1" />
        : <p className="font-semibold mb-1">Critério: {c.opcoes[opcoes[0]]}</p>}
      <p style={{ color: WORK.muted }}>{c.refs}</p>
    </div>
);
}

function Parametros(props) {
  return <><Criterio {...props} /><ParametrosCampos {...props} /></>;
}

function ParametrosCampos({ tipo, p, set }) {
  const v = (k) => p[k];
  const s = (k) => (x) => set({ ...p, [k]: x });
  if (tipo === "ruido") {
    return (
      <div className="space-y-3">
        <Campo label="Forma de entrada" tipo="select" opcoes={{ periodos: "Níveis por período (decibelímetro)", dose: "Dose lida no dosímetro" }} valor={v("modo") || "periodos"} onChange={s("modo")} />
        {(v("modo") || "periodos") === "periodos" ? (
          <Linhas linhas={v("periodos")} onChange={s("periodos")} novo={{ nivel: "", minutos: "" }}
            colunas={[{ k: "nivel", label: "Nível dB(A)" }, { k: "minutos", label: "Minutos" }]} />
      ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Campo label="Dose NR-15 (%) q=5" tipo="number" valor={v("dose_nr15")} onChange={s("dose_nr15")} />
            <Campo label="Dose NHO-01 (%) q=3" tipo="number" valor={v("dose_nho01")} onChange={s("dose_nho01")} />
            <Campo label="Tempo de amostragem (min)" tipo="number" valor={v("minutos_amostra")} onChange={s("minutos_amostra")} />
            <Campo label="Jornada (min)" tipo="number" valor={v("minutos_jornada")} onChange={s("minutos_jornada")} />
          </div>
      )}
        <p className="text-[11px]" style={{ color: WORK.muted }}>Dosímetro: circuito A, resposta lenta, limiar de integração 80 dB(A); NR-15 com q=5 e NHO-01 com q=3.</p>
      </div>
  );
  }
  if (tipo === "ruido_impacto") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Campo label="Nível de pico" tipo="number" valor={v("pico")} onChange={s("pico")} />
        <Campo label="Escala" tipo="select" opcoes={{ L: "Linear (LT 130 dB)", C: "C, resposta rápida (LT 120 dB)" }} valor={v("escala") || "L"} onChange={s("escala")} />
        {v("criterio") === "nho01" && <Campo label="Nº de impactos na jornada (NHO-01)" tipo="number" valor={v("impactos")} onChange={s("impactos")} />}
      </div>
  );
  }
  if (tipo === "calor") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Campo label="Ambiente" tipo="select" opcoes={{ fechado_ou_fonte_artificial: "Fechado ou com fonte artificial de calor", ceu_aberto_sem_fonte: "Céu aberto, sem fonte artificial" }} valor={v("ambiente") || "fechado_ou_fonte_artificial"} onChange={s("ambiente")} />
          <Campo label="Trabalhador aclimatizado?" tipo="select" opcoes={{ sim: "Sim — aclimatizado", nao: "Não aclimatizado (limite mais baixo, NR-09 2026)" }} valor={v("aclimatizado") || "sim"} onChange={s("aclimatizado")} />
          <Campo label="Vestimenta (Quadro 4 — NR-09 Anexo III)" tipo="select" opcoes={Object.fromEntries(Object.entries(VESTIMENTAS_CALOR).map(([k, x]) => [k, `${x.nome} (+${String(x.ajuste).replace(".", ",")} °C)`]))} valor={v("vestimenta") || "uniforme"} onChange={s("vestimenta")} />
          <Campo tipo="checkbox" label="Vestimenta com capuz (+1 °C)" valor={v("capuz")} onChange={s("capuz")} />
        </div>
        <p className="text-[11px]" style={{ color: WORK.muted }}>Informe os ciclos dos 60 minutos mais desfavoráveis. Escolha a atividade para preencher a taxa metabólica (Quadro 3 da NR-09 / Quadro 2 do Anexo 3 da NR-15) ou digite M. tbs só é necessário com carga solar direta.</p>
        <Linhas linhas={v("ciclos")} onChange={s("ciclos")} novo={{ tbn: "", tg: "", tbs: "", solar: false, atividade: "", m: "", minutos: "" }}
          colunas={[{ k: "tbn", label: "tbn °C" }, { k: "tg", label: "tg °C" }, { k: "tbs", label: "tbs °C" }, { k: "solar", label: "carga solar", tipo: "checkbox" }, { k: "atividade", label: "Atividade (taxa metabólica)", tipo: "atividade" }, { k: "m", label: "M (W)" }, { k: "minutos", label: "Minutos" }]} />
        <Campo label="Ajuste adicional (°C), só com justificativa técnica" tipo="number" valor={v("ajuste_vestimenta")} onChange={s("ajuste_vestimenta")} className="max-w-xs" />
      </div>
  );
  }
  if (tipo === "frio") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
        <Campo label="Temperatura (°C)" tipo="number" valor={v("temperatura")} onChange={s("temperatura")} />
        <Campo label="Zona climática (mapa oficial)" tipo="select" opcoes={{ 1: "1ª", 2: "2ª", 3: "3ª", 4: "4ª", 5: "5ª", 6: "6ª", 7: "7ª" }} valor={v("zona") || "4"} onChange={s("zona")} />
        <Campo label="Vento (km/h, opcional)" tipo="number" valor={v("vento_kmh")} onChange={s("vento_kmh")} />
        <Campo tipo="checkbox" label="Câmara frigorífica" valor={v("camara")} onChange={s("camara")} />
      </div>
  );
  }
  if (tipo === "iluminacao") {
    const lista = (x) => x.split(/[\s;,]+/).filter(Boolean);
    const grupos = [...new Set(AMBIENTES_NHO11.map((a) => a.grupo))];
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
          <label className="text-[11px] md:col-span-2" style={{ color: WORK.muted }}>Ambiente, tarefa ou atividade (Quadro 1 da NHO 11)
            <select className="block w-full px-2 py-1.5 rounded border text-sm" style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={v("ambiente_idx") ?? ""} onChange={(e) => s("ambiente_idx")(e.target.value)}>
              <option value="">Outro — informar E manualmente</option>
              {grupos.map((g) => <optgroup key={g} label={g}>{AMBIENTES_NHO11.map((a, i) => (a.grupo === g ? <option key={i} value={i}>{a.nome} — {a.e} lux · IRC {a.irc}</option> : null))}</optgroup>)}
            </select>
          </label>
          {(v("ambiente_idx") ?? "") === "" && <Campo label="E mínimo (lux)" tipo="number" valor={v("requerido")} onChange={s("requerido")} />}
          <Campo label="Ajuste na escala (NHO 11, 5.1)" tipo="select" opcoes={{ "0": "Sem ajuste", "1": "+1 nível (tarefa crítica, baixo contraste, visão reduzida)", "-1": "−1 nível (detalhes grandes/alto contraste — justificar)" }} valor={String(v("ajuste_escala") ?? "0")} onChange={s("ajuste_escala")} />
        </div>
        <Campo label="Leituras ponto a ponto na ÁREA DA TAREFA (lux)" valor={v("pontos_texto")} onChange={(x) => set({ ...p, pontos_texto: x, pontos_tarefa: lista(x) })} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
          <Campo label="Iluminância média do ambiente (Anexo 1)" tipo="select" opcoes={{ media: "Média dos pontos gerais", malha: "Malha regular (R, Q, T, P)", central: "Luminária central (P)" }} valor={v("im_modo") || "media"} onChange={s("im_modo")} />
          <Campo tipo="checkbox" label="Tarefa contínua (mínimo 200 lux)" valor={v("continua")} onChange={s("continua")} />
          <div className="grid grid-cols-2 gap-2"><Campo label="IRC da lâmpada" tipo="number" valor={v("irc_medido")} onChange={s("irc_medido")} /><Campo label="Entorno imediato (lux)" tipo="number" valor={v("entorno")} onChange={s("entorno")} /></div>
        </div>
        {(v("im_modo") || "media") === "media" && <Campo label="Leituras gerais do ambiente (lux) — em branco usa os pontos da tarefa" valor={v("gerais_texto")} onChange={(x) => set({ ...p, gerais_texto: x, pontos_gerais: lista(x) })} />}
        {v("im_modo") === "malha" && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[["R", "Média R (r1–r8)"], ["Q", "Média Q (q1–q4)"], ["T", "Média T (t1–t4)"], ["P", "Média P (cantos)"], ["N", "Luminárias por fila"], ["M", "Nº de filas"]].map(([k, l]) => <Campo key={k} label={l} tipo="number" valor={v(k)} onChange={s(k)} />)}
          </div>
      )}
        {v("im_modo") === "central" && <Campo label="Média P (4 pontos)" tipo="number" valor={v("P")} onChange={s("P")} className="max-w-xs" />}
        <p className="text-[11px]" style={{ color: WORK.muted }}>Medir no plano da tarefa (ou a 0,75 m do piso), na condição mais desfavorável, com luxímetro calibrado e corrigido para o tipo de lâmpada (NHO 11, item 6).</p>
      </div>
  );
  }
  if (tipo === "vibracao") {
    return (
      <div className="space-y-2">
        <Campo label="Tipo" tipo="select" opcoes={{ vmb: "Mãos e braços (VMB)", vci: "Corpo inteiro (VCI)" }} valor={v("tipo") || "vmb"} onChange={s("tipo")} className="max-w-xs" />
        <Linhas linhas={v("segmentos")} onChange={s("segmentos")} novo={{ aceleracao: "", horas: "" }}
          colunas={[{ k: "aceleracao", label: "Aceleração m/s²" }, { k: "horas", label: "Horas/dia" }]} />
        {v("tipo") === "vci" && <Campo label="VDVR (m/s^1,75)" tipo="number" valor={v("vdvr")} onChange={s("vdvr")} className="max-w-xs" />}
      </div>
  );
  }
  if (tipo === "poeira") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 max-w-md">
          <Campo label="% de quartzo (sílica livre) no laudo" tipo="number" valor={v("quartzo")} onChange={s("quartzo")} />
          <Campo label="Fração" tipo="select" opcoes={{ respiravel: "Poeira respirável", total: "Poeira total" }} valor={v("fracao") || "respiravel"} onChange={s("fracao")} />
        </div>
        <Linhas linhas={v("amostras")} onChange={s("amostras")} novo={{ concentracao: "", minutos: "" }} colunas={[{ k: "concentracao", label: "Concentração (mg/m³)" }, { k: "minutos", label: "Minutos" }]} />
      </div>
  );
  }
  if (tipo === "quimico") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
          <Campo label="Limite de tolerância (Anexo 11)" tipo="number" valor={v("lt")} onChange={s("lt")} />
          <Campo label="Unidade" tipo="select" opcoes={{ ppm: "ppm", "mg/m³": "mg/m³" }} valor={v("unidade") || "ppm"} onChange={s("unidade")} />
          <Campo label="Horas de trabalho/dia" tipo="number" valor={v("horas_dia")} onChange={s("horas_dia")} />
          <Campo tipo="checkbox" label="Corrigir LT (Brief & Scala)" valor={v("brief_scala")} onChange={s("brief_scala")} />
        </div>
        <Linhas linhas={v("amostras")} onChange={s("amostras")} novo={{ concentracao: "", minutos: "" }}
          colunas={[{ k: "concentracao", label: "Concentração" }, { k: "minutos", label: "Minutos" }]} />
      </div>
  );
  }
  return null;
}

function Resultado({ r }) {
  if (!r) return <p className="text-xs" style={{ color: WORK.muted }}>Preencha os dados para ver o cálculo.</p>;
  const cor = r.excede ? "#B42318" : r.acao ? "#8A5A00" : "#146C43";
  const linha = (k, v) => (v === undefined || v === null || v === "" ? null : <div className="flex justify-between gap-2"><span style={{ color: WORK.muted }}>{k}</span><b>{v}</b></div>);
  return (
    <div className="rounded-lg p-3 text-sm space-y-1" style={{ background: WORK.bg, color: WORK.text, border: `1px solid ${cor}66` }}>
      {r.nr15 && <>{linha("Dose NR-15", `${r.nr15.dose_pct}%`)}{linha("NE (jornada) NR-15", `${r.nr15.ne} dB(A)`)}{linha("NE normalizado 8 h", `${r.nr15.ne_8h} dB(A)`)}</>}
      {r.nho01 && <>{linha("Dose NHO-01", `${r.nho01.dose_pct}%`)}{linha("NEN (NHO-01)", `${r.nho01.nen} dB(A)`)}</>}
      {r.ibutg_medio !== undefined && <>
        {r.ajuste_vestimenta ? <>{linha("IBUTG medido", `${r.ibutg_medido} °C`)}{linha("Ajuste de vestimenta", `+${r.ajuste_vestimenta} °C`)}{linha("IBUTG ajustado", `${r.ibutg_medio} °C`)}</> : linha("IBUTG médio", `${r.ibutg_medio} °C`)}
        {linha("M médio", `${r.m_medio} W`)}
        {r.nivel_acao !== null && r.nivel_acao !== undefined && typeof r.nivel_acao !== "string" && linha("Nível de ação", `${r.nivel_acao} °C`)}
        {r.limite_nr15 !== undefined && r.limite_nr15 !== r.limite_valor && linha("Limite NR-15 (insalubridade)", `${r.limite_nr15} °C`)}
      </>}
      {r.wct !== undefined && r.wct !== null && linha("Sensação térmica (WCT)", `${r.wct} °C`)}
      {r.iluminancia_media !== undefined && <>{linha("E mínimo exigido", r.e_requerido ? `${r.e_requerido} lux` : "—")}{linha("Iluminância média do ambiente", `${r.iluminancia_media} lux`)}{linha("Menor / maior ponto da tarefa", `${r.minimo} / ${r.maximo} lux`)}</>}
      {(r.verificacoes || []).map((x, i) => <p key={i} className="text-[11px]" style={{ color: x.ok ? "#146C43" : "#B42318" }}>{x.ok ? "✓" : "✗"} {x.texto}</p>)}
      {r.maior_amostra !== undefined && <>{linha("Maior amostra", r.maior_amostra)}{linha("Valor máximo (LT × FD)", r.valor_maximo_permitido)}{linha("Índice C/LT", r.indice)}</>}
      {r.nivel_acao && typeof r.nivel_acao === "string" && linha("Nível de ação", r.nivel_acao)}
      {linha("Resultado", r.valor !== null && r.valor !== undefined ? `${r.valor} ${r.unidade}` : "—")}
      {linha("Limite", r.limite)}
      {r.aviso_tempo && <p className="text-[11px]" style={{ color: "#8A5A00" }}>{r.aviso_tempo}</p>}
      {r.aviso_dados && <p className="text-[11px]" style={{ color: "#B42318" }}>{r.aviso_dados}</p>}
      {(r.avisos || []).map((a, i) => <p key={i} className="text-[11px]" style={{ color: "#8A5A00" }}>{a}</p>)}
      {r.criterio_label && <p className="text-[11px]" style={{ color: WORK.muted }}>Critério: {r.criterio_label}</p>}
      <p className="pt-1" style={{ color: cor }}>{r.conclusao}</p>
      {(r.medidas || []).length > 0 && (
        <div className="pt-1">
          <p className="text-[11px] font-semibold" style={{ color: WORK.text }}>Medidas exigidas (NR-09 Anexo III):</p>
          <ul className="list-disc pl-4 text-[11px]" style={{ color: WORK.text }}>{r.medidas.map(([m], i) => <li key={i}>{m}</li>)}</ul>
        </div>
    )}
    </div>
);
}

function EditorMedicao({ med, setMed, dados, onFechar, recarregar }) {
  const [atualizarRisco, setAtualizarRisco] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const def = TIPOS_MEDICAO[med.tipo];
  const resultado = med.tipo ? calcular(med.tipo, med.parametros || {}) : null;
  const set = (k, v) => setMed((m) => ({ ...m, [k]: v }));
  const equipCompat = dados.equipamentos.filter((e) => !def || def.equip.includes(e.tipo) || e.tipo === "outro");
  const eq = dados.equipamentos.find((e) => e.id === med.equipamento_id);
  const cal = eq ? statusCalibracao(eq, med.data) : null;
  const riscosSetor = dados.riscos.filter((r) => !med.setor_id || r.setor_id === med.setor_id);

  const salvar = async () => {
    if (!med.tipo || !med.setor_id) return alert("Informe o tipo e o setor.");
    if (!resultado) return alert("Preencha os dados de medição.");
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...d } = med; // eslint-disable-line no-unused-vars
      d.resultado = resultado;
      if (id) await base44.entities.Medicao.update(id, d);
      else await base44.entities.Medicao.create({ ...d, company_id: dados.empresa.id });
      const risco = dados.riscos.find((r) => r.id === med.risco_id);
      if (risco && atualizarRisco) {
        const anexo = ANEXO_NR15[med.tipo];
        const up = {
          tipo_avaliacao: "quantitativa",
          intensidade: String(resultado.valor ?? ""),
          unidade_medida: resultado.unidade,
          limite_tolerancia: resultado.limite,
          tecnica_medicao: med.metodologia || def.norma,
          revisado: false,
        };
        if (anexo && med.tipo !== "iluminacao") {
          up.insalubridade = {
            ...(risco.insalubridade || {}),
            caracteriza: !!resultado.insalubre,
            anexo,
            grau: resultado.insalubre ? (med.tipo === "quimico" ? risco.insalubridade?.grau || "" : med.tipo === "poeira" ? "maximo" : "medio") : "",
            fundamentacao: `Avaliação quantitativa em ${dataBR(med.data)} (${med.metodologia || def.norma}): ${resultado.valor} ${resultado.unidade}; limite ${resultado.limite}. ${resultado.conclusao}`,
          };
        }
        if ((resultado.medidas || []).length) {
          const atuais = risco.plano_acao || [];
          const novas = resultado.medidas.filter(([m]) => !atuais.some((x) => x.acao === m))
            .map(([m, tipo]) => ({ acao: m, tipo_medida: tipo, responsavel: "", prazo: "", status: "pendente" }));
          if (novas.length) up.plano_acao = [...atuais, ...novas];
        }
        await base44.entities.Risco.update(risco.id, up);
      }
      recarregar();
      onFechar();
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || ""));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal aberto onFechar={onFechar} titulo={med.id ? "Editar medição" : "Nova medição ambiental"} largura="max-w-4xl"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={salvando}>Salvar medição</Botao></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Campo label="Tipo de avaliação *" tipo="select" opcoes={Object.fromEntries(Object.entries(TIPOS_MEDICAO).map(([k, v]) => [k, v.label]))} valor={med.tipo}
            onChange={(v) => setMed((m) => ({ ...m, tipo: v, parametros: {}, metodologia: TIPOS_MEDICAO[v]?.norma || "" }))} />
          <Campo label="Setor *" tipo="select" opcoes={Object.fromEntries(dados.setores.map((s) => [s.id, s.nome]))} valor={med.setor_id} onChange={(v) => set("setor_id", v)} />
          <Campo label="Data" tipo="date" valor={med.data} onChange={(v) => set("data", v)} />
          <Campo label="Risco vinculado" tipo="select" opcoes={Object.fromEntries(riscosSetor.map((r) => [r.id, r.agente]))} valor={med.risco_id} onChange={(v) => set("risco_id", v)} />
          <Campo label="Equipamento" tipo="select" opcoes={Object.fromEntries(equipCompat.map((e) => [e.id, descEquip(e)]))} valor={med.equipamento_id} onChange={(v) => set("equipamento_id", v)} />
          <Campo label="Metodologia / norma" valor={med.metodologia} onChange={(v) => set("metodologia", v)} />
          <Campo label="Trabalhador / posto avaliado" valor={med.avaliado} onChange={(v) => set("avaliado", v)} />
          <Campo label="Responsável pela medição" valor={med.responsavel} onChange={(v) => set("responsavel", v)} />
          {med.tipo === "quimico" && <Campo label="Agente químico" valor={med.agente} onChange={(v) => set("agente", v)} />}
          <Campo label="Condições da avaliação" tipo="textarea" linhas={2} valor={med.condicoes} onChange={(v) => set("condicoes", v)} className="md:col-span-3" />
        </div>
        {cal && !cal.ok && <p className="text-xs" style={{ color: "#EF4444" }}> Equipamento com calibração inválida na data da medição — o resultado pode ser questionado em fiscalização ou perícia.</p>}
        {!dados.equipamentos.length && <p className="text-xs" style={{ color: "#EAB308" }}>Cadastre o equipamento de medição (com certificado de calibração) na seção abaixo da lista de medições.</p>}
        {med.tipo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p className="text-xs mb-2" style={{ color: WORK.muted }}>Dados de campo</p><Parametros tipo={med.tipo} p={med.parametros || {}} set={(p) => set("parametros", p)} /></div>
            <div><p className="text-xs mb-2" style={{ color: WORK.muted }}>Cálculo</p><Resultado r={resultado} /></div>
          </div>
      )}
        {med.risco_id && (
          <Campo tipo="checkbox" label="Atualizar o risco vinculado com este resultado (avaliação quantitativa e enquadramento NR-15)" valor={atualizarRisco} onChange={setAtualizarRisco} />
      )}
      </div>
    </Modal>
);
}

function EditorEquipamento({ eq, setEq, onFechar, recarregar }) {
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const set = (k, v) => setEq((e) => ({ ...e, [k]: v }));

  const enviarCert = async (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    setEnviando(true);
    try { const { file_uri } = await uploadPrivado(f); set("certificado_uri", file_uri); } catch (e) { alert("Erro no envio: " + (e?.message || "")); } finally { setEnviando(false); }
  };

  const salvar = async () => {
    if (!eq.tipo || !eq.modelo) return alert("Informe tipo e modelo.");
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...d } = eq; // eslint-disable-line no-unused-vars
      if (id) await base44.entities.Equipamento.update(id, d); else await base44.entities.Equipamento.create(d);
      recarregar();
      onFechar();
    } catch (e) { alert("Erro: " + (e?.message || "")); } finally { setSalvando(false); }
  };

  return (
    <Modal aberto onFechar={onFechar} titulo={eq.id ? "Editar equipamento" : "Novo equipamento de medição"} largura="max-w-2xl"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={salvando}>Salvar</Botao></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Campo label="Tipo *" tipo="select" opcoes={TIPOS_EQUIPAMENTO} valor={eq.tipo} onChange={(v) => set("tipo", v)} />
        <Campo label="Fabricante" valor={eq.fabricante} onChange={(v) => set("fabricante", v)} />
        <Campo label="Modelo *" valor={eq.modelo} onChange={(v) => set("modelo", v)} />
        <Campo label="Número de série" valor={eq.numero_serie} onChange={(v) => set("numero_serie", v)} />
        <Campo label="Nº do certificado de calibração" valor={eq.certificado_numero} onChange={(v) => set("certificado_numero", v)} />
        <Campo label="Laboratório (RBC/Inmetro)" valor={eq.laboratorio} onChange={(v) => set("laboratorio", v)} />
        <Campo label="Data da calibração" tipo="date" valor={eq.data_calibracao} onChange={(v) => set("data_calibracao", v)} />
        <Campo label="Validade da calibração" tipo="date" valor={eq.validade_calibracao} onChange={(v) => set("validade_calibracao", v)} />
        <div className="md:col-span-2 flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm cursor-pointer" style={{ borderColor: WORK.border, color: WORK.text }}>
            <Upload size={14} /> {enviando ? "Enviando…" : eq.certificado_uri ? "Trocar certificado (PDF/imagem)" : "Enviar certificado (PDF/imagem)"}
            <input type="file" accept="application/pdf,image/*" hidden onChange={enviarCert} />
          </label>
          {eq.certificado_uri && <Botao onClick={async () => window.open(await linkTemporario(eq.certificado_uri, 600), "_blank")}><FileCheck2 size={14} /> Ver certificado</Botao>}
        </div>
        <Campo label="Observações" tipo="textarea" linhas={2} valor={eq.observacoes} onChange={(v) => set("observacoes", v)} className="md:col-span-2" />
      </div>
    </Modal>
);
}

export default function Medicoes({ dados, recarregar }) {
  const [med, setMed] = useState(null);
  const [eq, setEq] = useState(null);
  const setorNome = Object.fromEntries(dados.setores.map((s) => [s.id, s.nome]));

  return (
    <div className="space-y-4">
      <Cartao titulo={`Medições ambientais (${dados.medicoes.length})`}
        acoes={<Botao tipo="primario" onClick={() => setMed({ data: hoje(), setor_id: dados.setores[0]?.id || "", parametros: {} })} disabled={!dados.setores.length}><Plus size={14} /> Nova medição</Botao>}>
        <p className="text-xs mb-3" style={{ color: WORK.muted }}>
          Ruído (NR-15/NHO-01), ruído de impacto, calor (IBUTG/NHO-06), frio, iluminação (NR-17), vibração (NHO-09/10) e químicos (Anexo 11). O sistema calcula dose, NEN, IBUTG médio, aren, média ponderada e compara com os limites.
          Ao vincular a um risco, o resultado vai para o inventário, o LTCAT, os laudos e o S-2240.
        </p>
        {dados.medicoes.length === 0 && <Vazio>Nenhuma medição cadastrada.</Vazio>}
        <div className="space-y-2">
          {dados.medicoes.map((m) => {
            const r = m.resultado || {};
            const cor = r.excede ? "#EF4444" : r.acao ? "#EAB308" : "#22C55E";
            const e = dados.equipamentos.find((x) => x.id === m.equipamento_id);
            const cal = e ? statusCalibracao(e, m.data) : null;
            return (
              <div key={m.id} className="flex items-start gap-2 rounded-lg p-3" style={{ background: WORK.bg }}>
                <div className="flex-1 min-w-0 text-sm" style={{ color: WORK.text }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <b>{TIPOS_MEDICAO[m.tipo]?.label}{m.agente ? ` — ${m.agente}` : ""}</b>
                    <Etiqueta cor={cor}>{r.valor ?? "—"} {r.unidade || ""}</Etiqueta>
                    {cal && !cal.ok && <Etiqueta cor="#EF4444">calibração inválida</Etiqueta>}
                    {!e && <Etiqueta cor="#EAB308">sem equipamento</Etiqueta>}
                  </div>
                  <p className="text-xs mt-1" style={{ color: WORK.muted }}>{setorNome[m.setor_id] || "—"} · {dataBR(m.data)} · {m.avaliado || ""} · {r.conclusao || ""}</p>
                </div>
                <button onClick={() => setMed({ ...m })} style={{ color: WORK.muted }}><Pencil size={15} /></button>
                <button onClick={async () => { if (confirm("Excluir medição?")) { await base44.entities.Medicao.delete(m.id); recarregar(); } }} style={{ color: WORK.muted }}><Trash2 size={15} /></button>
              </div>
          );
          })}
        </div>
      </Cartao>

      <Cartao titulo={`Equipamentos de medição (${dados.equipamentos.length})`} acoes={<Botao onClick={() => setEq({ tipo: "dosimetro" })}><Plus size={14} /> Novo equipamento</Botao>}>
        <p className="text-xs mb-3" style={{ color: WORK.muted }}>Seus equipamentos ficam disponíveis para todas as empresas. Guarde o certificado de calibração: ele é exigido para validar a medição.</p>
        {dados.equipamentos.length === 0 && <Vazio>Nenhum equipamento cadastrado.</Vazio>}
        <div className="space-y-2">
          {dados.equipamentos.map((e) => {
            const cal = statusCalibracao(e);
            return (
              <div key={e.id} className="flex items-center gap-2 rounded-lg p-3" style={{ background: WORK.bg }}>
                <div className="flex-1 min-w-0 text-sm" style={{ color: WORK.text }}>
                  <b>{descEquip(e)}</b>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Etiqueta cor={cal.cor}>{cal.label}</Etiqueta>
                    <span className="text-xs" style={{ color: WORK.muted }}>Cert. {e.certificado_numero || "—"} · {e.laboratorio || ""}{e.certificado_uri ? " ·  certificado anexado" : ""}</span>
                  </div>
                </div>
                <button onClick={() => setEq({ ...e })} style={{ color: WORK.muted }}><Pencil size={15} /></button>
                <button onClick={async () => { if (confirm("Excluir equipamento?")) { await base44.entities.Equipamento.delete(e.id); recarregar(); } }} style={{ color: WORK.muted }}><Trash2 size={15} /></button>
              </div>
          );
          })}
        </div>
      </Cartao>

      {med && <EditorMedicao med={med} setMed={setMed} dados={dados} onFechar={() => setMed(null)} recarregar={recarregar} />}
      {eq && <EditorEquipamento eq={eq} setEq={setEq} onFechar={() => setEq(null)} recarregar={recarregar} />}
    </div>
);
}
