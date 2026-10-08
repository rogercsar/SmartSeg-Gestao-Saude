import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { History, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { WORK, TIPOS_RISCO } from "@/lib/sst";
import { Botao, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";

const dataBR = (d) => (d ? new Date(d + (d.length > 10 ? "" : "T12:00:00")).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: d.length > 10 ? "short" : undefined }) : "—");

export default function HistoricoInventario({ dados, recarregar }) {
  const [snapshots, setSnapshots] = useState(null);
  const [aberto, setAberto] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    try {
      const r = await base44.entities.InventarioSnapshot.filter({ company_id: dados.empresa.id }, { sort: "-data_snapshot", limit: 50 });
      setSnapshots(r.items || r);
    } finally { setCarregando(false); }
  };

  if (snapshots === null && !carregando) {
    carregar();
  }

  const excluir = async (id) => {
    if (!confirm("Excluir snapshot? O histórico do inventário deve ser preservado por 20 anos (NR-01).")) return;
    await base44.entities.InventarioSnapshot.delete(id);
    carregar();
  };

  return (
    <div className="space-y-4">
      <Cartao titulo="Histórico do inventário de riscos (NR-01, 1.5.7.3.3.1)"
        acoes={<Botao onClick={carregar} carregando={carregando}>Atualizar</Botao>}>
        <p className="text-xs" style={{ color: WORK.muted }}>
          A cada emissão do PGR, o sistema cria automaticamente um snapshot imutável do inventário de riscos, cargos e setores.
          O histórico deve ser preservado por, no mínimo, 20 anos. Os snapshots abaixo são apenas leitura — não editam os dados atuais.
        </p>
      </Cartao>

      {snapshots !== null && snapshots.length === 0 && <Cartao><Vazio>Nenhum snapshot ainda. Um snapshot é criado automaticamente quando o PGR é emitido (status "Emitido").</Vazio></Cartao>}

      <div className="space-y-2">
        {snapshots?.map((s) => {
          const inv = s.inventario || {};
          const riscos = inv.riscos || [];
          const resumo = s.resumo || {};
          const resp = s.responsavel_tecnico || {};
          return (
            <div key={s.id} className="rounded-lg border overflow-hidden" style={{ background: WORK.surface, borderColor: WORK.border }}>
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => setAberto(aberto === s.id ? null : s.id)} className="flex items-center gap-2 flex-1 text-left">
                  {aberto === s.id ? <ChevronDown size={16} style={{ color: WORK.muted }} /> : <ChevronRight size={16} style={{ color: WORK.muted }} />}
                  <History size={16} style={{ color: WORK.accent }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium" style={{ color: WORK.text }}>
                      Versão {s.versao || "—"} · {dataBR(s.data_snapshot)}
                    </span>
                    <p className="text-xs" style={{ color: WORK.muted }}>
                      {resumo.total_riscos ?? riscos.length} riscos · {resumo.total_cargos ?? (inv.cargos || []).length} cargos · {resumo.total_setores ?? (inv.setores || []).length} setores
                      {resp.nome ? ` · ${resp.nome}${resp.conselho ? ` ${resp.conselho}/${resp.uf || ""}` : ""}` : ""}
                    </p>
                  </div>
                </button>
                <button onClick={() => excluir(s.id)} style={{ color: WORK.muted }} title="Excluir snapshot"><Trash2 size={15} /></button>
              </div>
              {aberto === s.id && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: WORK.border }}>
                  {s.data_emissao && <p className="text-xs mt-3" style={{ color: WORK.muted }}>PGR emitido em {dataBR(s.data_emissao)}</p>}
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs" style={{ color: WORK.text }}>
                      <thead>
                        <tr style={{ color: WORK.muted }}>
                          <th className="text-left p-2">Tipo</th><th className="text-left p-2">Agente</th><th className="text-left p-2">Setor</th>
                          <th className="text-left p-2">Exposição</th><th className="text-left p-2">Intensidade</th><th className="text-left p-2">Nível</th><th className="text-left p-2">Avaliado em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riscos.length === 0 && <tr><td colSpan={7} className="p-2" style={{ color: WORK.muted }}>Sem riscos no snapshot.</td></tr>}
                        {riscos.map((r, i) => {
                          const setor = (inv.setores || []).find((s2) => s2.id === r.setor_id);
                          return (
                            <tr key={i} className="border-t" style={{ borderColor: WORK.border }}>
                              <td className="p-2"><Etiqueta cor={TIPOS_RISCO[r.tipo]?.cor || "#94A3B8"}>{TIPOS_RISCO[r.tipo]?.label || r.tipo}</Etiqueta></td>
                              <td className="p-2">{r.agente}{r.codigo_esocial ? ` (${r.codigo_esocial})` : ""}</td>
                              <td className="p-2">{setor?.nome || "—"}</td>
                              <td className="p-2">{r.exposicao || "—"}</td>
                              <td className="p-2">{r.intensidade ? `${r.intensidade} ${r.unidade_medida || ""}` : "—"}</td>
                              <td className="p-2">{r.nivel_risco || "—"}</td>
                              <td className="p-2">{r.data_avaliacao ? dataBR(r.data_avaliacao) : "—"}</td>
                            </tr>
                        );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}
            </div>
        );
        })}
      </div>
    </div>
);
}