import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search } from "lucide-react";
import { WORK, TIPOS_RISCO, MOMENTOS_EXAME } from "@/lib/sst";
import { Modal, Vazio } from "@/components/programas/ui";

function Busca({ busca, setBusca, placeholder }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border" style={{ background: WORK.bg, borderColor: WORK.border }}>
      <Search size={16} style={{ color: WORK.muted }} />
      <input
        autoFocus
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-sm outline-none"
        style={{ background: "transparent", color: WORK.text }}
      />
    </div>
  );
}

export function SeletorCatalogoRisco({ tipoFiltro, onSelecionar, onFechar }) {
  const [busca, setBusca] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = tipoFiltro ? { tipo: tipoFiltro } : {};
    base44.entities.RiscoCatalogo.filter(q, { sort: "agente", limit: 300 })
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tipoFiltro]);

  const termo = busca.trim().toLowerCase();
  const filtrados = items.filter(
    (i) =>
      !termo ||
      (i.agente || "").toLowerCase().includes(termo) ||
      (i.descricao || "").toLowerCase().includes(termo) ||
      (i.codigo_esocial || "").toLowerCase().includes(termo)
  );

  return (
    <Modal aberto onFechar={onFechar} titulo="Selecionar risco do catálogo" largura="max-w-2xl">
      <Busca busca={busca} setBusca={setBusca} placeholder="Buscar agente, descrição ou código eSocial..." />
      <div className="max-h-[55vh] overflow-y-auto space-y-1">
        {loading && <Vazio>Carregando...</Vazio>}
        {!loading && filtrados.length === 0 && <Vazio>Nenhum item no catálogo. Cadastre em Catálogos SST.</Vazio>}
        {!loading &&
          filtrados.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelecionar(it)}
              className="w-full text-left rounded-lg p-3 border hover:bg-sky-50"
              style={{ borderColor: WORK.border }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: (TIPOS_RISCO[it.tipo]?.cor || "#94A3B8") + "26", color: TIPOS_RISCO[it.tipo]?.cor || "#94A3B8" }}
                >
                  {TIPOS_RISCO[it.tipo]?.label || it.tipo}
                </span>
                <b style={{ color: WORK.text }}>{it.agente}</b>
                {it.codigo_esocial && <span className="text-[11px]" style={{ color: WORK.accent }}>eSocial {it.codigo_esocial}</span>}
              </div>
              {it.descricao && <p className="text-xs mt-1" style={{ color: WORK.muted }}>{it.descricao}</p>}
              {it.codigo_esocial_descricao && <p className="text-[11px] mt-0.5" style={{ color: WORK.muted }}>{it.codigo_esocial_descricao}</p>}
            </button>
          ))}
      </div>
    </Modal>
  );
}

export function SeletorCatalogoExame({ onSelecionar, onFechar }) {
  const [busca, setBusca] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ExameCatalogo.filter({ ativo: true }, { sort: "exame", limit: 300 })
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const termo = busca.trim().toLowerCase();
  const filtrados = items.filter(
    (i) =>
      !termo ||
      (i.exame || "").toLowerCase().includes(termo) ||
      (i.descricao || "").toLowerCase().includes(termo) ||
      (i.codigo_esocial || "").toLowerCase().includes(termo)
  );

  return (
    <Modal aberto onFechar={onFechar} titulo="Selecionar exame do catálogo" largura="max-w-2xl">
      <Busca busca={busca} setBusca={setBusca} placeholder="Buscar exame, descrição ou código eSocial..." />
      <div className="max-h-[55vh] overflow-y-auto space-y-1">
        {loading && <Vazio>Carregando...</Vazio>}
        {!loading && filtrados.length === 0 && <Vazio>Nenhum item no catálogo. Cadastre em Catálogos SST.</Vazio>}
        {!loading &&
          filtrados.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelecionar(it)}
              className="w-full text-left rounded-lg p-3 border hover:bg-sky-50"
              style={{ borderColor: WORK.border }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <b style={{ color: WORK.text }}>{it.exame}</b>
                {it.codigo_esocial && <span className="text-[11px]" style={{ color: WORK.accent }}>eSocial {it.codigo_esocial}</span>}
                {it.periodicidade_meses && <span className="text-[11px]" style={{ color: WORK.muted }}>a cada {it.periodicidade_meses}m</span>}
              </div>
              {it.descricao && <p className="text-xs mt-1" style={{ color: WORK.muted }}>{it.descricao}</p>}
              {it.codigo_esocial_descricao && <p className="text-[11px] mt-0.5" style={{ color: WORK.muted }}>{it.codigo_esocial_descricao}</p>}
            </button>
          ))}
      </div>
    </Modal>
  );
}

export { MOMENTOS_EXAME };