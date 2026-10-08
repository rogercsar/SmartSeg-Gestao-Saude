import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { WORK, formatBRL } from "@/lib/finance";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ContratosSection({ onNovo, onEdit }) {
  const [contratos, setContratos] = useState([]);
  const [companies, setCompanies] = useState([]);

  const load = () => {
    Promise.all([
      base44.entities.ContratoCliente.filter({}).catch(() => []),
      base44.entities.Company.list("-created_date", 200).catch(() => []),
    ]).then(([c, cmp]) => { setContratos(c); setCompanies(cmp); });
  };
  useEffect(() => { load(); }, []);

  const nome = (id) => companies.find((c) => c.id === id)?.razao_social || "—";
  const remover = async (c) => { if (!confirm("Excluir contrato?")) return; await base44.entities.ContratoCliente.delete(c.id); load(); };

  return (
    <div className="rounded-lg border" style={{ background: WORK.surface, borderColor: WORK.border }}>
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: WORK.border }}>
        <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>Contratos</h3>
        <button onClick={onNovo} className="text-xs flex items-center gap-1 px-2 py-1 rounded"
          style={{ background: "rgba(11,111,168,0.1)", color: WORK.accent }}>
          <Plus size={12} /> Novo
        </button>
      </div>
      {contratos.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: WORK.muted }}>Nenhum contrato cadastrado.</p>
      ) : (
        <div className="divide-y" style={{ borderColor: WORK.border }}>
          {contratos.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: WORK.text }}>{nome(c.company_id)}</p>
                <p className="text-xs" style={{ color: WORK.muted }}>
                  Base {formatBRL(c.valor_base)} · {c.unidade_excedente} {c.limite_incluido} · {c.vigencia_inicio || "—"} a {c.vigencia_fim || "—"}
                </p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: c.status === "ativo" ? "rgba(22,163,74,0.12)" : "rgba(148,163,184,0.15)", color: c.status === "ativo" ? WORK.pos : WORK.muted }}>
                {c.status}
              </span>
              <button onClick={() => onEdit(c)} style={{ color: WORK.muted }}><Pencil size={14} /></button>
              <button onClick={() => remover(c)} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}