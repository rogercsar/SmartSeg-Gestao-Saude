import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/lib/AppState";
import { WORK } from "@/lib/sst";

// Empresa selecionada compartilhada entre os módulos (mesma do seletor do menu)
export function useEmpresa({ permitirTodas = false } = {}) {
  const { activeCompanyId, setActiveCompanyId } = useAppState();
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaIdLocal] = useState(activeCompanyId || "");

  useEffect(() => {
    base44.entities.Company.list("razao_social", 500).then((l) => {
      setEmpresas(l || []);
      if (!empresaId && !permitirTodas && l?.length) setEmpresaIdLocal(l[0].id);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (activeCompanyId && activeCompanyId !== empresaId) setEmpresaIdLocal(activeCompanyId); }, [activeCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setEmpresaId = (id) => { setEmpresaIdLocal(id); if (id) setActiveCompanyId(id); };
  return { empresas, empresaId, setEmpresaId, empresa: empresas.find((e) => e.id === empresaId) || null };
}

export function SeletorEmpresa({ empresas, empresaId, setEmpresaId, permitirTodas = false }) {
  return (
    <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}
      className="px-3 py-2 rounded-lg border text-sm min-w-[260px]" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
      {permitirTodas ? <option value="">Todas as empresas</option> : <option value="">Selecione a empresa…</option>}
      {empresas.map((e) => <option key={e.id} value={e.id}>{e.razao_social}</option>)}
    </select>
  );
}

export function Cabecalho({ titulo, subtitulo, children }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold" style={{ color: WORK.text }}>{titulo}</h1>
      {subtitulo && <p className="text-sm mt-1" style={{ color: WORK.muted }}>{subtitulo}</p>}
      {children && <div className="flex flex-wrap items-center gap-3 mt-4">{children}</div>}
    </div>
  );
}

export function Abas({ abas, aba, setAba }) {
  return (
    <div className="flex gap-1 overflow-x-auto mb-5 border-b" style={{ borderColor: WORK.border }}>
      {abas.map(([k, l]) => (
        <button key={k} onClick={() => setAba(k)} className="px-3 py-2 text-sm whitespace-nowrap"
          style={{ color: aba === k ? WORK.accent : WORK.muted, borderBottom: aba === k ? `2px solid ${WORK.accent}` : "2px solid transparent", fontWeight: aba === k ? 600 : 400 }}>{l}</button>
      ))}
    </div>
  );
}

export function Indicador({ rotulo, valor, cor, detalhe, onClick }) {
  return (
    <button onClick={onClick} className="rounded-lg border p-3 text-left w-full" style={{ background: WORK.surface, borderColor: WORK.border, cursor: onClick ? "pointer" : "default" }}>
      <p className="text-xs" style={{ color: WORK.muted }}>{rotulo}</p>
      <p className="text-2xl font-bold" style={{ color: cor || WORK.text }}>{valor}</p>
      {detalhe && <p className="text-[11px]" style={{ color: WORK.muted }}>{detalhe}</p>}
    </button>
  );
}
