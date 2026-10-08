import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles } from "lucide-react";
import { WORK, TIPOS_RISCO, NR15_ANEXOS, NR16_ANEXOS, GRAUS_INSALUBRIDADE } from "@/lib/sst";
import { enquadrarLaudos } from "@/lib/programasIA";
import { Botao, Cartao, Etiqueta, Vazio, erroMsg } from "@/components/programas/ui";
import { RiscoEditor } from "@/components/programas/Riscos";

const ORDEM_GRAU = { minimo: 1, medio: 2, maximo: 3 };

// Conclusão por cargo (usada também na impressão dos laudos)
export function conclusaoCargo(riscos) {
  const ins = riscos.filter((r) => r.insalubridade?.caracteriza);
  const grau = ins.reduce((g, r) => (ORDEM_GRAU[r.insalubridade?.grau] > ORDEM_GRAU[g] ? r.insalubridade.grau : g), ins.length ? ins[0].insalubridade?.grau || "" : "");
  const per = riscos.filter((r) => r.periculosidade?.caracteriza);
  const apo = riscos.filter((r) => r.aposentadoria_especial?.enquadra);
  return { insalubre: ins.length > 0, grau, agentesInsalubres: ins, perigoso: per.length > 0, agentesPerigosos: per, aposentadoria: apo.length > 0, agentesApo: apo };
}

export default function Laudos({ dados, recarregar, irPara }) {
  const [ocupado, setOcupado] = useState("");
  const [edit, setEdit] = useState(null);
  const riscosDo = (c) => dados.riscos.filter((r) => (r.cargo_ids || []).includes(c.id));

  const iaEnquadrar = async (cargo) => {
    const riscos = riscosDo(cargo);
    if (!riscos.length) return alert("Este cargo não tem riscos vinculados.");
    const jaTem = riscos.some((r) => r.insalubridade?.fundamentacao || r.periculosidade?.fundamentacao || r.aposentadoria_especial?.fundamentacao);
    if (jaTem && !confirm("Alguns riscos já têm enquadramento. Substituir pela análise da IA?")) return;
    setOcupado(cargo.id);
    try {
      const itens = await enquadrarLaudos(cargo, riscos, dados.empresa);
      for (const it of itens) {
        if (!riscos.some((r) => r.id === it.id)) continue;
        await base44.entities.Risco.update(it.id, {
          insalubridade: it.insalubridade || {},
          periculosidade: it.periculosidade || {},
          aposentadoria_especial: it.aposentadoria_especial || {},
          revisado: false,
        });
      }
      recarregar();
    } catch (e) { erroMsg(e); } finally { setOcupado(""); }
  };

  if (!dados.cargos.length) return <Cartao><Vazio>Cadastre cargos na aba Estrutura.</Vazio></Cartao>;

  return (
    <div className="space-y-4">
      <Cartao>
        <p className="text-sm" style={{ color: WORK.text }}>
          A IA sugere o enquadramento de cada risco na NR-15 (insalubridade), NR-16 (periculosidade) e no Anexo IV do Decreto 3.048/99 (aposentadoria especial / LTCAT).
          A conclusão é do responsável técnico: revise cada item.
        </p>
        <p className="text-xs mt-1" style={{ color: WORK.muted }}>
          Agentes que dependem de medição (ruído, calor, químicos com LT, vibração) só devem ser caracterizados com avaliação quantitativa registrada.
          Adicionais de insalubridade não se somam (vale o maior grau) e o trabalhador opta entre insalubridade e periculosidade (CLT art. 193, §2º).
        </p>
      </Cartao>

      {dados.cargos.map((c) => {
        const riscos = riscosDo(c);
        const k = conclusaoCargo(riscos);
        return (
          <Cartao key={c.id} titulo={c.nome_cargo}
            acoes={<Botao tipo="primario" onClick={() => iaEnquadrar(c)} carregando={ocupado === c.id} title="2 créditos"><Sparkles size={14} /> Enquadrar com IA</Botao>}>
            <div className="flex flex-wrap gap-2 mb-3">
              <Etiqueta cor={k.insalubre ? "#F97316" : "#22C55E"}>{k.insalubre ? `Insalubre — grau ${GRAUS_INSALUBRIDADE[k.grau] || "a definir"}` : "Não insalubre"}</Etiqueta>
              <Etiqueta cor={k.perigoso ? "#EF4444" : "#22C55E"}>{k.perigoso ? "Periculosidade (30%)" : "Sem periculosidade"}</Etiqueta>
              <Etiqueta cor={k.aposentadoria ? "#A855F7" : "#22C55E"}>{k.aposentadoria ? "Enquadra aposentadoria especial" : "Não enquadra aposentadoria especial"}</Etiqueta>
            </div>
            {riscos.length === 0 && <Vazio>Nenhum risco vinculado.</Vazio>}
            <div className="overflow-x-auto">
              {riscos.length > 0 && (
                <table className="w-full text-xs" style={{ color: WORK.text }}>
                  <thead>
                    <tr style={{ color: WORK.muted }}>
                      <th className="text-left p-2">Agente</th><th className="text-left p-2">NR-15</th><th className="text-left p-2">NR-16</th><th className="text-left p-2">Anexo IV (LTCAT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riscos.map((r) => (
                      <tr key={r.id} className="border-t cursor-pointer hover:opacity-80" style={{ borderColor: WORK.border }} onClick={() => setEdit({ ...r })}>
                        <td className="p-2"><Etiqueta cor={TIPOS_RISCO[r.tipo]?.cor || "#94A3B8"}>{TIPOS_RISCO[r.tipo]?.label}</Etiqueta> {r.agente}</td>
                        <td className="p-2">{r.insalubridade?.caracteriza ? `${NR15_ANEXOS[r.insalubridade.anexo] || "Anexo ?"} · ${GRAUS_INSALUBRIDADE[r.insalubridade.grau] || ""}` : "—"}</td>
                        <td className="p-2">{r.periculosidade?.caracteriza ? NR16_ANEXOS[r.periculosidade.anexo] || "Anexo ?" : "—"}</td>
                        <td className="p-2">{r.aposentadoria_especial?.enquadra ? `Código ${r.aposentadoria_especial.codigo_anexo_iv || "?"}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Cartao>
        );
      })}
      <div className="flex justify-end"><Botao tipo="primario" onClick={() => irPara("documentos")}>Próximo: documentos →</Botao></div>
      {edit && <RiscoEditor risco={edit} setRisco={setEdit} dados={dados} onFechar={() => setEdit(null)} aoSalvar={recarregar} />}
    </div>
  );
}
