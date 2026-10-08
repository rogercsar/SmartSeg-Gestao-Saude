import React, { useState } from "react";
import { Search, Building2, ChevronRight } from "lucide-react";

const WORK = {
  bg: "#F6F9FB",
  surface: "#FFFFFF",
  border: "#E3E8EE",
  accent: "#0B6FA8",
  text: "#1F2328",
  muted: "#5F6368",
};

const CRITERIA = [
  { id: "nome", label: "Nome/Código", field: "razao_social" },
  { id: "cnpj", label: "CNPJ", field: "cnpj" },
  { id: "cpf", label: "CPF", field: "cpf" },
  { id: "cei", label: "CEI", field: "cei" },
];

export default function LocalizarEmpresas({ companies, onOpen }) {
  const [criterion, setCriterion] = useState("nome");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);

  const search = () => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults(null);
      return;
    }
    const field = CRITERIA.find((c) => c.id === criterion).field;
    const filtered = companies.filter((c) => {
      const val = (c[field] || "").toString().toLowerCase();
      if (criterion === "nome") {
        // Nome/Código busca também por id
        return val.includes(q) || (c.id || "").toLowerCase().includes(q);
      }
      // CNPJ/CPF/CEI: ignora pontuação ao comparar
      const cleanQ = q.replace(/\D/g, "");
      const cleanVal = val.replace(/\D/g, "");
      return cleanVal.includes(cleanQ);
    });
    setResults(filtered);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: WORK.surface, borderColor: WORK.border }}>
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "#1a2638", borderBottom: `1px solid ${WORK.border}` }}>
        <span className="text-sm font-semibold" style={{ color: WORK.text }}>
          Localizar Empresas
        </span>
      </div>

      {/* Radio group */}
      <div className="px-4 pt-3 pb-2 flex flex-wrap gap-x-4 gap-y-2">
        {CRITERIA.map((c) => (
          <label key={c.id} className="flex items-center gap-1.5 cursor-pointer text-xs" style={{ color: WORK.muted }}>
            <input
              type="radio"
              name="criterion"
              checked={criterion === c.id}
              onChange={() => { setCriterion(c.id); setResults(null); }}
              className="accent-orange-500"
            />
            {c.label}
          </label>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <span className="text-xs shrink-0" style={{ color: WORK.muted }}>Empresa:</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Digite para buscar..."
          className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:border-orange-500"
          style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}
        />
        <button
          onClick={search}
          className="p-2 rounded-lg shrink-0"
          style={{ background: WORK.accent, color: "#FFFFFF" }}
        >
          <Search size={16} />
        </button>
        <div className="p-2 rounded-lg shrink-0" style={{ background: WORK.bg, border: `1px solid ${WORK.border}` }}>
          <Building2 size={16} style={{ color: WORK.muted }} />
        </div>
      </div>

      {/* Results */}
      {results !== null && (
        <div className="border-t" style={{ borderColor: WORK.border }}>
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm" style={{ color: WORK.muted }}>
              Nenhuma empresa encontrada.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onOpen?.(c)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-sky-50 border-b last:border-0"
                  style={{ borderColor: WORK.border }}
                >
                  <Building2 size={15} style={{ color: WORK.accent }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: WORK.text }}>{c.razao_social}</p>
                    <p className="text-xs" style={{ color: WORK.muted }}>
                      {c.cnpj ? `CNPJ ${c.cnpj}` : ""}
                      {c.cpf ? `CPF ${c.cpf}` : ""}
                      {c.cei ? ` · CEI ${c.cei}` : ""}
                      {c.uf ? ` · ${c.uf}` : ""}
                    </p>
                  </div>
                  <ChevronRight size={14} style={{ color: WORK.muted }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}