import React, { useState, useEffect } from "react";
import { rangePreset, loadAll, kpis, ticketPorCategoria, rentabilidadePorCategoria, rankingPrestadores, caixa, carteira } from "@/lib/dashboardData";
import { WORK } from "@/lib/sst";
import Filtros from "@/components/dashboard/Filtros";
import Kpis from "@/components/dashboard/Kpis";
import Rentabilidade from "@/components/dashboard/Rentabilidade";
import Caixa from "@/components/dashboard/Caixa";
import Carteira from "@/components/dashboard/Carteira";
import { LayoutDashboard, Loader2 } from "lucide-react";

export default function DashboardFinanceiro() {
  const [filtros, setFiltros] = useState({ preset: "trimestre", categoryId: "", providerId: "", customStart: "", customEnd: "" });
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const r = rangePreset(filtros.preset, filtros.customStart, filtros.customEnd);
    setLoading(true); setErro("");
    loadAll(r)
      .then((d) => setDados(d))
      .catch((e) => setErro(e?.message || "Falha ao carregar o dashboard."))
      .finally(() => setLoading(false));
  }, [filtros.preset, filtros.customStart, filtros.customEnd, filtros.categoryId, filtros.providerId]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <LayoutDashboard size={22} style={{ color: WORK.accent }} />
        <div>
          <h1 className="text-xl font-bold" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>Dashboard de Gestão Estratégica</h1>
          <p className="text-xs" style={{ color: WORK.muted }}>Receita, custos, margem, caixa e concentração de carteira</p>
        </div>
      </div>

      <Filtros filtros={filtros} setFiltros={setFiltros} cats={dados?.cats || []} providers={dados?.providers || []} />

      {loading ? (
        <div className="flex items-center justify-center py-20" style={{ color: WORK.muted }}>
          <Loader2 className="animate-spin" size={24} /> <span className="ml-2 text-sm">Carregando indicadores…</span>
        </div>
      ) : erro ? (
        <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "#F5C2C0", background: "#FDE8E8", color: "#B42318" }}>{erro}</div>
      ) : !dados ? null : (
        <>
          <Kpis kpis={kpis(dados.execs)} ticketCat={ticketPorCategoria(dados.execs, dados.cats)} />
          <Rentabilidade porCategoria={rentabilidadePorCategoria(dados.execs, dados.cats)} ranking={rankingPrestadores(dados.execs, dados.providers, dados.txs)} />
          <Caixa caixa={caixa(dados.txs)} />
          <Carteira carteira={carteira(dados.execs, dados.clients)} />
        </>
      )}
    </div>
  );
}