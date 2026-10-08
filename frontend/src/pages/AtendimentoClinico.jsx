import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, FileCheck2, Upload, Eye, Plus, Lock } from "lucide-react";
import { WORK, TIPOS_RISCO } from "@/lib/sst";
import { cl, TIPOS_ASO, STATUS_AT, CONCLUSOES, ANTECEDENTES, CAMPOS_EXAME_FISICO, etiquetaFinanceira } from "@/lib/clinica";
import { uploadPrivado, linkTemporario } from "@/lib/privateFiles";
import { hojeLocal, dataBR } from "@/lib/sstGestao";
import { Botao, Campo, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";

const idade = (n) => { if (!n) return ""; const d = new Date(n + "T12:00:00Z"), h = new Date(); let i = h.getFullYear() - d.getUTCFullYear(); if (h.getMonth() < d.getUTCMonth() || (h.getMonth() === d.getUTCMonth() && h.getDate() < d.getUTCDate())) i--; return `${i} anos`; };
const APT = { "": "Não avaliado", apto: "Apto", inapto: "Inapto" };
const NOMES_APT = { altura: "Trabalho em altura (NR-35)", confinado: "Espaço confinado (NR-33)", eletricidade: "Serviços em eletricidade (NR-10)", maquinas: "Máquinas e empilhadeiras (NR-11/12)", inflamaveis: "Inflamáveis e combustíveis (NR-20)", direcao: "Direção de veículos" };

export default function AtendimentoClinico() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const [a, setA] = useState(null);
  const [info, setInfo] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(null);

  const carregar = () => cl("atendimento", { id }).then((r) => { setA(r.atendimento); setInfo({ perfil: r.perfil, medico: r.medico }); }).catch((e) => alert(e.message));
  useEffect(() => { carregar(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!a) return <div className="p-8"><Vazio>Carregando atendimento…</Vazio></div>;
  const fechado = a.status === "finalizado";
  const clinico = a.triagem !== undefined; // perfis sem acesso clínico não recebem esses campos
  const podeTriagem = ["admin", "enfermagem", "medico"].includes(info.perfil) && !fechado;
  const podeMedico = ["admin", "medico"].includes(info.perfil) && !fechado;
  const podeExames = ["admin", "medico", "enfermagem", "fono"].includes(info.perfil) && !fechado;
  const set = (grupo, k, v) => setA((x) => ({ ...x, [grupo]: { ...(x[grupo] || {}), [k]: v } }));
  const t = a.triagem || {}, an = a.anamnese || {}, ef = a.exame_fisico || {};
  const imc = Number(t.peso) && Number(t.altura) ? (Number(t.peso) / Math.pow(Number(t.altura) / 100, 2)).toFixed(1) : "";

  const salvar = async (extra = {}) => {
    setSalvando(true);
    try {
      const payload = { id: a.id, ...extra };
      if (podeTriagem) payload.triagem = { ...t, imc };
      if (podeMedico) Object.assign(payload, { anamnese: an, exame_fisico: ef, aptidoes: a.aptidoes, conclusao: a.conclusao, restricoes: a.restricoes });
      if (podeExames) payload.exames = a.exames;
      await cl("atendimento_salvar", payload);
      await carregar();
    } catch (e) { alert(e.message); } finally { setSalvando(false); }
  };

  const emitir = async () => {
    await salvar();
    let conf = {};
    for (let i = 0; i < 3; i++) {
      try {
        const r = await cl("aso_emitir", { id: a.id, ...conf });
        alert(`ASO ${r.aso_numero} emitido.`);
        await carregar();
        return;
      } catch (e) {
        if (e.code === "EXAMES_PENDENTES" && confirm(e.message)) { conf.confirmar_sem_resultados = true; continue; }
        if (e.code === "KIT_SEM_SALDO" && confirm(e.message)) { conf.confirmar_sem_saldo = true; continue; }
        if (!["EXAMES_PENDENTES", "KIT_SEM_SALDO"].includes(e.code)) alert(e.message);
        return;
      }
    }
  };

  const laudo = async (i, file) => {
    if (!file) return;
    setEnviando(i);
    try { const { file_uri } = await uploadPrivado(file); setA((x) => ({ ...x, exames: x.exames.map((e, j) => (j === i ? { ...e, arquivo_uri: file_uri, data: e.data || hojeLocal() } : e)) })); }
    catch (e) { alert("Erro no envio: " + e.message); } finally { setEnviando(null); }
  };

  const fe = etiquetaFinanceira(a.financeiro, null);
  const inp = "px-2 py-1.5 rounded border text-sm w-full";
  const st = { borderColor: WORK.border };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
      <Link to="/clinica" className="inline-flex items-center gap-1 text-sm" style={{ color: WORK.accent }}><ArrowLeft size={14} /> Clínica</Link>
      <Cartao>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-[240px]">
            <h1 className="text-xl font-bold" style={{ color: WORK.text }}>{a.trabalhador_nome}</h1>
            <p className="text-sm" style={{ color: WORK.muted }}>{a.empresa_nome} · {a.cargo_nome || "cargo não informado"} · {idade(a.data_nascimento)} {a.sexo ? "· " + (a.sexo === "M" ? "masculino" : "feminino") : ""} · CPF {a.cpf || "—"}</p>
            <p className="text-sm mt-1" style={{ color: WORK.text }}><b>{TIPOS_ASO[a.tipo_aso]}</b></p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Etiqueta cor={STATUS_AT[a.status]?.[1]}>{STATUS_AT[a.status]?.[0]}</Etiqueta>
            {fe && <Etiqueta cor={fe[1]}>{fe[0]}</Etiqueta>}
            {fechado && <Link to={`/clinica/aso?id=${a.id}`} target="_blank"><Botao tipo="primario"><FileCheck2 size={14} /> ASO {a.aso_numero}</Botao></Link>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(a.riscos || []).length === 0 && <span className="text-xs" style={{ color: WORK.muted }}>Sem riscos cadastrados no PGR para o cargo.</span>}
          {(a.riscos || []).map((r, i) => <Etiqueta key={i} cor={TIPOS_RISCO[r.tipo]?.cor || "#5F6368"}>{r.agente}</Etiqueta>)}
        </div>
      </Cartao>

      {!clinico && (
        <Cartao><p className="text-sm" style={{ color: WORK.muted }}><Lock size={14} className="inline mr-1" />Seu perfil não tem acesso aos dados clínicos (sigilo médico). Você vê os dados administrativos e o ASO depois de emitido.</p></Cartao>
      )}

      {clinico && (
        <>
          <Cartao titulo="Triagem" acoes={podeTriagem && <Botao onClick={() => salvar()} carregando={salvando}><Save size={14} /> Salvar triagem</Botao>}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[["pa", "PA (mmHg)", "120x80"], ["fc", "FC (bpm)"], ["fr", "FR (irpm)"], ["temp", "Temperatura (°C)"], ["spo2", "SpO₂ (%)"], ["peso", "Peso (kg)"], ["altura", "Altura (cm)"], ["acuidade_od", "Acuidade OD"], ["acuidade_oe", "Acuidade OE"], ["glicemia", "Glicemia capilar"]].map(([k, l, ph]) => (
                <label key={k} className="text-[11px]" style={{ color: WORK.muted }}>{l}
                  <input className={inp} style={st} disabled={!podeTriagem} value={t[k] || ""} placeholder={ph || ""} onChange={(e) => set("triagem", k, e.target.value)} />
                </label>
              ))}
            </div>
            {imc && <p className="text-xs mt-2" style={{ color: WORK.text }}>IMC: <b>{imc}</b></p>}
          </Cartao>

          <Cartao titulo="Anamnese ocupacional">
            <fieldset disabled={!podeMedico}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Campo label="Queixa atual / motivo" tipo="textarea" linhas={2} valor={an.queixa} onChange={(v) => set("anamnese", "queixa", v)} />
              <Campo label="História ocupacional (empregos e exposições anteriores)" tipo="textarea" linhas={2} valor={an.historia_ocupacional} onChange={(v) => set("anamnese", "historia_ocupacional", v)} />
              <div className="md:col-span-2">
                <p className="text-xs mb-1" style={{ color: WORK.muted }}>Antecedentes pessoais</p>
                <div className="flex flex-wrap gap-1.5">
                  {ANTECEDENTES.map((x) => {
                    const on = (an.antecedentes || []).includes(x);
                    return <button key={x} disabled={!podeMedico} onClick={() => set("anamnese", "antecedentes", on ? an.antecedentes.filter((y) => y !== x) : [...(an.antecedentes || []), x])}
                      className="px-2.5 py-1 rounded-full text-xs border" style={{ borderColor: on ? WORK.accent : WORK.border, color: on ? WORK.accent : WORK.muted, background: on ? "#E6F2F8" : "#fff" }}>{x}</button>;
                  })}
                </div>
              </div>
              <Campo label="Detalhes dos antecedentes / cirurgias" tipo="textarea" linhas={2} valor={an.antecedentes_detalhe} onChange={(v) => set("anamnese", "antecedentes_detalhe", v)} />
              <Campo label="Antecedentes familiares" tipo="textarea" linhas={2} valor={an.familiares} onChange={(v) => set("anamnese", "familiares", v)} />
              <Campo label="Medicamentos em uso" valor={an.medicamentos} onChange={(v) => set("anamnese", "medicamentos", v)} />
              <Campo label="Hábitos (tabagismo, álcool, atividade física)" valor={an.habitos} onChange={(v) => set("anamnese", "habitos", v)} />
              <Campo label="Acidentes de trabalho e afastamentos anteriores" valor={an.acidentes} onChange={(v) => set("anamnese", "acidentes", v)} />
              <Campo label="Queixas relacionadas ao trabalho atual" valor={an.queixas_trabalho} onChange={(v) => set("anamnese", "queixas_trabalho", v)} />
            </div>
            </fieldset>
          </Cartao>

          <Cartao titulo="Exame físico" acoes={podeMedico && <Botao onClick={() => { const n = { ...ef }; CAMPOS_EXAME_FISICO.forEach(([k]) => { if (!n[k]) n[k] = "Sem alterações"; }); setA((x) => ({ ...x, exame_fisico: n })); }}>Preencher "sem alterações" nos vazios</Botao>}>
            <fieldset disabled={!podeMedico} className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {CAMPOS_EXAME_FISICO.map(([k, l]) => <Campo key={k} label={l} valor={ef[k]} onChange={(v) => set("exame_fisico", k, v)} />)}
            </fieldset>
          </Cartao>

          <Cartao titulo="Exames complementares" acoes={podeExames && <Botao onClick={() => setA((x) => ({ ...x, exames: [...x.exames, { exame: "", data: hojeLocal(), resultado: "", alterado: false, arquivo_uri: "" }] }))}><Plus size={14} /> Exame</Botao>}>
            <div className="space-y-2">
              {(a.exames || []).map((e, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center rounded-lg p-2" style={{ background: e.alterado ? "#FDE8E8" : WORK.bg }}>
                  <input className={inp + " md:col-span-3"} style={st} disabled={!podeExames} value={e.exame} placeholder="Exame" onChange={(ev) => setA((x) => ({ ...x, exames: x.exames.map((y, j) => (j === i ? { ...y, exame: ev.target.value } : y)) }))} />
                  <input type="date" className={inp + " md:col-span-2"} style={st} disabled={!podeExames} value={e.data || ""} onChange={(ev) => setA((x) => ({ ...x, exames: x.exames.map((y, j) => (j === i ? { ...y, data: ev.target.value } : y)) }))} />
                  <input className={inp + " md:col-span-4"} style={st} disabled={!podeExames} value={e.resultado || ""} placeholder="Resultado / laudo resumido" onChange={(ev) => setA((x) => ({ ...x, exames: x.exames.map((y, j) => (j === i ? { ...y, resultado: ev.target.value } : y)) }))} />
                  <label className="text-xs flex items-center gap-1 md:col-span-1" style={{ color: WORK.muted }}><input type="checkbox" disabled={!podeExames} checked={!!e.alterado} onChange={(ev) => setA((x) => ({ ...x, exames: x.exames.map((y, j) => (j === i ? { ...y, alterado: ev.target.checked } : y)) }))} />alterado</label>
                  <div className="flex gap-2 md:col-span-2">
                    {podeExames && <label className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded border cursor-pointer" style={st}><Upload size={12} />{enviando === i ? "…" : "Laudo"}<input type="file" accept="application/pdf,image/*" hidden onChange={(ev) => laudo(i, ev.target.files?.[0])} /></label>}
                    {e.arquivo_uri && <button onClick={async () => window.open(await linkTemporario(e.arquivo_uri, 600), "_blank")} style={{ color: WORK.accent }}><Eye size={15} /></button>}
                  </div>
                </div>
              ))}
            </div>
            {podeExames && <div className="mt-2"><Botao onClick={() => salvar()} carregando={salvando}><Save size={14} /> Salvar exames</Botao></div>}
          </Cartao>

          <Cartao titulo="Aptidões específicas">
            <div className="space-y-1.5">
              {Object.entries(NOMES_APT).map(([k, nome]) => {
                const ap = (a.aptidoes || {})[k] || {};
                return (
                  <div key={k} className="flex flex-wrap items-center gap-2 rounded-lg p-2 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
                    <span className="flex-1 min-w-[220px]">{nome}{ap.sugerido && <span className="block text-[11px]" style={{ color: "#8A5A00" }}>Avaliar: {ap.motivo}</span>}</span>
                    {Object.entries(APT).map(([v, l]) => (
                      <button key={v} disabled={!podeMedico} onClick={() => setA((x) => ({ ...x, aptidoes: { ...x.aptidoes, [k]: { ...ap, resultado: v } } }))}
                        className="px-2.5 py-1 rounded-lg text-xs border" style={{ borderColor: (ap.resultado || "") === v ? WORK.accent : WORK.border, color: (ap.resultado || "") === v ? WORK.accent : WORK.muted, background: (ap.resultado || "") === v ? "#E6F2F8" : "#fff" }}>{l}</button>
                    ))}
                  </div>
                );
              })}
            </div>
          </Cartao>

          <Cartao titulo="Conclusão do ASO">
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(CONCLUSOES).map(([k, [l, c]]) => (
                <button key={k} disabled={!podeMedico} onClick={() => setA((x) => ({ ...x, conclusao: k }))} className="px-4 py-2.5 rounded-lg border text-sm font-semibold"
                  style={{ borderColor: a.conclusao === k ? c : WORK.border, color: a.conclusao === k ? c : WORK.muted, background: a.conclusao === k ? c + "18" : "#fff" }}>{l}</button>
              ))}
            </div>
            <fieldset disabled={!podeMedico}><Campo label="Restrições / observações que aparecem no ASO" tipo="textarea" linhas={2} valor={a.restricoes} onChange={(v) => setA((x) => ({ ...x, restricoes: v }))} /></fieldset>
            {!fechado && (
              <div className="flex flex-wrap gap-2 mt-3">
                {podeMedico && <Botao onClick={() => salvar()} carregando={salvando}><Save size={14} /> Salvar consulta</Botao>}
                {podeMedico && <Botao onClick={() => salvar({ status: "aguardando_resultados" })} carregando={salvando}>Aguardar resultados</Botao>}
                {info.medico && <Botao tipo="primario" onClick={emitir} carregando={salvando}><FileCheck2 size={14} /> Emitir ASO</Botao>}
              </div>
            )}
            {fechado && <p className="text-sm mt-3" style={{ color: "#146C43" }}>ASO {a.aso_numero} emitido em {dataBR(a.aso_data)} por {a.medico?.nome} — CRM {a.medico?.crm}/{a.medico?.uf}. O atendimento está bloqueado para alterações.</p>}
          </Cartao>
        </>
      )}
    </div>
  );
}
