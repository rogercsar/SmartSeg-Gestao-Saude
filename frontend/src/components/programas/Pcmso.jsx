import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Plus, Trash2, Library } from "lucide-react";
import { carregarCatalogos, exameCatalogoPorNome, riscosDoExame } from "@/lib/catalogoSst";
import { WORK, TIPOS_RISCO, MOMENTOS_EXAME } from "@/lib/sst";
import { sugerirExames } from "@/lib/programasIA";
import { Botao, Cartao, Etiqueta, Vazio, erroMsg } from "@/components/programas/ui";
import ComboboxCodigoEsocial from "@/components/esocial/ComboboxCodigoEsocial";
import { SeletorCatalogoExame } from "@/components/programas/SeletorCatalogo";

const EXAMES_COMUNS = [
  "Exame clínico ocupacional", "Audiometria tonal", "Espirometria", "Radiografia de tórax (padrão OIT)", "Acuidade visual",
  "Eletrocardiograma", "Eletroencefalograma", "Hemograma completo", "Glicemia de jejum", "Avaliação psicossocial",
  "Ácido hipúrico urinário", "Ácido trans,trans-mucônico urinário", "Chumbo no sangue", "Colinesterase eritrocitária",
  "Anti-HBs", "Vacinação (hepatite B, tétano)", "Parasitológico de fezes", "Micológico de unhas",
];

function ExameLinha({ ex, riscos, todosRiscos, cat, recarregar }) {
  const upd = async (d) => { await base44.entities.ExamePcmso.update(ex.id, d); recarregar(); };
  const vinculados = ex.risco_ids || [];
  const exCat = ex.catalogo_id
    ? cat?.exames.find((x) => x.id === ex.catalogo_id)
    : cat ? exameCatalogoPorNome(cat, ex.exame) : null;
  const riscosCatIds = exCat ? riscosDoExame(cat, exCat.id).map((rc) => rc.id) : [];
  const base = todosRiscos && todosRiscos.length ? todosRiscos : riscos;
  const sugeridos = base.filter((r) => r.catalogo_id && riscosCatIds.includes(r.catalogo_id));
  const sugNaoVinc = sugeridos.filter((r) => !vinculados.includes(r.id));
  const toggleRisco = (r) => upd({ risco_ids: vinculados.includes(r.id) ? vinculados.filter((x) => x !== r.id) : [...vinculados, r.id] });
  const aplicarSugestoes = () => { if (!sugNaoVinc.length) return; upd({ risco_ids: [...vinculados, ...sugNaoVinc.map((r) => r.id)] }); };
  return (
    <div className="rounded-lg p-3 text-sm" style={{ background: WORK.bg, color: WORK.text, opacity: ex.ativo === false ? 0.5 : 1 }}>
      <div className="flex flex-wrap items-center gap-2">
        <input type="checkbox" checked={ex.ativo !== false} onChange={(e) => upd({ ativo: e.target.checked })} title="Incluir no PCMSO" />
        <b className="flex-1">{ex.exame}</b>
        {ex.origem === "ia" && <Etiqueta cor="#A855F7">IA</Etiqueta>}
        <label className="text-xs flex items-center gap-1" style={{ color: WORK.muted }}>
          a cada
          <input type="number" min={1} className="w-14 px-1.5 py-1 rounded border text-xs" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}
            defaultValue={ex.periodicidade_meses || 12} onBlur={(e) => Number(e.target.value) !== ex.periodicidade_meses && upd({ periodicidade_meses: Number(e.target.value) || 12 })} />
          meses
        </label>
        <button onClick={async () => { if (confirm("Remover exame?")) { await base44.entities.ExamePcmso.delete(ex.id); recarregar(); } }} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {Object.entries(MOMENTOS_EXAME).map(([k, v]) => {
          const on = (ex.momentos || []).includes(k);
          return (
            <button key={k} onClick={() => upd({ momentos: on ? ex.momentos.filter((x) => x !== k) : [...(ex.momentos || []), k] })}
              className="px-2 py-0.5 rounded-full text-[11px] border" style={{ borderColor: on ? WORK.accent : WORK.border, color: on ? WORK.accent : WORK.muted }}>{v}</button>
        );
        })}
      </div>
      {ex.justificativa && <p className="text-xs mt-2" style={{ color: WORK.muted }}>{ex.justificativa}</p>}
      <div className="mt-2">
        <ComboboxCodigoEsocial tabela="procedimento_diagnostico" value={ex.codigo_esocial || ""} onChange={(v) => upd({ codigo_esocial: v })} onChangeItem={(it) => upd({ codigo_esocial_descricao: it?.descricao || "" })} placeholder="Vincular código eSocial (Tabela 27)..." />
      </div>
      <div className="mt-2">
        <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Riscos vinculados (toque para adicionar/remover)</span>
        <div className="flex flex-wrap gap-1.5">
          {riscos.length === 0 && <span className="text-xs" style={{ color: WORK.muted }}>Nenhum risco neste cargo.</span>}
          {riscos.map((r) => {
            const on = vinculados.includes(r.id);
            const sgt = sugeridos.some((s) => s.id === r.id);
            return (
              <button key={r.id} onClick={() => toggleRisco(r)} className="px-2 py-0.5 rounded-full text-[11px] border flex items-center gap-1"
                style={{ borderColor: on ? WORK.accent : WORK.border, color: on ? WORK.accent : WORK.muted, background: sgt && !on ? "rgba(11,111,168,0.06)" : "transparent" }}
                title={sgt ? "Sugerido pelo catálogo" : ""}>
                {sgt && !on && " "}{r.agente}
              </button>
          );
          })}
        </div>
        {sugNaoVinc.length > 0 && (
          <button onClick={aplicarSugestoes} className="text-[11px] mt-1.5" style={{ color: WORK.accent }}>+ Vincular {sugNaoVinc.length} risco(s) sugerido(s) pelo catálogo</button>
      )}
      </div>
    </div>
);
}

export default function Pcmso({ dados, recarregar, irPara }) {
  const [ocupado, setOcupado] = useState("");
  const [novo, setNovo] = useState({});
  const [catAberto, setCatAberto] = useState(null);
  const [cat, setCat] = useState(null);
  useEffect(() => { carregarCatalogos().then(setCat).catch(() => {}); }, []);

  const riscosDo = (cargo) => dados.riscos.filter((r) => (r.cargo_ids || []).includes(cargo.id));

  const iaSugerir = async (cargo) => {
    setOcupado(cargo.id);
    try {
      const riscos = riscosDo(cargo);
      const sugestoes = await sugerirExames(cargo, riscos, dados.empresa);
      const atuais = dados.exames.filter((e) => e.cargo_id === cargo.id).map((e) => e.exame.toLowerCase().trim());
      const ids = new Set(riscos.map((r) => r.id));
      const novos = sugestoes
        .filter((s) => s.exame && !atuais.includes(s.exame.toLowerCase().trim()))
        .map((s) => ({
          company_id: dados.empresa.id, cargo_id: cargo.id, exame: s.exame, codigo_esocial: s.codigo_esocial || "",
          momentos: s.momentos?.length ? s.momentos : ["admissional", "periodico"], periodicidade_meses: s.periodicidade_meses || 12,
          justificativa: s.justificativa || "", risco_ids: (s.risco_ids || []).filter((id) => ids.has(id)), origem: "ia", ativo: true,
        }));
      if (novos.length) await base44.entities.ExamePcmso.bulkCreate(novos);
      else alert("Nenhum exame novo sugerido — os exames atuais já cobrem os riscos.");
      recarregar();
    } catch (e) { erroMsg(e); } finally { setOcupado(""); }
  };

  const adicionar = async (cargo) => {
    const nome = (novo[cargo.id] || "").trim();
    if (!nome) return;
    await base44.entities.ExamePcmso.create({
      company_id: dados.empresa.id, cargo_id: cargo.id, exame: nome, momentos: ["admissional", "periodico", "retorno", "mudanca_risco", "demissional"],
      periodicidade_meses: 12, origem: "manual", ativo: true,
    });
    setNovo((n) => ({ ...n, [cargo.id]: "" }));
    recarregar();
  };
  const adicionarDoCatalogo = async (cargo, it) => {
    await base44.entities.ExamePcmso.create({
      company_id: dados.empresa.id, cargo_id: cargo.id, exame: it.exame, catalogo_id: it.id,
      codigo_esocial: it.codigo_esocial || "", codigo_esocial_descricao: it.codigo_esocial_descricao || "",
      momentos: it.momentos_default || ["admissional", "periodico"], periodicidade_meses: it.periodicidade_meses || 12,
      justificativa: it.justificativa_modelo || "", origem: "manual", ativo: true,
    });
    setCatAberto(null);
    recarregar();
  };

  if (!dados.cargos.length) return <Cartao><Vazio>Cadastre cargos na aba Estrutura.</Vazio></Cartao>;

  return (
    <div className="space-y-4">
      <Cartao>
        <p className="text-sm" style={{ color: WORK.text }}>
          O PCMSO liga os riscos de cada cargo aos exames (NR-7). Use a IA para sugerir e depois inclua, retire ou ajuste
          exames, momentos e periodicidade conforme o critério do médico coordenador.
        </p>
        <p className="text-xs mt-1" style={{ color: WORK.muted }}>Regra geral da NR-7: periódico anual para expostos a riscos; a cada 2 anos para os demais, salvo critério médico ou anexos.</p>
      </Cartao>

      {dados.cargos.map((c) => {
        const riscos = riscosDo(c);
        const exames = dados.exames.filter((e) => e.cargo_id === c.id);
        return (
          <Cartao key={c.id} titulo={`${c.nome_cargo} — ${exames.filter((e) => e.ativo !== false).length} exame(s)`}
            acoes={<Botao tipo="primario" onClick={() => iaSugerir(c)} carregando={ocupado === c.id} title="2 créditos"><Sparkles size={14} /> Sugerir exames</Botao>}>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {riscos.length === 0 && <span className="text-xs" style={{ color: WORK.muted }}> Nenhum risco vinculado a este cargo — a sugestão será só o exame clínico.</span>}
              {riscos.map((r) => <Etiqueta key={r.id} cor={TIPOS_RISCO[r.tipo]?.cor || "#94A3B8"}>{r.agente}</Etiqueta>)}
            </div>
            <div className="space-y-2">
              {exames.length === 0 && <Vazio>Nenhum exame definido.</Vazio>}
              {exames.map((ex) => <ExameLinha key={ex.id} ex={ex} riscos={riscos} todosRiscos={dados.riscos} cat={cat} recarregar={recarregar} />)}
            </div>
            <div className="flex gap-2 mt-3">
              <input list="exames-comuns" value={novo[c.id] || ""} onChange={(e) => setNovo((n) => ({ ...n, [c.id]: e.target.value }))}
                placeholder="Adicionar exame…" className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} />
              <Botao onClick={() => adicionar(c)}><Plus size={14} /> Incluir</Botao>
              <Botao onClick={() => setCatAberto(c.id)} title="Selecionar do catálogo compartilhado"><Library size={14} /> Catálogo</Botao>
            </div>
          </Cartao>
      );
      })}
      <datalist id="exames-comuns">{EXAMES_COMUNS.map((e) => <option key={e} value={e} />)}</datalist>
      <div className="flex justify-end"><Botao tipo="primario" onClick={() => irPara("laudos")}>Próximo: LTCAT e laudos →</Botao></div>
      {catAberto && (
        <SeletorCatalogoExame onSelecionar={(it) => { const c = dados.cargos.find((x) => x.id === catAberto); if (c) adicionarDoCatalogo(c, it); }} onFechar={() => setCatAberto(null)} />
    )}
    </div>
);
}