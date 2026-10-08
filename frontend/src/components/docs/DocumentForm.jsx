import React from "react";
import { DOC_BY_ID } from "@/lib/documentCatalog";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

const inputCls = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-orange-500";

export default function DocumentForm({
  docType, companies, cargos,
  selCompany, setSelCompany,
  selCargo, setSelCargo,
  formData, setFormData,
}) {
  const doc = DOC_BY_ID[docType];
  if (!doc) return null;
  const setField = (k, v) => setFormData((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Empresa</label>
          <select className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={selCompany} onChange={(e) => setSelCompany(e.target.value)}>
            <option value="">Selecione...</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
          </select>
        </div>
        {doc.needsCargo && (
          <div>
            <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>Cargo/função</label>
            <select className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={selCargo || cargos[0]?.id || ""} onChange={(e) => setSelCargo(e.target.value)} disabled={!selCompany}>
              <option value="">{cargos.length ? "Selecione..." : "Nenhum cargo"}</option>
              {cargos.map((c) => <option key={c.id} value={c.id}>{c.nome_cargo}</option>)}
            </select>
          </div>
        )}
      </div>
      {doc.fields?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {doc.fields.map((f) => (
            <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
              <label className="text-xs mb-1 block" style={{ color: WORK.muted }}>{f.label}</label>
              {f.type === "textarea" ? (
                <textarea rows={f.key === "nomes" ? 8 : 3} className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={formData[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder || ""} />
              ) : (
                <input type={f.type} className={inputCls} style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }} value={formData[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder || ""} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}