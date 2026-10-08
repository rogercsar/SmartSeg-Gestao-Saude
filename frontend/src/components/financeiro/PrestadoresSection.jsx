import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { WORK, formatBRL } from "@/lib/finance";
import { Plus, Pencil, Trash2 } from "lucide-react";

const TIPOS = { laboratorio: "Laboratório", sistema: "Sistema", medico: "Médico", consultoria: "Consultoria", aluguel: "Aluguel", outro: "Outro" };

export default function PrestadoresSection({ onNovo, onEdit }) {
  const [prestadores, setPrestadores] = useState([]);

  const load = () => {
    base44.entities.Prestador.filter({}).catch(() => []).then(setPrestadores);
  };
  useEffect(() => { load(); }, []);

  const remover = async (p) => { if (!confirm("Excluir prestador?")) return; await base44.entities.Prestador.delete(p.id); load(); };

  return (
    <div className="rounded-lg border" style={{ background: WORK.surface, borderColor: WORK.border }}>
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: WORK.border }}>
        <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>Prestadores / Fornecedores</h3>
        <button onClick={onNovo} className="text-xs flex items-center gap-1 px-2 py-1 rounded"
          style={{ background: "rgba(11,111,168,0.1)", color: WORK.accent }}>
          <Plus size={12} /> Novo
        </button>
      </div>
      {prestadores.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: WORK.muted }}>Nenhum prestador cadastrado.</p>
      ) : (
        <div className="divide-y" style={{ borderColor: WORK.border }}>
          {prestadores.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: WORK.text }}>{p.nome}</p>
                <p className="text-xs" style={{ color: WORK.muted }}>
                  {TIPOS[p.tipo_servico] || p.tipo_servico} · {formatBRL(p.valor_recorrente_mensal)}/mês · venc. dia {p.dia_vencimento}
                </p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: p.status === "ativo" ? "rgba(22,163,74,0.12)" : "rgba(148,163,184,0.15)", color: p.status === "ativo" ? WORK.pos : WORK.muted }}>
                {p.status}
              </span>
              <button onClick={() => onEdit(p)} style={{ color: WORK.muted }}><Pencil size={14} /></button>
              <button onClick={() => remover(p)} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}