import React, { useEffect, useMemo, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Eye, EyeOff, Download, CheckCircle2, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { WORK, soNumeros } from "@/lib/sst";
import { analisarAtestados, indicadoresFap, MOTIVOS, dataBR, addDias, hojeLocal } from "@/lib/afastamentos";
import { linkTemporario } from "@/lib/privateFiles";
import { Botao, Campo, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";
import NovoAtestado from "@/components/atestados/NovoAtestado";
import { useAppState } from "@/lib/AppState";
import PerfilEpidemiologico from "@/components/atestados/PerfilEpidemiologico";
import Relatorios from "@/components/atestados/Relatorios";
import SimuladorFap from "@/components/atestados/SimuladorFap";

const hojeS = () => hojeLocal();
const brl = (v) => (v === null || v === undefined ? "—" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }));
const ABAS = [["lista", "Atestados"], ["esocial", "eSocial S-2230"], ["painel", "Perfil e absenteísmo"], ["relatorios", "Relatórios"], ["fap", "FAP"]];

export default function Atestados() {
  const [empresas, setEmpresas] = useState([]);
  const { activeCompanyId, setActiveCompanyId } = useAppState();
  const [empresaId, setEmpresaId] = useState(activeCompanyId || "");
  const [d, setD] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [aba, setAba] = useState("lista");
  const [edit, setEdit] = useState(null);
  const [verCid, setVerCid] = useState(false);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    base44.entities.Company.list("razao_social", 500).then((l) => {
      setEmpresas(l || []);
      if (!empresaId && l?.length === 1) setEmpresaId(l[0].id);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recarregar = useCallback(async () => {
    if (!empresaId) { setD(null); return; }
    if (empresaId !== activeCompanyId) setActiveCompanyId(empresaId);
    setCarregando(true);
    try {
      const [empresa, atestados, trabalhadores, cargos, setores, cats] = await Promise.all([
        base44.entities.Company.get(empresaId),
        base44.entities.Atestado.filter({ company_id: empresaId }, "-data_inicio", 2000).catch(() => []),
        base44.entities.Trabalhador.filter({ company_id: empresaId }).catch(() => []),
        base44.entities.CargoFuncao.filter({ company_id: empresaId }).catch(() => []),
        base44.entities.Setor.filter({ company_id: empresaId }).catch(() => []),
        base44.entities.OcorrenciaAcidente.filter({ company_id: empresaId }).catch(() => []),
      ]);
      setD({ empresa, atestados, trabalhadores, cargos, setores, cats });
    } finally { setCarregando(false); }
  }, [empresaId]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const analise = useMemo(() => (d ? analisarAtestados(d.atestados) : {}), [d]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: WORK.text }}>Atestados e afastamentos</h1>
      <p className="text-sm mb-5" style={{ color: WORK.muted }}>Lance o atestado em segundos; o SmartSeg calcula prazos do eSocial (S-2230), soma da mesma doença em 60 dias, INSS, exame de retorno e impacto no FAP.</p>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className="px-3 py-2 rounded-lg border text-sm min-w-[260px]" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}>
          <option value="">Selecione a empresa…</option>
          {empresas.map((e) => <option key={e.id} value={e.id}>{e.razao_social}</option>)}
        </select>
        {d && <Botao tipo="primario" onClick={() => setEdit({})}><Plus size={14} /> Novo atestado</Botao>}
        {carregando && <Loader2 size={16} className="animate-spin" style={{ color: WORK.muted }} />}
      </div>

      {d && (
        <>
          <Resumo d={d} analise={analise} irPara={setAba} />
          <div className="flex gap-1 overflow-x-auto my-5 border-b" style={{ borderColor: WORK.border }}>
            {ABAS.map(([k, l]) => (
              <button key={k} onClick={() => setAba(k)} className="px-3 py-2 text-sm whitespace-nowrap"
                style={{ color: aba === k ? WORK.accent : WORK.muted, borderBottom: aba === k ? `2px solid ${WORK.accent}` : "2px solid transparent" }}>{l}</button>
          ))}
          </div>
          {aba === "lista" && <Lista d={d} analise={analise} verCid={verCid} setVerCid={setVerCid} busca={busca} setBusca={setBusca} onEditar={setEdit} recarregar={recarregar} />}
          {aba === "esocial" && <Esocial d={d} analise={analise} recarregar={recarregar} />}
          {aba === "painel" && <PerfilEpidemiologico d={d} />}
          {aba === "relatorios" && <Relatorios d={d} />}
          {aba === "fap" && <FapAba d={d} analise={analise} recarregar={recarregar} />}
        </>
    )}
      {edit && d && <NovoAtestado inicial={edit.id ? edit : null} empresa={d.empresa} trabalhadores={d.trabalhadores} cats={d.cats} onFechar={() => setEdit(null)} aoSalvar={recarregar} />}
    </div>
);
}

function Resumo({ d, analise, irPara }) {
  const hoje = hojeS();
  const vals = d.atestados.map((a) => ({ a, r: analise[a.id] })).filter((x) => x.r);
  const afastados = vals.filter((x) => x.r.em_curso).length;
  const atrasados = vals.filter((x) => x.r.atrasado).length;
  const vencendo = vals.filter((x) => x.r.obrigatorio && x.a.esocial_status !== "enviado" && x.r.prazo >= hoje && x.r.prazo <= addDias(hoje, 3)).length;
  const inss = vals.filter((x) => x.r.inss && x.r.em_curso).length;
  const cards = [
    ["Afastados hoje", afastados, WORK.text, "lista"],
    ["S-2230 atrasados", atrasados, atrasados ? "#EF4444" : "#22C55E", "esocial"],
    ["Vencem em 3 dias", vencendo, vencendo ? "#EAB308" : WORK.text, "esocial"],
    ["Em benefício / perícia", inss, WORK.text, "lista"],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {cards.map(([l, v, c, aba]) => (
        <button key={l} onClick={() => irPara(aba)} className="rounded-lg border p-3 text-left" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <p className="text-xs" style={{ color: WORK.muted }}>{l}</p>
          <p className="text-2xl font-bold" style={{ color: c }}>{v}</p>
        </button>
    ))}
    </div>
);
}

function Lista({ d, analise, verCid, setVerCid, busca, setBusca, onEditar, recarregar }) {
  const lista = d.atestados.filter((a) => !busca || a.trabalhador_nome?.toLowerCase().includes(busca.toLowerCase()));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar colaborador" className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }} />
        <Botao onClick={() => setVerCid(!verCid)} title="CID é dado sensível (LGPD)">{verCid ? <EyeOff size={14} /> : <Eye size={14} />} {verCid ? "Ocultar CID" : "Mostrar CID"}</Botao>
      </div>
      {lista.length === 0 && <Cartao><Vazio>Nenhum atestado. Clique em "Novo atestado" e fotografe o documento.</Vazio></Cartao>}
      {lista.map((a) => {
        const r = analise[a.id] || { alertas: [] };
        return (
          <div key={a.id} className="rounded-lg border p-3" style={{ background: WORK.surface, borderColor: r.atrasado ? "#EF4444" : WORK.border }}>
            <div className="flex flex-wrap items-center gap-2">
              <b className="text-sm" style={{ color: WORK.text }}>{a.trabalhador_nome}</b>
              <span className="text-xs" style={{ color: WORK.muted }}>{dataBR(a.data_inicio)} a {dataBR(r.fim)} · {a.dias} dia(s)</span>
              <Etiqueta cor={a.motivo === "doenca" ? "#94A3B8" : "#F97316"}>{MOTIVOS[a.motivo]?.label}</Etiqueta>
              {verCid && a.cid && <Etiqueta cor="#A855F7">CID {a.cid}</Etiqueta>}
              {r.total_mesma_doenca > a.dias && <Etiqueta cor="#EAB308">mesma doença: {r.total_mesma_doenca} dias em 60</Etiqueta>}
              {r.em_curso && <Etiqueta cor="#3B82F6">afastado</Etiqueta>}
              <span className="ml-auto flex items-center gap-2">
                {r.obrigatorio
                  ? a.esocial_status === "enviado" ? <Etiqueta cor="#22C55E">S-2230 enviado</Etiqueta> : <Etiqueta cor={r.atrasado ? "#EF4444" : "#EAB308"}>S-2230 até {dataBR(r.prazo)}</Etiqueta>
                  : <Etiqueta cor="#64748B">sem S-2230 por ora</Etiqueta>}
                {a.arquivo_uri && <button title="Ver atestado" onClick={async () => window.open(await linkTemporario(a.arquivo_uri, 600), "_blank")} style={{ color: WORK.muted }}><FileText size={15} /></button>}
                <button onClick={() => onEditar({ ...a })} style={{ color: WORK.muted }}><Pencil size={15} /></button>
                <button onClick={async () => { if (confirm("Excluir atestado?")) { await base44.entities.Atestado.delete(a.id); recarregar(); } }} style={{ color: WORK.muted }}><Trash2 size={15} /></button>
              </span>
            </div>
            {(r.alertas.length > 0 || r.fap) && (
              <ul className="mt-2 space-y-0.5">
                {r.alertas.map((t, i) => <li key={i} className="text-xs" style={{ color: WORK.muted }}>• {t}</li>)}
                {r.fap && <li className="text-xs" style={{ color: r.fap.entra || r.fap.ntep ? "#F97316" : WORK.muted }}>• FAP: {r.fap.texto}</li>}
              </ul>
          )}
          </div>
      );
      })}
    </div>
);
}

function Esocial({ d, analise, recarregar }) {
  const itens = d.atestados.filter((a) => analise[a.id]?.obrigatorio).sort((a, b) => (analise[a.id].prazo || "").localeCompare(analise[b.id].prazo || ""));
  const pend = itens.filter((a) => a.esocial_status !== "enviado");

  const exportar = () => {
    const trab = Object.fromEntries(d.trabalhadores.map((t) => [t.id, t]));
    const eventos = pend.map((a) => {
      const r = analise[a.id];
      const t = trab[a.trabalhador_id] || {};
      const terminou = a.data_retorno || (r.fim < hojeS() ? r.fim : null);
      return {
        evento: "S-2230", prazo: r.prazo, cpfTrab: soNumeros(t.cpf), matricula: t.matricula || "", nome: a.trabalhador_nome,
        infoAfastamento: {
          iniAfastamento: { dtIniAfast: a.data_inicio, codMotAfast: r.cod_motivo, infoMesmoMtv: r.mesmo_motivo ? "S" : "N" },
          ...(terminou ? { fimAfastamento: { dtTermAfast: a.data_retorno ? addDias(a.data_retorno, -1) : r.fim } } : {}),
        },
      };
    });
    const blob = new Blob([JSON.stringify({ empresa: d.empresa.razao_social, cnpj: soNumeros(d.empresa.cnpj), gerado_em: new Date().toISOString(), observacao: "Prévia para o módulo eSocial. Sem CID (dado sensível); ajustar ao leiaute vigente.", eventos }, null, 2)], { type: "application/json" });
    const el = document.createElement("a");
    el.href = URL.createObjectURL(blob);
    el.download = `S-2230_${soNumeros(d.empresa.cnpj) || "empresa"}.json`;
    el.click();
    URL.revokeObjectURL(el.href);
  };

  const marcar = async (a, status) => { await base44.entities.Atestado.update(a.id, { esocial_status: status }); recarregar(); };
  const semDados = pend.filter((a) => { const t = d.trabalhadores.find((x) => x.id === a.trabalhador_id); return !t || soNumeros(t.cpf).length !== 11 || !t.matricula; });

  return (
    <Cartao titulo={`Afastamentos a informar (${pend.length} pendente(s))`} acoes={<Botao onClick={exportar} disabled={!pend.length}><Download size={14} /> Exportar S-2230 (JSON)</Botao>}>
      {semDados.length > 0 && <p className="text-xs mb-3" style={{ color: "#EAB308" }}> {semDados.length} colaborador(es) sem CPF ou matrícula — complete em PGR, PCMSO e laudos → Estrutura → Colaboradores.</p>}
      {itens.length === 0 && <Vazio>Nenhum afastamento obrigatório no momento.</Vazio>}
      <div className="space-y-2">
        {itens.map((a) => {
          const r = analise[a.id];
          const enviado = a.esocial_status === "enviado";
          return (
            <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg p-3" style={{ background: WORK.bg, opacity: enviado ? 0.6 : 1 }}>
              {enviado ? <CheckCircle2 size={16} style={{ color: "#22C55E" }} /> : <AlertTriangle size={16} style={{ color: r.atrasado ? "#EF4444" : "#EAB308" }} />}
              <div className="flex-1 min-w-0 text-sm" style={{ color: WORK.text }}>
                <b>{a.trabalhador_nome}</b> <span style={{ color: WORK.muted }}>· início {dataBR(a.data_inicio)} · {a.dias} dia(s) · motivo {r.cod_motivo}{r.mesmo_motivo ? " · mesmo motivo: S" : ""}</span>
              </div>
              <Etiqueta cor={enviado ? "#22C55E" : r.atrasado ? "#EF4444" : "#EAB308"}>{enviado ? "Enviado" : `${r.atrasado ? "Atrasado — " : ""}prazo ${dataBR(r.prazo)}`}</Etiqueta>
              <Botao onClick={() => marcar(a, enviado ? "pendente" : "enviado")}>{enviado ? "Desfazer" : "Marcar enviado"}</Botao>
            </div>
        );
        })}
      </div>
      <p className="text-[11px] mt-3" style={{ color: WORK.muted }}>
        Regras aplicadas: doença comum de 3 a 15 dias e acidente/doença do trabalho até 15 dias → até o dia {7} do mês seguinte; acima de 15 dias → até o 16º dia;
        mesma doença somando mais de 15 dias em 60 dias → todos até o dia em que completa 16 dias; nova licença até 60 dias após benefício → no 1º dia. Confira o MOS vigente.
      </p>
    </Cartao>
);
}

function FapAba(props) {
  const [modo, setModo] = useState("simulacao");
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border p-1" style={{ borderColor: WORK.border, background: WORK.surface }}>
        {[["simulacao", "Modo Simulação"], ["monitoramento", "Monitoramento"]].map(([k, l]) => (
          <button key={k} onClick={() => setModo(k)} className="px-3 py-1.5 rounded-md text-sm"
            style={{ background: modo === k ? WORK.accent : "transparent", color: modo === k ? "#FFFFFF" : WORK.muted }}>{l}</button>
      ))}
      </div>
      {modo === "simulacao" ? <SimuladorFap d={props.d} recarregar={props.recarregar} /> : <Fap {...props} />}
    </div>
);
}

function Fap({ d, analise, recarregar }) {
  const [f, setF] = useState({ fap: d.empresa.fap ?? "", rat: d.empresa.rat ?? "", folha_mensal: d.empresa.folha_mensal ?? "", vinculos_medios: d.empresa.vinculos_medios ?? "" });
  const [salvando, setSalvando] = useState(false);
  const ind = indicadoresFap({ atestados: d.atestados, analise, empresa: { ...d.empresa, ...f }, numTrabalhadores: d.trabalhadores.length });
  const eventos = d.atestados.filter((a) => analise[a.id]?.fap?.entra || a.beneficio_inss === "b91");
  const ntep = d.atestados.filter((a) => analise[a.id]?.fap?.ntep);

  const salvar = async () => {
    setSalvando(true);
    try {
      await base44.entities.Company.update(d.empresa.id, { fap: Number(f.fap) || null, rat: Number(f.rat) || null, folha_mensal: Number(f.folha_mensal) || null, vinculos_medios: Number(f.vinculos_medios) || null });
      recarregar();
    } finally { setSalvando(false); }
  };

  return (
    <div className="space-y-4">
      <Cartao titulo="Dados do FAP da empresa" acoes={<Botao tipo="primario" onClick={salvar} carregando={salvando}>Salvar</Botao>}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Campo label="FAP vigente (0,5 a 2,0)" tipo="number" valor={f.fap} onChange={(v) => setF({ ...f, fap: v })} />
          <Campo label="RAT (%)" tipo="select" opcoes={{ 1: "1%", 2: "2%", 3: "3%" }} valor={String(f.rat || "")} onChange={(v) => setF({ ...f, rat: v })} />
          <Campo label="Folha mensal (R$)" tipo="number" valor={f.folha_mensal} onChange={(v) => setF({ ...f, folha_mensal: v })} />
          <Campo label="Vínculos médios" tipo="number" valor={f.vinculos_medios} onChange={(v) => setF({ ...f, vinculos_medios: v })} />
        </div>
        <p className="text-[11px] mt-2" style={{ color: WORK.muted }}>O FAP vigente e o RAT estão no extrato do FAP da empresa, no portal da Previdência (acesso com certificado digital ou gov.br).</p>
      </Cartao>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          ["Alíquota efetiva (RAT × FAP)", ind.aliquota_efetiva ? `${ind.aliquota_efetiva.toFixed(2)}%` : "—"],
          ["Custo anual estimado", brl(ind.custo_atual)],
          ["Com FAP mínimo (0,5)", brl(ind.custo_min)],
          ["Economia possível", ind.custo_atual && ind.custo_min ? brl(ind.custo_atual - ind.custo_min) : "—"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg border p-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <p className="text-xs" style={{ color: WORK.muted }}>{l}</p><p className="text-lg font-bold" style={{ color: WORK.text }}>{v}</p>
          </div>
      ))}
      </div>

      <Cartao titulo="Eventos registrados no SmartSeg que pesam no FAP (últimos 2 anos)">
        <p className="text-sm mb-2" style={{ color: WORK.text }}>
          {ind.eventos} evento(s) acidentário(s) com mais de 15 dias
          {ind.freq !== null && <> · índice de frequência estimado {ind.freq.toFixed(1)} · gravidade {ind.grav.toFixed(2)} (por mil vínculos)</>}
        </p>
        {eventos.map((a) => <p key={a.id} className="text-xs" style={{ color: WORK.muted }}>• {a.trabalhador_nome} — {dataBR(a.data_inicio)}, {a.dias} dias ({MOTIVOS[a.motivo]?.label})</p>)}
        {ntep.length > 0 && (
          <>
            <p className="text-sm mt-3 mb-1" style={{ color: "#F97316" }}> {ntep.length} afastamento(s) por doença comum com risco de NTEP</p>
            {ntep.map((a) => <p key={a.id} className="text-xs" style={{ color: WORK.muted }}>• {a.trabalhador_nome} — {dataBR(a.data_inicio)}, {a.dias} dias. Se o INSS aplicar o nexo (B91), o caso passa a contar no FAP; a empresa pode contestar o NTEP com laudos do PGR/PCMSO.</p>)}
          </>
      )}
        <p className="text-[11px] mt-3" style={{ color: WORK.muted }}>
          O FAP oficial combina gravidade (50%), frequência (35%) e custo (15%) em percentis dentro da subclasse CNAE, com base nos 2 anos anteriores; B91 pesa 0,10 na gravidade e acidentes de trajeto são excluídos.
          Aqui é monitoramento preventivo — o valor oficial é o publicado pela Previdência.
        </p>
      </Cartao>
    </div>
);
}