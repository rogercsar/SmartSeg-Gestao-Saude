import React, { useState, useEffect } from "react";
import { Library, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { WORK } from "@/lib/sst";
import { Botao, Modal, Vazio } from "@/components/programas/ui";
import { carregarCatalogos } from "@/lib/catalogoSst";
import { gerarInventarioDoCatalogo, aplicarInventarioDoCatalogo, textosPgrDoCatalogo } from "@/lib/gerarPgrCatalogo";

export default function GerarPgrCatalogo({ aberto, dados, recarregar, onFechar, onConcluido }) {
  const [cat, setCat] = useState(null);
  const [etapa, setEtapa] = useState("init");
  const [mapping, setMapping] = useState([]);
  const [sel, setSel] = useState({});
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => { if (aberto) carregarCatalogos().then(setCat).catch(() => {}); }, [aberto]);

  const catRisk = (id) => cat?.riscos.find((r) => r.id === id);
  const catExame = (id) => cat?.exames.find((e) => e.id === id);

  const iniciar = async () => {
    setEtapa("mapeando"); setErro("");
    try {
      const r = await gerarInventarioDoCatalogo(dados, cat);
      const s = {};
      r.forEach((m) => {
        s[m.cargo_id] = {};
        (m.risco_catalogo_ids || []).forEach((rid) => { if (catRisk(rid)) s[m.cargo_id][rid] = true; });
      });
      setMapping(r); setSel(s); setEtapa("preview");
    } catch (e) { setErro(e.message || "Falha na geração."); setEtapa("erro"); }
  };

  const aplicar = async () => {
    setEtapa("aplicando"); setErro("");
    try {
      const filtrado = Object.entries(sel)
        .filter(([, rs]) => Object.values(rs).some(Boolean))
        .map(([cid, rs]) => ({ cargo_id: cid, risco_catalogo_ids: Object.entries(rs).filter(([, v]) => v).map(([rid]) => rid) }));
      const r = await aplicarInventarioDoCatalogo(dados, filtrado, cat);
      const textos = textosPgrDoCatalogo(dados);
      setResumo(r); setEtapa("pronto");
      onConcluido?.(textos);
      recarregar?.();
    } catch (e) { setErro(e.message || "Falha ao aplicar."); setEtapa("erro"); }
  };

  const toggle = (cid, rid) => setSel((s) => ({ ...s, [cid]: { ...(s[cid] || {}), [rid]: !s[cid]?.[rid] } }));

  if (!aberto) return null;

  const cargosComSel = Object.entries(sel).filter(([, rs]) => Object.keys(rs).length);
  const totalSel = cargosComSel.reduce((acc, [, rs]) => acc + Object.values(rs).filter(Boolean).length, 0);
  const cargosAtivos = cargosComSel.filter(([, rs]) => Object.values(rs).some(Boolean)).length;

  const rodape = etapa === "preview"
    ? <><Botao onClick={onFechar}>Cancelar</Botao><Botao tipo="primario" onClick={aplicar} disabled={!totalSel}>Aplicar e gerar PGR</Botao></>
    : etapa === "pronto"
      ? <Botao tipo="primario" onClick={onFechar}>Concluir</Botao>
      : (etapa !== "mapeando" && etapa !== "aplicando" ? <Botao onClick={onFechar}>Fechar</Botao> : null);

  return (
    <Modal aberto onFechar={onFechar} titulo="Gerar PGR a partir do catálogo compartilhado" largura="max-w-3xl" rodape={rodape}>
      <div className="space-y-3">
        {!cat
          ? <div className="flex items-center gap-2 text-sm py-6 justify-center" style={{ color: WORK.muted }}><Loader2 size={16} className="animate-spin" /> Carregando catálogo…</div>
          : cat.riscos.length === 0
            ? <Vazio>Nenhum risco no catálogo. Cadastre riscos em Catálogos SST primeiro.</Vazio>
            : dados.cargos.length === 0
              ? <Vazio>Cadastre cargos e atividades na aba Estrutura antes de gerar o PGR.</Vazio>
              : etapa === "init" ? (
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: WORK.text }}>
                    Este recurso cruza o catálogo compartilhado de riscos e exames com os cargos e atividades da empresa para montar o inventário de riscos, vincular os exames do PCMSO e preencher os textos normativos do PGR (NR-01, NR-9, NR-15/16, Decreto 3.048/99 e eSocial — Tabelas 24/27).
                  </p>
                  <ul className="text-xs list-disc pl-5 space-y-1" style={{ color: WORK.muted }}>
                    <li>{cat.riscos.length} risco(s) no catálogo · {cat.exames.length} exame(s)</li>
                    <li>{dados.cargos.length} cargo(s) na empresa</li>
                    <li>Os registros criados ficam como rascunho, aguardando revisão técnica.</li>
                  </ul>
                  <Botao tipo="primario" onClick={iniciar}><Library size={14} /> Iniciar geração (1 crédito IA)</Botao>
                </div>
              ) : etapa === "mapeando" ? (
                <div className="flex items-center gap-2 text-sm py-8 justify-center" style={{ color: WORK.muted }}><Loader2 size={16} className="animate-spin" /> Analisando cargos e selecionando riscos no catálogo…</div>
              ) : etapa === "preview" ? (
                <div className="space-y-3">
                  <p className="text-xs" style={{ color: WORK.muted }}>Revise os riscos selecionados por cargo (toque para desmarcar). Os exames associados a cada risco serão incluídos no PCMSO.</p>
                  {cargosAtivos === 0 && <Vazio>Nenhum risco selecionado. A IA não encontrou correspondências claras; cadastre riscos manualmente.</Vazio>}
                  {cargosComSel.map(([cid, rs]) => {
                    const cargo = dados.cargos.find((c) => c.id === cid);
                    const selectedIds = Object.entries(rs).filter(([, v]) => v).map(([rid]) => rid);
                    if (!selectedIds.length) return null;
                    return (
                      <div key={cid} className="rounded-lg border p-3" style={{ borderColor: WORK.border, background: WORK.bg }}>
                        <div className="font-medium text-sm mb-1.5" style={{ color: WORK.text }}>
                          {cargo?.nome_cargo} <span className="text-xs font-normal" style={{ color: WORK.muted }}>· {(cargo?.atividades || "sem atividades").slice(0, 120)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedIds.map((rid) => {
                            const rc = catRisk(rid);
                            const exs = (rc?.exame_ids || []).map((eid) => catExame(eid)?.exame).filter(Boolean);
                            return (
                              <button key={rid} onClick={() => toggle(cid, rid)} className="px-2 py-1 rounded-full text-[11px] border flex items-center gap-1"
                                style={{ borderColor: WORK.accent, color: WORK.accent, background: "#fff" }}
                                title={exs.length ? `Exames que serão incluídos: ${exs.join(", ")}` : ""}>
                                ✓ {rc?.agente}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs" style={{ color: WORK.muted }}>{totalSel} risco(s) selecionado(s) em {cargosAtivos} cargo(s).</p>
                </div>
              ) : etapa === "aplicando" ? (
                <div className="flex items-center gap-2 text-sm py-8 justify-center" style={{ color: WORK.muted }}><Loader2 size={16} className="animate-spin" /> Criando riscos, exames e preenchendo textos do PGR…</div>
              ) : etapa === "pronto" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2" style={{ color: "#22C55E" }}><CheckCircle2 size={18} /> <b className="text-sm">PGR gerado a partir do catálogo!</b></div>
                  <ul className="text-sm space-y-0.5" style={{ color: WORK.text }}>
                    <li>{resumo?.riscosCriados || 0} risco(s) criado(s) no inventário</li>
                    <li>{resumo?.examesCriados || 0} exame(s) incluído(s) no PCMSO</li>
                    <li>{resumo?.cargosAfetados || 0} cargo(s) abrangido(s)</li>
                  </ul>
                  <p className="text-xs" style={{ color: WORK.muted }}>Textos introdutórios e normativos preenchidos. Revise as pendências documentais e a validação técnica do responsável antes de emitir o PGR.</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm" style={{ color: "#B42318" }}><AlertTriangle size={16} /> {erro}</div>
              )}
      </div>
    </Modal>
  );
}