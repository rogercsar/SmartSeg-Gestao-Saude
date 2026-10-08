import React, { useState } from "react";
import { WORK } from "@/lib/sst";
import { copiarEstrutura } from "@/lib/estruturaCopia";
import { Modal, Botao } from "@/components/programas/ui";
import { Copy, CheckCircle2 } from "lucide-react";

// Modal para copiar setores (com cargos, riscos, exames e caracterizações) para outra unidade
export default function CopiarHierarquia({ aberto, onClose, dados, onConcluido }) {
  const { unidades, setores, cargos, riscos, exames } = dados;
  const [unidadeDestino, setUnidadeDestino] = useState("");
  const [selecionados, setSelecionados] = useState({});
  const [copiando, setCopiando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const setoresResumo = setores.map((s) => {
    const unidade = unidades.find((u) => u.id === s.unidade_id);
    const cargosDoSetor = cargos.filter((c) => c.setor_id === s.id);
    const cargoIds = cargosDoSetor.map((c) => c.id);
    const riscosDoSetor = riscos.filter((r) => (r.cargo_ids || []).some((cid) => cargoIds.includes(cid)));
    const examesDoSetor = exames.filter((e) => cargoIds.includes(e.cargo_id));
    return { setor: s, unidadeNome: unidade?.nome || "Sem unidade", cargos: cargosDoSetor.length, riscos: riscosDoSetor.length, exames: examesDoSetor.length };
  });

  const toggle = (id) => setSelecionados((s) => ({ ...s, [id]: !s[id] }));
  const selecionadosList = setoresResumo.filter((r) => selecionados[r.setor.id]);

  const confirmar = async () => {
    if (!unidadeDestino) return alert("Selecione a unidade de destino.");
    if (selecionadosList.length === 0) return alert("Selecione ao menos um setor para copiar.");
    setCopiando(true);
    setResultado(null);
    try {
      const counts = await copiarEstrutura({
        companyId: dados.empresa.id,
        unidadeDestinoId: unidadeDestino,
        setoresSelecionados: selecionadosList.map((r) => r.setor),
      });
      setResultado(counts);
      onConcluido();
    } catch (e) {
      alert("Erro ao copiar: " + (e?.message || ""));
    } finally {
      setCopiando(false);
    }
  };

  const fechar = () => {
    setResultado(null);
    setSelecionados({});
    setUnidadeDestino("");
    onClose();
  };

  return (
    <Modal
      aberto={aberto}
      onFechar={fechar}
      titulo="Copiar hierarquia para outra unidade"
      largura="max-w-2xl"
      rodape={
        resultado ? (
          <Botao tipo="primario" onClick={fechar}>Concluir</Botao>
        ) : (
          <>
            <Botao onClick={fechar}>Cancelar</Botao>
            <Botao tipo="primario" onClick={confirmar} carregando={copiando} disabled={!unidadeDestino || selecionadosList.length === 0}>
              <Copy size={14} /> Copiar {selecionadosList.length} setor(es)
            </Botao>
          </>
        )
      }
    >
      {resultado ? (
        <div className="text-center py-6">
          <CheckCircle2 size={40} className="mx-auto mb-3" style={{ color: "#22C55E" }} />
          <p className="text-sm font-medium mb-3" style={{ color: WORK.text }}>Hierarquia copiada com sucesso!</p>
          <div className="flex justify-center gap-4 text-xs" style={{ color: WORK.muted }}>
            <span>{resultado.setores} setores</span>
            <span>{resultado.cargos} cargos</span>
            <span>{resultado.riscos} riscos</span>
            <span>{resultado.exames} exames</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: WORK.muted }}>Unidade de destino *</label>
            <select
              value={unidadeDestino}
              onChange={(e) => setUnidadeDestino(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
            >
              <option value="">Selecione…</option>
              {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
            <p className="text-xs mt-1" style={{ color: WORK.muted }}>
              Serão criadas cópias de setores, cargos, riscos e exames (com caracterizações) na unidade escolhida. Os registros existentes não são alterados.
            </p>
          </div>

          <div>
            <label className="block text-xs mb-2" style={{ color: WORK.muted }}>Setores para copiar</label>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {setoresResumo.length === 0 && <p className="text-sm" style={{ color: WORK.muted }}>Nenhum setor cadastrado.</p>}
              {setoresResumo.map((r) => (
                <label key={r.setor.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer" style={{ background: selecionados[r.setor.id] ? "rgba(11,111,168,0.06)" : WORK.bg, borderColor: WORK.border }}>
                  <input type="checkbox" checked={!!selecionados[r.setor.id]} onChange={() => toggle(r.setor.id)} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium" style={{ color: WORK.text }}>{r.setor.nome}</span>
                    <span className="text-xs" style={{ color: WORK.muted }}> · {r.unidadeNome}</span>
                  </div>
                  <span className="text-xs flex gap-2" style={{ color: WORK.muted }}>
                    <span>{r.cargos} cargos</span>
                    <span>{r.riscos} riscos</span>
                    <span>{r.exames} exames</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}