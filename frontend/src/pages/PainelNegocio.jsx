import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { acaoCreditos } from "@/lib/ai";
import { WORK } from "@/lib/sst";
import { brl, num } from "@/lib/precos";
import { hojeLocal, addDias, dataBR } from "@/lib/sstGestao";
import { Cartao, Etiqueta, Vazio } from "@/components/programas/ui";
import { Cabecalho, Indicador } from "@/components/sst/useEmpresa";

const DOCS = { pgr: "PGR", pcmso: "PCMSO", ltcat: "LTCAT", insalubridade: "Laudo de insalubridade", periculosidade: "Laudo de periculosidade" };
const inicioMes = () => hojeLocal().slice(0, 7) + "-01";

// Painel do negócio de SST: carteira, renovações a vender, produção da equipe e consumo
export default function PainelNegocio() {
  const [d, setD] = useState(null);
  useEffect(() => {
    (async () => {
      const lst = (e, ord, lim = 5000) => base44.entities[e].list(ord, lim).catch(() => []);
      const [empresas, trabalhadores, programas, treinos, emitidos, trilha, contratos, consumo] = await Promise.all([
        lst("Company", "razao_social"), lst("Trabalhador"), lst("ProgramaSST"), lst("Treinamento"),
        lst("Autenticacao", "-emitido_em", 2000), lst("TrilhaDocumento", "-created_date", 3000), lst("ContratoCliente"),
        acaoCreditos("consumo", { inicio: inicioMes(), fim: hojeLocal() }).catch(() => ({ usos: [] })),
      ]);
      setD({ empresas, trabalhadores, programas, treinos, emitidos, trilha, contratos, usos: consumo.usos || [] });
    })();
  }, []);

  const r = useMemo(() => {
    if (!d) return null;
    const h = hojeLocal(), em90 = addDias(h, 90), mes = inicioMes();
    const nomeEmp = Object.fromEntries(d.empresas.map((e) => [e.id, e.razao_social]));
    const ativos = d.trabalhadores.filter((t) => t.status !== "inativo");
    const porEmpresa = {};
    ativos.forEach((t) => { porEmpresa[t.company_id] = (porEmpresa[t.company_id] || 0) + 1; });
    // renovações: programas e laudos vencendo em 90 dias e treinamentos vencendo em 90 dias (receita a vender)
    const renovDocs = d.programas.filter((p) => p.vigencia_ate && p.vigencia_ate <= em90).map((p) => ({ empresa: nomeEmp[p.company_id] || "—", item: DOCS[p.tipo] || p.tipo, data: p.vigencia_ate }));
    const treinoGrupo = {};
    d.treinos.filter((t) => t.validade && t.validade <= em90).forEach((t) => { const k = `${t.company_id}|${t.nr}`; treinoGrupo[k] ||= { empresa: nomeEmp[t.company_id] || "—", item: `Reciclagem ${t.nr}`, data: t.validade, qtd: 0 }; treinoGrupo[k].qtd++; if (t.validade < treinoGrupo[k].data) treinoGrupo[k].data = t.validade; });
    const renovacoes = [...renovDocs, ...Object.values(treinoGrupo).map((x) => ({ ...x, item: `${x.item} (${x.qtd} pessoa${x.qtd > 1 ? "s" : ""})` }))].sort((a, b) => a.data.localeCompare(b.data));
    // produção da equipe no mês: documentos emitidos (com código de autenticidade) e edições registradas na trilha
    const prod = {};
    d.emitidos.filter((e) => (e.emitido_em || "") >= mes).forEach((e) => { const k = e.emitido_por?.email || e.emitido_por?.nome || "—"; prod[k] ||= { pessoa: k, emitidos: 0, edicoes: 0, ia: 0 }; prod[k].emitidos++; });
    d.trilha.filter((t) => (t.created_date || "") >= mes).forEach((t) => { const k = t.usuario_email || t.usuario_nome || "—"; prod[k] ||= { pessoa: k, emitidos: 0, edicoes: 0, ia: 0 }; if (t.evento === "ia_sugeriu") prod[k].ia++; else if (t.evento === "editado") prod[k].edicoes++; });
    const creditos = d.usos.reduce((s, u) => s + (u.creditos || 0), 0);
    const receitaContratos = d.contratos.filter((c) => c.status !== "encerrado" && c.status !== "cancelado").reduce((s, c) => s + (Number(c.valor_base) || 0), 0);
    const semPgr = d.empresas.filter((e) => !d.programas.some((p) => p.company_id === e.id && p.tipo === "pgr" && p.status === "emitido"));
    return { ativos: ativos.length, porEmpresa, nomeEmp, renovacoes, prod: Object.values(prod).sort((a, b) => b.emitidos - a.emitidos), creditos, receitaContratos, semPgr,
      emitidosMes: d.emitidos.filter((e) => (e.emitido_em || "") >= mes).length };
  }, [d]);

  if (!r) return <div className="p-4 md:p-8 max-w-6xl mx-auto"><Cabecalho titulo="Painel do negócio" /><Vazio>Carregando…</Vazio></div>;
  const h = hojeLocal();
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Cabecalho titulo="Painel do negócio" subtitulo="Carteira de clientes, renovações a vender, produção da equipe e consumo de IA do mês." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <Indicador rotulo="Empresas atendidas" valor={num(d.empresas.length)} detalhe={`${num(r.ativos)} colaboradores ativos`} />
        <Indicador rotulo="Receita de contratos (mês)" valor={brl(r.receitaContratos)} detalhe="contratos ativos cadastrados em Financeiro" />
        <Indicador rotulo="Renovações em 90 dias" valor={num(r.renovacoes.length)} cor="#0B6FA8" detalhe="documentos e reciclagens a vender" />
        <Indicador rotulo="Documentos emitidos no mês" valor={num(r.emitidosMes)} detalhe={`${num(r.creditos)} créditos de IA usados`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Cartao titulo="Renovações a vender (próximos 90 dias)">
          {r.renovacoes.length === 0 && <Vazio>Nada vencendo nos próximos 90 dias.</Vazio>}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {r.renovacoes.slice(0, 80).map((x, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm rounded-lg p-2" style={{ background: WORK.bg, color: WORK.text }}>
                <span className="flex-1 min-w-[180px]">{x.item}<span className="block text-xs" style={{ color: WORK.muted }}>{x.empresa}</span></span>
                <Etiqueta cor={x.data < h ? "#B42318" : "#8A5A00"}>{x.data < h ? "vencido " : ""}{dataBR(x.data)}</Etiqueta>
              </div>
            ))}
          </div>
        </Cartao>

        <Cartao titulo="Produção da equipe no mês">
          {r.prod.length === 0 && <Vazio>Sem documentos emitidos ou editados neste mês.</Vazio>}
          {r.prod.length > 0 && (
            <table className="w-full text-sm" style={{ color: WORK.text }}>
              <thead><tr className="text-xs" style={{ color: WORK.muted }}><th className="text-left p-2">Profissional</th><th className="p-2">Emitidos</th><th className="p-2">Edições</th><th className="p-2">Sugestões IA</th></tr></thead>
              <tbody>{r.prod.map((p) => <tr key={p.pessoa} className="border-t" style={{ borderColor: WORK.border }}><td className="p-2">{p.pessoa}</td><td className="p-2 text-center">{p.emitidos}</td><td className="p-2 text-center">{p.edicoes}</td><td className="p-2 text-center">{p.ia}</td></tr>)}</tbody>
            </table>
          )}
          <p className="text-[11px] mt-2" style={{ color: WORK.muted }}>Fonte: trilha de autoria e códigos de autenticidade dos documentos.</p>
        </Cartao>

        <Cartao titulo="Clientes sem PGR emitido">
          {r.semPgr.length === 0 && <Vazio>Todas as empresas têm PGR emitido.</Vazio>}
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {r.semPgr.map((e) => (
              <Link key={e.id} to="/programas" className="flex items-center gap-2 text-sm rounded-lg p-2" style={{ background: WORK.bg, color: WORK.text }}>
                <span className="flex-1">{e.razao_social}</span><span className="text-xs" style={{ color: WORK.muted }}>{num(r.porEmpresa[e.id] || 0)} colaboradores</span>
              </Link>
            ))}
          </div>
        </Cartao>

        <Cartao titulo="Maiores clientes (colaboradores ativos)">
          <div className="space-y-1">
            {Object.entries(r.porEmpresa).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, n]) => (
              <div key={id} className="flex items-center gap-2 text-sm rounded-lg p-2" style={{ background: WORK.bg, color: WORK.text }}>
                <span className="flex-1">{r.nomeEmp[id] || "—"}</span><b>{num(n)}</b>
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-2" style={{ color: WORK.muted }}>Consumo detalhado de IA por usuário: <Link to="/consumo" style={{ color: WORK.accent }}>Consumo e fatura</Link>. Situação de cada cliente para a fiscalização: <a href="/dossie" target="_blank" rel="noreferrer" style={{ color: WORK.accent }}>Dossiê</a>.</p>
        </Cartao>
      </div>
    </div>
  );
}
