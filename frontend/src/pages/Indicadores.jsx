import React, { useState, useEffect } from "react";
import { useAppState } from "@/lib/AppState";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  Stethoscope, ClipboardCheck, ShieldCheck, FileText, AlertTriangle,
  HeartPulse, Building2, ClipboardList, Activity, FileBarChart,
  Users,
} from "lucide-react";

const THEME = {
  bg: "#f9f9fb",
  surface: "#FFFFFF",
  border: "#e5e7eb",
  text: "#333333",
  muted: "#6b7280",
  primary: "#1e5d8a",
  green: "#28a745",
  yellow: "#ffc107",
  red: "#dc3545",
};

const PIE_COLORS = ["#1e5d8a", "#28a745", "#ffc107", "#dc3545", "#8B5CF6", "#06B6D4"];

function IndicatorCard({ icon: Icon, title, subtitle, value, color, children }) {
  return (
    <div className="rounded-xl border p-5 flex flex-col" style={{ background: THEME.surface, borderColor: THEME.border, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-tight" style={{ color: THEME.text }}>{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: THEME.muted }}>{subtitle}</p>}
        </div>
        {value !== undefined && (
          <span className="text-2xl font-bold" style={{ color }}>{value}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function MiniBarChart({ data, dataKey = "count", color = THEME.primary }) {
  if (!data || data.length === 0) return <p className="text-xs py-4 text-center" style={{ color: THEME.muted }}>Sem dados</p>;
  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} opacity={0.5} />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: THEME.muted }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: THEME.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 11, color: THEME.text }} labelStyle={{ color: THEME.muted }} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniPieChart({ data }) {
  if (!data || data.length === 0) return <p className="text-xs py-4 text-center" style={{ color: THEME.muted }}>Sem dados</p>;
  return (
    <ResponsiveContainer width="100%" height={120}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={45} innerRadius={25}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 11, color: THEME.text }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function monthKeyToDateBucket(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return { year: d.getFullYear(), month: d.getMonth() };
}

function buildMonthlyData(records, dateField) {
  const now = new Date();
  const buckets = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    buckets[key] = { label: MONTH_LABELS[d.getMonth()], count: 0, _sort: d.getTime() };
  }
  records.forEach((r) => {
    const b = monthKeyToDateBucket(r[dateField]);
    if (!b) return;
    const key = `${b.year}-${b.month}`;
    if (buckets[key]) buckets[key].count++;
  });
  return Object.values(buckets).sort((a, b) => a._sort - b._sort).map(({ label, count }) => ({ label, count }));
}

export default function Indicadores() {
  const { activeCompanyId } = useAppState();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const q = activeCompanyId ? { company_id: activeCompanyId } : {};
      const result = {};

      try {
        // 1. Convocação de Exames — ExamePcmso ativos
        const exames = await base44.entities.ExamePcmso.filter(
          { ...q, ativo: true },
          { limit: 500, fields: ["exame", "momentos", "created_date"] }
        );
        const examesItems = exames.items || exames || [];
        result.convocacao = {
          total: examesItems.length,
          chart: buildMonthlyData(examesItems, "created_date"),
        };
      } catch { result.convocacao = { total: 0, chart: [] }; }

      try {
        // 2. Exames Realizados — Atestado com motivo = trabalho (ASO periódico proxy)
        const atestados = await base44.entities.Atestado.filter(q, { limit: 500, fields: ["data_inicio", "motivo", "dias", "beneficio_inss"] });
        const atestItems = atestados.items || atestados || [];
        result.examesRealizados = {
          total: atestItems.length,
          chart: buildMonthlyData(atestItems, "data_inicio"),
        };

        // 6. Atestado de Saúde
        result.atestadoSaude = {
          total: atestItems.length,
          chart: buildMonthlyData(atestItems, "data_inicio"),
        };

        // 7. Afastamento INSS
        const afastInss = atestItems.filter((a) => a.beneficio_inss && a.beneficio_inss !== "");
        const inssStatus = {};
        afastInss.forEach((a) => {
          const k = a.beneficio_inss || "aguardando";
          inssStatus[k] = (inssStatus[k] || 0) + 1;
        });
        const inssLabels = { aguardando: "Aguardando", b31: "B31 (15d)", b91: "B91 (91d+)", indeferido: "Indeferido" };
        result.afastamentoInss = {
          total: afastInss.length,
          chart: Object.entries(inssStatus).map(([k, v]) => ({ label: inssLabels[k] || k, count: v })),
        };
      } catch { result.examesRealizados = { total: 0, chart: [] }; result.atestadoSaude = { total: 0, chart: [] }; result.afastamentoInss = { total: 0, chart: [] }; }

      try {
        // 3. Entrega de EPI — GeneratedDocument ficha_epi
        const docs = await base44.entities.GeneratedDocument.filter(
          { ...q, tipo_documento: { $in: ["ficha_epi", "ordem_servico"] } },
          { limit: 500, fields: ["tipo_documento", "created_date", "status"] }
        );
        const docItems = docs.items || docs || [];
        const epis = docItems.filter((d) => d.tipo_documento === "ficha_epi");
        result.entregaEpi = {
          total: epis.length,
          chart: buildMonthlyData(epis, "created_date"),
        };

        // 4. ASOs Emitidos — GeneratedDocument (proxy: ordem_servico) ou Atestado
        const asos = docItems.filter((d) => d.tipo_documento === "ordem_servico");
        result.asosEmitidos = {
          total: asos.length,
          chart: buildMonthlyData(asos, "created_date"),
        };
      } catch { result.entregaEpi = { total: 0, chart: [] }; result.asosEmitidos = { total: 0, chart: [] }; }

      try {
        // 5. Acidentes — OcorrenciaAcidente
        const acidentes = await base44.entities.OcorrenciaAcidente.filter(q, { limit: 500, fields: ["data_hora", "status", "afastamento"] });
        const acItems = acidentes.items || acidentes || [];
        const statusCount = {};
        acItems.forEach((a) => {
          const k = a.status || "rascunho";
          statusCount[k] = (statusCount[k] || 0) + 1;
        });
        const statusLabels = { rascunho: "Rascunho", em_investigacao: "Em investigação", concluida: "Concluída" };
        result.acidentes = {
          total: acItems.length,
          chart: Object.entries(statusCount).map(([k, v]) => ({ label: statusLabels[k] || k, count: v })),
          monthly: buildMonthlyData(acItems, "data_hora"),
        };
      } catch { result.acidentes = { total: 0, chart: [], monthly: [] }; }

      try {
        // 8. PGR — ProgramaSST tipo pgr
        const programas = await base44.entities.ProgramaSST.filter(
          { ...q, tipo: { $in: ["pgr", "pcmso", "ltcat"] } },
          { limit: 200, fields: ["tipo", "status", "data_emissao"] }
        );
        const progItems = programas.items || programas || [];
        const pgrs = progItems.filter((p) => p.tipo === "pgr");
        const statusCount = {};
        pgrs.forEach((p) => {
          const k = p.status || "rascunho";
          statusCount[k] = (statusCount[k] || 0) + 1;
        });
        result.pgr = {
          total: pgrs.length,
          chart: Object.entries(statusCount).map(([k, v]) => ({ label: k === "emitido" ? "Emitido" : "Rascunho", count: v })),
        };
      } catch { result.pgr = { total: 0, chart: [] }; }

      try {
        // Treinamentos — for context
        const treins = await base44.entities.Treinamento.filter(q, { limit: 500, fields: ["data_realizacao", "nr"] });
        const treItems = treins.items || treins || [];
        result.treinamentos = {
          total: treItems.length,
          chart: buildMonthlyData(treItems, "data_realizacao"),
        };
      } catch { result.treinamentos = { total: 0, chart: [] }; }

      // 9 & 10 — Questionários PROART e HSE (sem entidade própria ainda)
      result.proart = { total: 0, chart: [], empty: true };
      result.hse = { total: 0, chart: [], empty: true };

      if (!cancelled) setData(result);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [activeCompanyId]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto" style={{ background: THEME.bg, minHeight: "100%" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: THEME.primary }}>
          <FileBarChart size={20} color="#fff" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: THEME.text, fontFamily: "Inter, sans-serif" }}>
            Relatórios e Indicadores
          </h1>
          <p className="text-sm" style={{ color: THEME.muted }}>
            Indicadores de SST da empresa ativa · dados consolidados em tempo real
          </p>
        </div>
      </div>

      {!activeCompanyId && (
        <div className="rounded-lg border p-4 mb-6 text-sm flex items-center gap-2" style={{ background: "#fff7ed", borderColor: "#fed7aa", color: THEME.red }}>
          <AlertTriangle size={16} />
          Selecione uma empresa na barra lateral para ver os indicadores filtrados.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: THEME.border, borderTopColor: THEME.primary }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Convocação de Exames */}
          <IndicatorCard
            icon={Stethoscope}
            title="Convocação de Exames"
            subtitle="Exames do PCMSO ativos"
            value={data.convocacao?.total || 0}
            color={THEME.primary}
          >
            <MiniBarChart data={data.convocacao?.chart} color={THEME.primary} />
          </IndicatorCard>

          {/* 2. Exames Realizados */}
          <IndicatorCard
            icon={ClipboardCheck}
            title="Exames Realizados"
            subtitle="Atestados e ASOs registrados"
            value={data.examesRealizados?.total || 0}
            color={THEME.green}
          >
            <MiniBarChart data={data.examesRealizados?.chart} color={THEME.green} />
          </IndicatorCard>

          {/* 3. Entrega de EPI */}
          <IndicatorCard
            icon={ShieldCheck}
            title="Entrega de EPI"
            subtitle="Fichas de EPI geradas"
            value={data.entregaEpi?.total || 0}
            color="#0891B2"
          >
            <MiniBarChart data={data.entregaEpi?.chart} color="#0891B2" />
          </IndicatorCard>

          {/* 4. ASOs Emitidos */}
          <IndicatorCard
            icon={FileText}
            title="ASOs Emitidos"
            subtitle="Atestados de Saúde Ocupacional"
            value={data.asosEmitidos?.total || 0}
            color="#7C3AED"
          >
            <MiniBarChart data={data.asosEmitidos?.chart} color="#7C3AED" />
          </IndicatorCard>

          {/* 5. Acidentes */}
          <IndicatorCard
            icon={AlertTriangle}
            title="Acidentes"
            subtitle="Ocorrências registradas"
            value={data.acidentes?.total || 0}
            color={THEME.red}
          >
            {data.acidentes?.chart?.length > 0 ? (
              <MiniPieChart data={data.acidentes.chart} />
            ) : (
              <p className="text-xs py-4 text-center" style={{ color: THEME.muted }}>Sem dados</p>
            )}
          </IndicatorCard>

          {/* 6. Atestado de Saúde */}
          <IndicatorCard
            icon={HeartPulse}
            title="Atestado de Saúde"
            subtitle="Atestados médicos registrados"
            value={data.atestadoSaude?.total || 0}
            color="#0D9488"
          >
            <MiniBarChart data={data.atestadoSaude?.chart} color="#0D9488" />
          </IndicatorCard>

          {/* 7. Afastamento INSS */}
          <IndicatorCard
            icon={Building2}
            title="Afastamento INSS"
            subtitle="Benefícios em tramitação"
            value={data.afastamentoInss?.total || 0}
            color={THEME.yellow}
          >
            {data.afastamentoInss?.chart?.length > 0 ? (
              <MiniPieChart data={data.afastamentoInss.chart} />
            ) : (
              <p className="text-xs py-4 text-center" style={{ color: THEME.muted }}>Sem afastamentos</p>
            )}
          </IndicatorCard>

          {/* 8. PGR */}
          <IndicatorCard
            icon={ClipboardList}
            title="PGR"
            subtitle="Programas de Gerenciamento de Risco"
            value={data.pgr?.total || 0}
            color={THEME.primary}
          >
            {data.pgr?.chart?.length > 0 ? (
              <MiniPieChart data={data.pgr.chart} />
            ) : (
              <p className="text-xs py-4 text-center" style={{ color: THEME.muted }}>Nenhum PGR cadastrado</p>
            )}
          </IndicatorCard>

          {/* 9. Questionário PROART (ergonomia) */}
          <IndicatorCard
            icon={Activity}
            title="Questionário PROART"
            subtitle="Avaliação ergonômica (AET)"
            value={data.proart?.total || 0}
            color="#EC4899"
          >
            <div className="flex flex-col items-center justify-center py-4">
              <p className="text-xs text-center" style={{ color: THEME.muted }}>
                Módulo de avaliação ergonômica ainda não configurado.
              </p>
            </div>
          </IndicatorCard>

          {/* 10. Questionário HSE */}
          <IndicatorCard
            icon={Activity}
            title="Questionário HSE"
            subtitle="Health, Safety & Environment"
            value={data.hse?.total || 0}
            color="#14B8A6"
          >
            <div className="flex flex-col items-center justify-center py-4">
              <p className="text-xs text-center" style={{ color: THEME.muted }}>
                Módulo de questionário HSE ainda não configurado.
              </p>
            </div>
          </IndicatorCard>
        </div>
      )}

      {/* Resumo geral */}
      {!loading && (
        <div className="mt-6 rounded-xl border p-5" style={{ background: THEME.surface, borderColor: THEME.border, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} style={{ color: THEME.primary }} />
            <h2 className="text-sm font-semibold" style={{ color: THEME.text }}>Resumo geral</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs" style={{ color: THEME.muted }}>Exames ativos</p>
              <p className="text-lg font-bold" style={{ color: THEME.text }}>{data.convocacao?.total || 0}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: THEME.muted }}>EPIs entregues</p>
              <p className="text-lg font-bold" style={{ color: THEME.text }}>{data.entregaEpi?.total || 0}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: THEME.muted }}>Acidentes</p>
              <p className="text-lg font-bold" style={{ color: data.acidentes?.total > 0 ? THEME.red : THEME.text }}>
                {data.acidentes?.total || 0}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: THEME.muted }}>Afastamentos INSS</p>
              <p className="text-lg font-bold" style={{ color: THEME.text }}>{data.afastamentoInss?.total || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}