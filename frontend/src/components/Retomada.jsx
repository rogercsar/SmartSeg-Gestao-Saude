import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { RotateCcw, ChevronRight } from "lucide-react";
import { WORK } from "@/lib/sst";
import { rotuloDe } from "@/lib/rotasRotulo";

function tempoDe(ts) {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

/**
 * Card "Continuar de onde parou": lê a última navegação persistida e, se ainda
 * for recente (7 dias) e não for a própria home, oferece um atalho de retorno.
 */
export default function Retomada({ empresas = [] }) {
  const [alvo, setAlvo] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("smartseg:lastNav");
      if (!raw) return;
      const obj = JSON.parse(raw);
      const rotulo = obj.rotulo || rotuloDe(obj.path);
      if (!obj.path || obj.path === "/" || !rotulo) return;
      if (Date.now() - (obj.ts || 0) > 7 * 86400000) return;
      const emp = obj.companyId ? empresas.find((e) => e.id === obj.companyId) : null;
      setAlvo({ path: obj.path, rotulo, empresaNome: emp?.razao_social || null, ts: obj.ts });
    } catch {
      /* ignora */
    }
  }, [empresas]);

  if (!alvo) return null;

  return (
    <Link
      to={alvo.path}
      className="block rounded-xl border p-3.5 mb-5 hover:shadow-sm transition-shadow"
      style={{ background: "#fff", borderColor: WORK.border }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(11,111,168,0.10)" }}
        >
          <RotateCcw size={17} style={{ color: WORK.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px]" style={{ color: WORK.muted }}>
            Continuar de onde parou · {tempoDe(alvo.ts)}
          </p>
          <p className="text-sm font-semibold truncate" style={{ color: WORK.text }}>
            {alvo.rotulo}
            {alvo.empresaNome && (
              <span style={{ color: WORK.muted, fontWeight: 400 }}> · {alvo.empresaNome}</span>
            )}
          </p>
        </div>
        <ChevronRight size={16} style={{ color: WORK.muted }} />
      </div>
    </Link>
  );
}