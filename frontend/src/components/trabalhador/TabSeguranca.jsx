import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Shield, HardHat, FileWarning } from "lucide-react";

const WORK = {
  bg: "#F6F9FB", surface: "#FFFFFF", border: "#E3E8EE",
  accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368",
};

const RISCO_CORES = {
  fisico: "#f59e0b", quimico: "#84cc16", biologico: "#ec4899",
  ergonomico: "#8b5cf6", acidente: "#ef4444", psicossocial: "#06b6d4",
};

export default function TabSeguranca({ trabalhador, cargo }) {
  const [riscos, setRiscos] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rc, ct] = await Promise.all([
          base44.entities.Risco.filter({ company_id: trabalhador.company_id, cargo_ids: { $in: [trabalhador.cargo_id] } }),
          base44.entities.OcorrenciaAcidente.filter({ trabalhador_id: trabalhador.id }),
        ]);
        setRiscos(rc || []);
        setCats(ct || []);
      } catch (e) {}
      setLoading(false);
    })();
  }, [trabalhador.id]);

  if (loading) return <div className="text-center py-8" style={{ color: WORK.muted }}>Carregando...</div>;

  // EPIs únicos dos riscos + cargo (dedupe por nome)
  const episCargo = (cargo?.epis_obrigatorios || []).map((e) => ({ nome: e, ca: "" }));
  const mergedEpis = [...riscos.flatMap((r) => r.epi || []), ...episCargo];
  const allEpis = Array.from(new Map(mergedEpis.map((e) => [e.nome, e])).values());

  return (
    <div className="space-y-5">
      {/* Riscos de exposição */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} style={{ color: WORK.accent }} />
          <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>Riscos de exposição</h3>
        </div>
        {riscos.length === 0 ? (
          <div className="rounded-lg border p-4 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <p className="text-sm" style={{ color: WORK.muted }}>Nenhum risco vinculado ao cargo {cargo?.nome_cargo || "—"}.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {riscos.map((r) => (
              <div key={r.id} className="rounded-lg border p-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: WORK.text }}>{r.agente}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${RISCO_CORES[r.tipo] || WORK.muted}22`, color: RISCO_CORES[r.tipo] || WORK.muted }}>{r.tipo}</span>
                </div>
                <div className="text-xs space-y-0.5" style={{ color: WORK.muted }}>
                  {r.fonte_geradora && <p>Fonte: {r.fonte_geradora}</p>}
                  {r.intensidade && <p>Intensidade: {r.intensidade} {r.unidade_medida || ""}</p>}
                  {r.exposicao && <p>Exposição: {r.exposicao.replace("_", " ")}</p>}
                  {r.nivel_risco && <p style={{ color: WORK.accent }}>Classificação: {r.nivel_risco}</p>}
                  {r.insalubridade?.caracteriza && <p style={{ color: "#fbbf24" }}>Insalubridade: {r.insalubridade.grau || ""} — Anexo {r.insalubridade.anexo || ""}</p>}
                  {r.periculosidade?.caracteriza && <p style={{ color: "#ef4444" }}>Periculosidade: {r.periculosidade.anexo || ""}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EPIs recomendados */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <HardHat size={16} style={{ color: WORK.accent }} />
          <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>EPIs recomendados</h3>
        </div>
        {allEpis.length === 0 ? (
          <div className="rounded-lg border p-4 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <p className="text-sm" style={{ color: WORK.muted }}>Nenhum EPI cadastrado para o cargo.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allEpis.map((e, i) => (
              <div key={i} className="rounded-lg border px-3 py-2" style={{ background: WORK.surface, borderColor: WORK.border }}>
                <span className="text-sm" style={{ color: WORK.text }}>{e.nome}</span>
                {e.ca && <span className="text-xs ml-2" style={{ color: WORK.muted }}>CA: {e.ca}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EPCs */}
      {riscos.some((r) => r.epc?.length > 0) && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} style={{ color: WORK.accent }} />
            <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>EPCs (proteção coletiva)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {riscos.flatMap((r) => r.epc || []).map((epc, i) => (
              <div key={i} className="rounded-lg border px-3 py-2" style={{ background: WORK.surface, borderColor: WORK.border }}>
                <span className="text-sm" style={{ color: WORK.text }}>{epc.nome}</span>
                {epc.eficaz !== undefined && (
                  <span className="text-xs ml-2" style={{ color: epc.eficaz ? "#22c55e" : "#ef4444" }}>{epc.eficaz ? "eficaz" : "ineficaz"}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATs registradas */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileWarning size={16} style={{ color: WORK.accent }} />
          <h3 className="font-semibold text-sm" style={{ color: WORK.text }}>CATs registradas</h3>
        </div>
        {cats.length === 0 ? (
          <div className="rounded-lg border p-4 text-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <p className="text-sm" style={{ color: WORK.muted }}>Nenhuma CAT registrada para este trabalhador.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cats.map((c) => (
              <div key={c.id} className="rounded-lg border p-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: WORK.text }}>{c.data_hora || "Sem data"}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: c.afastamento ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)", color: c.afastamento ? "#ef4444" : "#22c55e" }}>
                    {c.afastamento ? "Com afastamento" : "Sem afastamento"}
                  </span>
                </div>
                <p className="text-xs" style={{ color: WORK.muted }}>{c.descricao}</p>
                {c.natureza_lesao && <p className="text-xs mt-1" style={{ color: WORK.muted }}>Natureza: {c.natureza_lesao}</p>}
                <p className="text-[10px] mt-1" style={{ color: WORK.muted }}>Status: {c.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}