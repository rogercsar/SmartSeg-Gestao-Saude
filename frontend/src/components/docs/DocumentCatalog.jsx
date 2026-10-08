import React from "react";
import { DOC_GROUPS, DOC_TYPES } from "@/lib/documentCatalog";
import { Check, Lock, FileText } from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

export default function DocumentCatalog({ selected, onSelect }) {
  return (
    <div className="space-y-5">
      {DOC_GROUPS.map((g) => {
        const items = DOC_TYPES.filter((d) => d.group === g.id);
        return (
          <div key={g.id}>
            <div className="mb-2">
              <h3 className="text-sm font-semibold" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>
                {g.id}. {g.title}
              </h3>
              <p className="text-xs" style={{ color: WORK.muted }}>{g.desc}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((d) => {
                const active = selected === d.id;
                const planned = d.status === "planned";
                return (
                  <button
                    key={d.id}
                    disabled={planned}
                    onClick={() => onSelect(d.id)}
                    className="text-left rounded-lg border p-3 transition-colors disabled:cursor-not-allowed"
                    style={{
                      background: active ? "rgba(249,115,22,0.12)" : WORK.surface,
                      borderColor: active ? WORK.accent : WORK.border,
                      opacity: planned ? 0.5 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium" style={{ color: WORK.text }}>{d.label}</span>
                      {planned ? (
                        <Lock size={13} style={{ color: WORK.muted }} />
                      ) : active ? (
                        <Check size={14} style={{ color: WORK.accent }} />
                      ) : (
                        <FileText size={14} style={{ color: WORK.muted }} />
                      )}
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: WORK.muted }}>{d.desc}</p>
                    {planned && <span className="text-[10px] mt-1 inline-block" style={{ color: WORK.accent }}>Em breve</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}