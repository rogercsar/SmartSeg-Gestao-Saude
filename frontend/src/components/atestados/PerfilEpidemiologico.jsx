import React, { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { WORK } from "@/lib/sst";
import { perfilEpidemiologico, periodoPadrao, CAPITULOS_CID } from "@/lib/epidemiologia";
import { dataBR } from "@/lib/afastamentos";
import { Botao, Campo, Cartao, Vazio } from "@/components/programas/ui";

export const fmt = (v, dec = 1, suf = "") => (v === null || v === undefined || isNaN(v) ? "—" : `${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec })}${suf}`);
const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const nomeMes = (m) => `${MES[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`;

export function Barras({ linhas, rotulo = (k) => k, valor = "dias", max = 8 }) {
  if (!linhas.length) return <Vazio>Sem dados.</Vazio>;
  const top = Math.max(...linhas.map((l) => l[valor]), 1);
  return linhas.slice(0, max).map((l) => (
    <div key={l.chave} className="mb-2">
      <div className="flex justify-between gap-2 text-xs" style={{ color: WORK.text }}>
        <span className="truncate">{rotulo(l.chave)}</span>
        <span className="whitespace-nowrap" style={{ color: WORK.muted }}>{l.dias} dias · {l.atestados} atest. · {l.pessoas} pess.</span>
      </div>
      <div className="h-1.5 rounded-full mt-1" style={{ background: WORK.bg }}><div className="h-full rounded-full" style={{ width: `${(l[valor] / top) * 100}%`, background: WORK.accent }} /></div>
    </div>
));
}

export function Serie({ meses }) {
  const top = Math.max(...meses.map((m) => m.dias), 1);
  return (
    <div className="flex items-end gap-1 h-36 overflow-x-auto pt-4">
      {meses.map((m) => (
        <div key={m.mes} className="flex flex-col items-center justify-end h-full min-w-[34px] flex-1">
          <span className="text-[10px] mb-0.5" style={{ color: WORK.muted }}>{m.dias || ""}</span>
          <div className="w-full rounded-t" style={{ height: `${(m.dias / top) * 100}%`, minHeight: m.dias ? 3 : 0, background: WORK.accent }} title={`${m.dias} dias · taxa ${fmt(m.taxa, 2, "%")}`} />
          <span className="text-[10px] mt-1" style={{ color: WORK.muted }}>{nomeMes(m.mes)}</span>
        </div>
    ))}
    </div>
);
}

export default function PerfilEpidemiologico({ d }) {
  const [periodo, setPeriodo] = useState("12m");
  const [custom, setCustom] = useState(periodoPadrao("12m"));
  const [setorId, setSetorId] = useState("");
  const [sensivel, setSensivel] = useState(false);
  const p = periodo === "custom" ? custom : periodoPadrao(periodo);

  const perfil = useMemo(() => perfilEpidemiologico({ ...d, inicio: p.inicio, fim: p.fim, setorId }), [d, p.inicio, p.fim, setorId]);
  const i = perfil.indicadores;

  const cards = [
    ["Taxa de absenteísmo", fmt(i.taxa_absenteismo, 2, "%"), "dias perdidos ÷ (efetivo × dias do período)"],
    ["Dias perdidos", i.dias_perdidos, `${fmt(i.dias_por_colaborador, 1)} por colaborador`],
    ["Atestados", i.atestados, `índice de frequência ${fmt(i.indice_frequencia, 2)} por colaborador`],
    ["Prevalência", fmt(i.prevalencia, 1, "%"), `${i.colaboradores_afastados} de ${perfil.efetivo} colaboradores`],
    ["Duração média", fmt(i.duracao_media, 1, " dias"), `${i.afastamentos_longos} afastamento(s) > 15 dias`],
    ["Ocupacionais", i.ocupacionais, `${i.dias_ocupacionais} dias · ${i.cats} CAT(s) no período`],
  ];

  return (
    <div className="space-y-4">
      <Cartao>
        <div className="flex flex-wrap items-end gap-2">
          <Campo label="Período" tipo="select" valor={periodo} onChange={(v) => setPeriodo(v || "12m")}
            opcoes={{ "12m": "Últimos 12 meses", trimestre: "Últimos 90 dias", ano: "Ano atual", ano_anterior: "Ano anterior", custom: "Personalizado" }} />
          {periodo === "custom" && <>
            <Campo label="De" tipo="date" valor={custom.inicio} onChange={(v) => setCustom({ ...custom, inicio: v })} />
            <Campo label="Até" tipo="date" valor={custom.fim} onChange={(v) => setCustom({ ...custom, fim: v })} />
          </>}
          <Campo label="Setor" tipo="select" opcoes={Object.fromEntries(d.setores.map((s) => [s.id, s.nome]))} valor={setorId} onChange={setSetorId} />
          <Botao onClick={() => setSensivel(!sensivel)} title="CID e nomes são dados sensíveis (LGPD)">{sensivel ? <EyeOff size={14} /> : <Eye size={14} />} {sensivel ? "Ocultar CID e nomes" : "Mostrar CID e nomes"}</Botao>
        </div>
        <p className="text-[11px] mt-2" style={{ color: WORK.muted }}>{dataBR(perfil.inicio)} a {dataBR(perfil.fim)} · efetivo considerado: {perfil.efetivo} · {fmt(i.cobertura_cid, 0, "%")} dos atestados com CID</p>
      </Cartao>

      {perfil.efetivo === 0 && <Cartao><p className="text-sm" style={{ color: "#EAB308" }}>Cadastre os colaboradores (ou informe os vínculos médios na aba FAP) para calcular as taxas.</p></Cartao>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {cards.map(([l, v, s]) => (
          <div key={l} className="rounded-lg border p-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
            <p className="text-xs" style={{ color: WORK.muted }}>{l}</p>
            <p className="text-xl font-bold" style={{ color: WORK.text }}>{v}</p>
            <p className="text-[11px]" style={{ color: WORK.muted }}>{s}</p>
          </div>
      ))}
      </div>

      {perfil.alertas.length > 0 && (
        <Cartao titulo="Alertas epidemiológicos">
          {perfil.alertas.map((t, k) => <p key={k} className="text-sm mb-1" style={{ color: "#F97316" }}> {t}</p>)}
        </Cartao>
    )}

      <Cartao titulo="Evolução mensal (dias perdidos)"><Serie meses={perfil.meses} /></Cartao>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Cartao titulo="Por grupo de doença (capítulo CID-10)"><Barras linhas={perfil.por_capitulo} /></Cartao>
        {sensivel
          ? <Cartao titulo="10 CIDs mais frequentes"><Barras linhas={perfil.por_cid} max={10} rotulo={(k) => `${k} — ${CAPITULOS_CID[k[0]] || ""}`} /></Cartao>
          : <Cartao titulo="10 CIDs mais frequentes"><Vazio>Oculto (dado sensível). Use "Mostrar CID e nomes".</Vazio></Cartao>}
        <Cartao titulo="Por setor"><Barras linhas={perfil.por_setor} /></Cartao>
        <Cartao titulo="Por cargo"><Barras linhas={perfil.por_cargo} /></Cartao>
        <Cartao titulo="Por sexo"><Barras linhas={perfil.por_sexo} /></Cartao>
        <Cartao titulo="Por faixa etária"><Barras linhas={perfil.por_faixa} /></Cartao>
        <Cartao titulo="Por natureza"><Barras linhas={perfil.por_motivo} /></Cartao>
        <Cartao titulo="Por duração do afastamento"><Barras linhas={perfil.por_duracao} valor="atestados" /></Cartao>
      </div>

      <Cartao titulo={`Reincidentes (3 ou mais atestados) — ${perfil.reincidentes.length}`}>
        {perfil.reincidentes.length === 0 ? <Vazio>Nenhum.</Vazio> : sensivel
          ? perfil.reincidentes.map((r) => <p key={r.nome} className="text-sm" style={{ color: WORK.text }}>• {r.nome} <span style={{ color: WORK.muted }}>({r.cargo || "sem cargo"}) — {r.atestados} atestados, {r.dias} dias</span></p>)
          : <p className="text-sm" style={{ color: WORK.muted }}>{perfil.reincidentes.length} colaborador(es). Nomes ocultos.</p>}
      </Cartao>
    </div>
);
}
