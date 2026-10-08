import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles } from "lucide-react";
import { WORK, MATRIZES, NIVEIS, TIPOS_RISCO, paraEscala, avaliar } from "@/lib/sst";
import { preencherMatriz } from "@/lib/programasIA";
import { Botao, Cartao, Etiqueta, Vazio, erroMsg } from "@/components/programas/ui";
import { RiscoEditor } from "@/components/programas/Riscos";

export default function Matriz({ dados, recarregar, irPara }) {
  const pgr = dados.programas.find((p) => p.tipo === "pgr");
  const [matriz, setMatriz] = useState(pgr?.matriz || "5x5");
  const [celula, setCelula] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [edit, setEdit] = useState(null);
  const m = MATRIZES[matriz];

  const trocar = async (nova) => {
    setMatriz(nova);
    setCelula(null);
    if (pgr) await base44.entities.ProgramaSST.update(pgr.id, { matriz: nova });
    else await base44.entities.ProgramaSST.create({ company_id: dados.empresa.id, tipo: "pgr", matriz: nova, status: "rascunho" });
    recarregar();
  };

  const semNota = dados.riscos.filter((r) => !r.severidade || !r.probabilidade);

  const automatico = async (todos) => {
    const alvo = (todos ? dados.riscos : semNota).slice(0, 40);
    if (!alvo.length) return alert("Todos os riscos já têm severidade e probabilidade.");
    if (todos && !confirm(`Reavaliar ${alvo.length} risco(s) com IA? Os valores atuais serão substituídos.`)) return;
    setOcupado(true);
    try {
      const itens = await preencherMatriz(alvo, { empresa: dados.empresa });
      const lim = (v) => Math.min(5, Math.max(1, Math.round(Number(v) || 0)));
      for (const it of itens) {
        const r = alvo.find((x) => x.id === it.id);
        if (!r || !it.severidade || !it.probabilidade) continue;
        const novo = { ...r, severidade: lim(it.severidade), probabilidade: lim(it.probabilidade) };
        await base44.entities.Risco.update(r.id, { severidade: novo.severidade, probabilidade: novo.probabilidade, nivel_risco: avaliar(novo, "5x5")?.nivel || "" });
      }
      recarregar();
    } catch (e) { erroMsg(e); } finally { setOcupado(false); }
  };

  const naCelula = (s, p) => dados.riscos.filter((r) => paraEscala(r.severidade, matriz) === s && paraEscala(r.probabilidade, matriz) === p);
  const contagem = Object.keys(NIVEIS).map((k) => [k, dados.riscos.filter((r) => avaliar(r, matriz)?.nivel === k).length]);
  const selecionados = celula ? naCelula(celula.s, celula.p) : [];
  const n = m.n;

  return (
    <div className="space-y-4">
      <Cartao titulo="Matriz de risco (severidade × probabilidade)"
        acoes={<>
          {["4x4", "5x5"].map((k) => (
            <Botao key={k} tipo={matriz === k ? "primario" : "secundario"} onClick={() => trocar(k)}>{k}</Botao>
          ))}
        </>}>
        <div className="flex flex-wrap gap-2 mb-4">
          <Botao tipo="primario" onClick={() => automatico(false)} carregando={ocupado} disabled={!semNota.length} title="2 créditos">
            <Sparkles size={14} /> Preencher automaticamente ({semNota.length} sem avaliação)
          </Botao>
          <Botao onClick={() => automatico(true)} disabled={ocupado || !dados.riscos.length}>Reavaliar todos com IA</Botao>
        </div>

        {dados.riscos.length === 0 ? <Vazio>Cadastre riscos na aba anterior.</Vazio> : (
          <div className="overflow-x-auto">
            <div className="inline-grid gap-1" style={{ gridTemplateColumns: `90px repeat(${n}, minmax(64px, 1fr))` }}>
              {Array.from({ length: n }, (_, i) => n - i).map((p) => (
                <React.Fragment key={p}>
                  <div className="text-[11px] flex items-center pr-1" style={{ color: WORK.muted }}>{p} · {m.probabilidade[p - 1]}</div>
                  {Array.from({ length: n }, (_, j) => j + 1).map((s) => {
                    const nivel = m.classificar(s * p);
                    const qtd = naCelula(s, p).length;
                    const ativa = celula?.s === s && celula?.p === p;
                    return (
                      <button key={s} onClick={() => setCelula({ s, p })} className="h-14 rounded-md text-sm font-bold flex flex-col items-center justify-center"
                        style={{ background: NIVEIS[nivel].cor + (qtd ? "E6" : "40"), color: "#1F2328", outline: ativa ? `2px solid ${WORK.text}` : "none" }}>
                        {qtd || ""}
                        <span className="text-[10px] font-normal opacity-70">{s * p}</span>
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
              <div />
              {Array.from({ length: n }, (_, j) => (
                <div key={j} className="text-[11px] text-center pt-1" style={{ color: WORK.muted }}>{j + 1} · {m.severidade[j]}</div>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: WORK.muted }}>Linhas: probabilidade · Colunas: severidade · Número grande: quantidade de riscos</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {contagem.map(([k, q]) => (
            <div key={k} className="rounded-lg p-3" style={{ background: WORK.bg }}>
              <Etiqueta cor={NIVEIS[k].cor}>{NIVEIS[k].label}</Etiqueta>
              <p className="text-xl font-bold mt-1" style={{ color: WORK.text }}>{q}</p>
              <p className="text-[11px]" style={{ color: WORK.muted }}>{NIVEIS[k].acao}</p>
            </div>
          ))}
        </div>
      </Cartao>

      {celula && (
        <Cartao titulo={`Severidade ${celula.s} × Probabilidade ${celula.p} — ${selecionados.length} risco(s)`}>
          {selecionados.length === 0 && <Vazio>Nenhum risco nesta célula.</Vazio>}
          {selecionados.map((r) => (
            <button key={r.id} onClick={() => setEdit({ ...r })} className="w-full text-left flex items-center gap-2 rounded-lg p-2 mb-1 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
              <Etiqueta cor={TIPOS_RISCO[r.tipo]?.cor || "#94A3B8"}>{TIPOS_RISCO[r.tipo]?.label}</Etiqueta>
              {r.agente}
              <span className="text-xs" style={{ color: WORK.muted }}>· {dados.setores.find((s) => s.id === r.setor_id)?.nome || ""}</span>
            </button>
          ))}
        </Cartao>
      )}

      <div className="flex justify-end"><Botao tipo="primario" onClick={() => irPara("pcmso")}>Próximo: PCMSO →</Botao></div>
      {edit && <RiscoEditor risco={edit} setRisco={setEdit} dados={dados} onFechar={() => setEdit(null)} aoSalvar={recarregar} />}
    </div>
  );
}
