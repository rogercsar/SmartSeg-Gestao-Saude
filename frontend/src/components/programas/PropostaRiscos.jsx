import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { WORK, TIPOS_RISCO, avaliar } from "@/lib/sst";
import { Modal, Botao, Etiqueta, Vazio } from "@/components/programas/ui";

// Revisão dos riscos propostos pela IA antes de gravar.
// O usuário escolhe quais aceitar e a quais cargos (GHE) se aplicam.
export default function PropostaRiscos({ aberto, onFechar, riscos = [], observacoes, dados, setorId, cargoIds = [], origem = "ia", aoSalvar }) {
  const [marcados, setMarcados] = useState([]);
  const [cargos, setCargos] = useState(cargoIds);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) { setMarcados(riscos.map((_, i) => i)); setCargos(cargoIds); }
  }, [aberto, riscos]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargosDoSetor = dados.cargos.filter((c) => !setorId || !c.setor_id || c.setor_id === setorId);
  const existentes = dados.riscos.filter((r) => r.setor_id === setorId).map((r) => (r.agente || "").toLowerCase().trim());

  const salvar = async () => {
    setSalvando(true);
    try {
      const novos = marcados.map((i) => riscos[i]).map((r) => ({
        ...r,
        company_id: dados.empresa.id,
        setor_id: setorId || "",
        cargo_ids: cargos,
        origem,
        revisado: false,
      }));
      if (novos.length) await base44.entities.Risco.bulkCreate(novos);
      aoSalvar?.();
      onFechar();
    } catch (e) {
      alert("Não foi possível salvar: " + (e?.message || ""));
    } finally {
      setSalvando(false);
    }
  };

  const alternar = (i) => setMarcados((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]));
  const alternarCargo = (id) => setCargos((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Riscos sugeridos pela IA — revise antes de salvar"
      rodape={<>
        <Botao onClick={onFechar}>Cancelar</Botao>
        <Botao tipo="primario" onClick={salvar} carregando={salvando} disabled={!marcados.length}>Adicionar {marcados.length} risco(s)</Botao>
      </>}>
      {observacoes && (
        <div className="rounded-lg p-3 mb-4 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
          <b>Observações da IA:</b> {observacoes}
        </div>
      )}
      <p className="text-xs mb-2" style={{ color: WORK.muted }}>Aplicar aos cargos (GHE):</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {cargosDoSetor.length === 0 && <span className="text-xs" style={{ color: WORK.muted }}>Nenhum cargo neste setor — cadastre na aba Estrutura.</span>}
        {cargosDoSetor.map((c) => (
          <button key={c.id} onClick={() => alternarCargo(c.id)} className="px-2.5 py-1 rounded-full text-xs border"
            style={{ borderColor: cargos.includes(c.id) ? WORK.accent : WORK.border, color: cargos.includes(c.id) ? WORK.accent : WORK.muted }}>
            {c.nome_cargo}
          </button>
        ))}
      </div>
      {riscos.length === 0 && <Vazio>A IA não identificou riscos.</Vazio>}
      <div className="space-y-2">
        {riscos.map((r, i) => {
          const av = avaliar(r, "5x5");
          const repetido = existentes.includes((r.agente || "").toLowerCase().trim());
          return (
            <label key={i} className="flex gap-3 rounded-lg border p-3 cursor-pointer" style={{ borderColor: marcados.includes(i) ? WORK.accent : WORK.border, background: WORK.bg }}>
              <input type="checkbox" className="mt-1" checked={marcados.includes(i)} onChange={() => alternar(i)} />
              <div className="flex-1 min-w-0 text-sm" style={{ color: WORK.text }}>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Etiqueta cor={TIPOS_RISCO[r.tipo]?.cor || "#94A3B8"}>{TIPOS_RISCO[r.tipo]?.label || r.tipo}</Etiqueta>
                  <b>{r.agente}</b>
                  {av && <Etiqueta cor={av.cor}>{av.label} ({av.valor})</Etiqueta>}
                  {repetido && <Etiqueta cor="#94A3B8">já existe no setor</Etiqueta>}
                </div>
                <p className="text-xs" style={{ color: WORK.muted }}>
                  Fonte: {r.fonte_geradora || "—"} · Danos: {r.possiveis_danos || "—"}
                  {r.codigo_esocial ? ` · eSocial ${r.codigo_esocial}` : ""}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </Modal>
  );
}
