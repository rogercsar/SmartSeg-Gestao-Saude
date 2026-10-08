import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, X, Search } from "lucide-react";

const WORK = {
  bg: "#F6F9FB",
  surface: "#FFFFFF",
  border: "#E3E8EE",
  accent: "#0B6FA8",
  text: "#1F2328",
  muted: "#5F6368",
};

// Cache module-level: cada tabela é carregada uma vez por sessão.
const cache = {};

export default function ComboboxCodigoEsocial({
  tabela,
  value,
  onChange,
  onChangeItem,
  placeholder = "Buscar código...",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (cache[tabela]) {
      setItems(cache[tabela]);
      return;
    }
    setLoading(true);
    base44.entities.CodigoEsocial.filter({ tabela }, { limit: 1000, sort: "codigo" })
      .then((res) => {
        const arr = res.items || res || [];
        cache[tabela] = arr;
        setItems(arr);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tabela]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selecionado = items.find((i) => i.codigo === value);
  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? items
        .filter(
          (i) =>
            (i.codigo || "").toLowerCase().includes(termo) ||
            (i.descricao || "").toLowerCase().includes(termo)
        )
        .slice(0, 60)
    : items.slice(0, 60);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div
        className="flex items-center gap-1 w-full px-3 py-2 rounded-lg border text-sm cursor-pointer"
        style={{
          background: WORK.bg,
          borderColor: open ? WORK.accent : WORK.border,
          color: selecionado ? WORK.text : WORK.muted,
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex-1 truncate">
          {selecionado
            ? `${selecionado.codigo} — ${selecionado.descricao}`
            : value || placeholder}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              onChangeItem?.(null);
            }}
            style={{ color: WORK.muted }}
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown size={14} style={{ color: WORK.muted }} />
      </div>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg border shadow-xl overflow-hidden"
          style={{ background: WORK.surface, borderColor: WORK.border }}
        >
          <div className="p-2 border-b flex items-center gap-2" style={{ borderColor: WORK.border }}>
            <Search size={14} style={{ color: WORK.muted }} />
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por código ou descrição..."
              className="w-full text-sm outline-none"
              style={{ background: "transparent", color: WORK.text }}
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {loading && (
              <div className="px-3 py-4 text-sm text-center" style={{ color: WORK.muted }}>
                Carregando...
              </div>
            )}
            {!loading && filtrados.length === 0 && (
              <div className="px-3 py-4 text-sm text-center" style={{ color: WORK.muted }}>
                Nenhum código encontrado.
              </div>
            )}
            {!loading &&
              filtrados.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.codigo);
                    onChangeItem?.(item);
                    setOpen(false);
                    setBusca("");
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-sky-50 border-b"
                  style={{ borderColor: WORK.border, color: WORK.text }}
                >
                  <span style={{ color: WORK.accent, fontWeight: 600 }}>{item.codigo}</span>
                  {" — "}
                  <span>{item.descricao}</span>
                  {item.grupo && (
                    <span className="ml-1" style={{ color: WORK.muted }}>
                      ({item.grupo})
                    </span>
                  )}
                </button>
              ))}
          </div>
          {!loading && items.length > 60 && (
            <div className="px-3 py-1.5 text-[11px] border-t" style={{ borderColor: WORK.border, color: WORK.muted }}>
              {items.length} códigos · refine a busca para ver mais
            </div>
          )}
        </div>
      )}
    </div>
  );
}