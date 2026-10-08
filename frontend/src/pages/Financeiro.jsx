import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  WORK, mesAnoAtual, nomeMes, mesAnterior,
  carregarDashboard, gerarContasPrestadores,
} from "@/lib/finance";
import { ChevronLeft, Plus, CalendarCheck, Sparkles } from "lucide-react";
import DashboardCards from "@/components/financeiro/DashboardCards";
import TopClientes from "@/components/financeiro/TopClientes";
import AlertasFin from "@/components/financeiro/AlertasFin";
import LancamentosLista from "@/components/financeiro/LancamentosLista";
import ContratosSection from "@/components/financeiro/ContratosSection";
import PrestadoresSection from "@/components/financeiro/PrestadoresSection";
import LancamentoForm from "@/components/financeiro/LancamentoForm";
import ContratoForm from "@/components/financeiro/ContratoForm";
import PrestadorForm from "@/components/financeiro/PrestadorForm";
import FechamentoMes from "@/components/financeiro/FechamentoMes";

export default function Financeiro() {
  const [mesAno, setMesAno] = useState(mesAnoAtual());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [modal, setModal] = useState(null);
  const [edit, setEdit] = useState(null);

  const reload = () => {
    setLoading(true);
    carregarDashboard(base44, mesAno)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { reload(); }, [mesAno, reloadKey]);

  const gerar = async () => {
    const r = await gerarContasPrestadores(base44, mesAno);
    alert(r.gerados ? `${r.gerados} conta(s) gerada(s) de ${r.total} prestador(es).` : "Todas as contas do mês já existem.");
    setReloadKey((k) => k + 1);
  };

  const abrir = (m, e = null) => { setEdit(e); setModal(m); };
  const fechar = () => { setModal(null); setEdit(null); };
  const salvo = () => { fechar(); setReloadKey((k) => k + 1); };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>Financeiro e margem</h1>
          <p className="text-sm" style={{ color: WORK.muted }}>Saiba se a operação dá lucro — por mês e por cliente.</p>
          <a href="/dashboard-financeiro" className="text-xs underline" style={{ color: WORK.accent }}>Abrir o dashboard estratégico (caixa, rentabilidade e carteira)</a>
        </div>
        <div className="flex items-center gap-1 border rounded-lg p-1" style={{ borderColor: WORK.border, background: WORK.surface }}>
          <button onClick={() => setMesAno(mesAnterior(mesAno))} style={{ color: WORK.muted }}><ChevronLeft size={18} /></button>
          <span className="text-sm font-medium px-3" style={{ color: WORK.text }}>{nomeMes(mesAno)}</span>
          {mesAno !== mesAnoAtual() && (
            <button onClick={() => setMesAno(mesAnoAtual())} className="text-xs px-2" style={{ color: WORK.accent }}>Hoje</button>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => abrir("fechamento")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: WORK.border, color: WORK.text, background: WORK.surface }}>
          <CalendarCheck size={14} /> Fechamento do mês
        </button>
        <button onClick={gerar} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: WORK.border, color: WORK.text, background: WORK.surface }}>
          <Sparkles size={14} /> Gerar contas dos prestadores
        </button>
        <button onClick={() => abrir("lanc")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: WORK.accent, color: "#fff" }}>
          <Plus size={14} /> Novo lançamento
        </button>
        <button onClick={() => abrir("contrato")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: WORK.border, color: WORK.accent, background: WORK.surface }}>
          <Plus size={14} /> Novo contrato
        </button>
        <button onClick={() => abrir("prestador")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border" style={{ borderColor: WORK.border, color: WORK.accent, background: WORK.surface }}>
          <Plus size={14} /> Novo prestador
        </button>
      </div>

      {loading ? (
        <p className="text-sm py-8 text-center" style={{ color: WORK.muted }}>Carregando…</p>
      ) : data ? (
        <>
          <div className="mb-4"><DashboardCards d={data} /></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <TopClientes topClientes={data.topClientes} />
            <AlertasFin alertas={data.alertas} />
          </div>
          <LancamentosLista mesAno={mesAno} reloadKey={reloadKey} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <ContratosSection onNovo={() => abrir("contrato")} onEdit={(c) => abrir("contrato", c)} />
            <PrestadoresSection onNovo={() => abrir("prestador")} onEdit={(p) => abrir("prestador", p)} />
          </div>
        </>
      ) : null}

      {modal === "lanc" && <LancamentoForm onClose={fechar} onSaved={salvo} editando={edit} companies={data?.companies} prestadores={data?.prestadores} />}
      {modal === "contrato" && <ContratoForm onClose={fechar} onSaved={salvo} editando={edit} companies={data?.companies} />}
      {modal === "prestador" && <PrestadorForm onClose={fechar} onSaved={salvo} editando={edit} />}
      {modal === "fechamento" && <FechamentoMes mesAno={mesAno} onClose={fechar} onSaved={salvo} />}
    </div>
  );
}