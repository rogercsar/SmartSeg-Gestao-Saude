import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Copy, MessageCircle, BarChart3, Download, Upload, Lock, ShieldCheck, Trash2 } from "lucide-react";
import { WORK } from "@/lib/sst";
import { INSTRUMENTO_TRIAGEM, riscosDosResultados, modeloCsv, lerInstrumento } from "@/lib/psicossocial";
import { hojeLocal, addDias, dataBR } from "@/lib/sstGestao";
import { Botao, Campo, Modal, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";
import { useEmpresa, SeletorEmpresa, Cabecalho, Abas, Indicador } from "@/components/sst/useEmpresa";
import { linkLevantamento } from "@/components/programas/Levantamentos";

const NIVEL = { alto: ["Alto", "#B42318"], moderado: ["Moderado", "#8A5A00"], baixo: ["Baixo", "#146C43"] };
const token = () => Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => b.toString(16).padStart(2, "0")).join("");
const urlPesquisa = (t) => linkLevantamento(t).replace("/functions/levantamento-publico?", "/functions/pesquisa-psicossocial?");

function Barras({ d }) {
  return (
    <div className="flex h-3 rounded overflow-hidden w-full" title={`Favorável ${d.favoravel}% · Atenção ${d.atencao}% · Desfavorável ${d.desfavoravel}%`}>
      <div style={{ width: `${d.favoravel}%`, background: "#22A06B" }} /><div style={{ width: `${d.atencao}%`, background: "#E3A008" }} /><div style={{ width: `${d.desfavoravel}%`, background: "#DC2626" }} />
    </div>
  );
}

function TabelaDims({ dims }) {
  return (
    <div className="space-y-2">
      {dims.map((d) => (
        <div key={d.codigo} className="grid grid-cols-12 gap-2 items-center text-sm" style={{ color: WORK.text }}>
          <span className="col-span-12 md:col-span-4">{d.nome}<span className="block text-[11px]" style={{ color: WORK.muted }}>{d.grupo === "recurso" ? "Recurso (quanto maior, melhor)" : "Exigência (quanto maior, pior)"} · n={d.n}</span></span>
          <div className="col-span-9 md:col-span-6"><Barras d={d} /></div>
          <span className="col-span-3 md:col-span-2 text-right">{d.nivel ? <Etiqueta cor={NIVEL[d.nivel][1]}>{NIVEL[d.nivel][0]}</Etiqueta> : "—"}</span>
        </div>
      ))}
      <p className="text-[11px]" style={{ color: WORK.muted }}>Verde: favorável · amarelo: atenção · vermelho: desfavorável. Nível do grupo: alto quando ≥ 50% dos respondentes estão em situação desfavorável; moderado entre 25% e 49%.</p>
    </div>
  );
}

export default function Psicossocial() {
  const { empresas, empresaId, setEmpresaId } = useEmpresa();
  const [d, setD] = useState(null);
  const [aba, setAba] = useState("aplicacoes");
  const [nova, setNova] = useState(null);
  const [res, setRes] = useState(null);
  const [gerando, setGerando] = useState(false);

  const carregar = useCallback(async () => {
    if (!empresaId) { setD(null); return; }
    const [aplicacoes, setores, instrumentos, trabalhadores] = await Promise.all([
      base44.entities.AplicacaoPsicossocial.filter({ company_id: empresaId }, "-created_date").catch(() => []),
      base44.entities.Setor.filter({ company_id: empresaId }).catch(() => []),
      base44.entities.InstrumentoPsicossocial.list("nome", 100).catch(() => []),
      base44.entities.Trabalhador.filter({ company_id: empresaId }).catch(() => []),
    ]);
    setD({ aplicacoes, setores, instrumentos, ativos: trabalhadores.filter((t) => t.status !== "inativo").length });
  }, [empresaId]);
  useEffect(() => { carregar(); }, [carregar]);

  const criar = async () => {
    const inst = nova.instrumento_id === "triagem" ? INSTRUMENTO_TRIAGEM : d.instrumentos.find((i) => i.id === nova.instrumento_id);
    if (!inst) return alert("Escolha o instrumento.");
    const setores = d.setores.filter((s) => (nova.setores || []).includes(s.id)).map((s) => ({ id: s.id, nome: s.nome }));
    const { id, created_date, updated_date, created_by, created_by_id, org_id, ...congelado } = inst; // eslint-disable-line no-unused-vars
    await base44.entities.AplicacaoPsicossocial.create({ company_id: empresaId, nome: nova.nome || `Pesquisa ${dataBR(hojeLocal())}`, instrumento: congelado, setores, token: token(), inicio: nova.inicio, fim: nova.fim, status: "aberta", publico_estimado: Number(nova.publico) || d.ativos || 0 });
    setNova(null); carregar();
  };

  const verResultados = async (ap) => {
    try {
      const r = await base44.functions.invoke("pesquisa-psicossocial", { action: "resultados", aplicacao_id: ap.id });
      setRes({ ap, r: r.data });
    } catch (e) { alert(e?.data?.mensagem || e.message); }
  };

  const gerarRiscos = async () => {
    const riscos = riscosDosResultados(res.ap, res.r);
    if (!riscos.length) return alert("Nenhuma dimensão com nível moderado ou alto: não há riscos a incluir. Registre o resultado no PGR como evidência da avaliação.");
    if (!confirm(`Incluir ${riscos.length} risco(s) psicossocial(is) no inventário do PGR desta empresa, com plano de ação sugerido? Depois, revise e vincule aos cargos expostos.`)) return;
    setGerando(true);
    try {
      await base44.entities.Risco.bulkCreate(riscos);
      await base44.entities.AplicacaoPsicossocial.update(res.ap.id, { riscos_gerados: true });
      alert("Riscos incluídos no PGR (aba Riscos), marcados como não revisados.");
      carregar();
    } catch (e) { alert(e.message); } finally { setGerando(false); }
  };

  const importar = async (file) => {
    if (!file) return;
    try {
      const inst = await lerInstrumento(file);
      if (!confirm(`Importar "${inst.nome}" com ${inst.itens.length} perguntas e ${inst.dimensoes.length} dimensões?`)) return;
      await base44.entities.InstrumentoPsicossocial.create(inst);
      carregar();
    } catch (e) { alert("Não foi possível importar: " + e.message); }
  };

  if (!d) return <div className="p-4 md:p-8 max-w-6xl mx-auto"><Cabecalho titulo="Riscos psicossociais" subtitulo="Pesquisa anônima, resultados por setor e inclusão no PGR (NR-1 e NR-17)."><SeletorEmpresa empresas={empresas} empresaId={empresaId} setEmpresaId={setEmpresaId} /></Cabecalho></div>;
  const abertas = d.aplicacoes.filter((a) => a.status === "aberta").length;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Cabecalho titulo="Riscos psicossociais" subtitulo="Obrigatório no PGR desde 26/05/2026 (NR-1): identificar, avaliar com critério técnico, adotar medidas e documentar, com participação dos trabalhadores.">
        <SeletorEmpresa empresas={empresas} empresaId={empresaId} setEmpresaId={setEmpresaId} />
        <Botao tipo="primario" onClick={() => setNova({ instrumento_id: "triagem", inicio: hojeLocal(), fim: addDias(hojeLocal(), 15), setores: d.setores.map((s) => s.id), publico: d.ativos })}><Plus size={14} /> Nova pesquisa</Botao>
      </Cabecalho>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <Indicador rotulo="Pesquisas abertas" valor={abertas} />
        <Indicador rotulo="Pesquisas realizadas" valor={d.aplicacoes.length} />
        <Indicador rotulo="Riscos já incluídos no PGR" valor={d.aplicacoes.filter((a) => a.riscos_gerados).length} />
        <Indicador rotulo="Colaboradores ativos" valor={d.ativos} />
      </div>

      <Abas abas={[["aplicacoes", "Pesquisas"], ["instrumentos", "Instrumentos"]]} aba={aba} setAba={setAba} />

      {aba === "aplicacoes" && (
        <Cartao>
          <p className="text-xs mb-3" style={{ color: WORK.muted }}><Lock size={12} className="inline mr-1" />As respostas são anônimas e ficam guardadas no servidor; ninguém vê respostas individuais. Setores com menos de 5 respostas não têm resultado exibido.</p>
          {d.aplicacoes.length === 0 && <Vazio>Nenhuma pesquisa. Crie a primeira e envie o link aos trabalhadores.</Vazio>}
          <div className="space-y-2">
            {d.aplicacoes.map((ap) => {
              const url = urlPesquisa(ap.token);
              const aberta = ap.status === "aberta" && (!ap.fim || ap.fim >= hojeLocal());
              return (
                <div key={ap.id} className="rounded-lg border p-3" style={{ borderColor: WORK.border }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-sm" style={{ color: WORK.text }}>{ap.nome}</b>
                    <span className="text-xs" style={{ color: WORK.muted }}>{ap.instrumento?.nome} · {dataBR(ap.inicio)} a {dataBR(ap.fim)}</span>
                    <Etiqueta cor={aberta ? "#146C43" : "#5F6368"}>{aberta ? "Aberta" : "Encerrada"}</Etiqueta>
                    {!ap.instrumento?.validado && <Etiqueta cor="#8A5A00">triagem (não validado)</Etiqueta>}
                    {ap.riscos_gerados && <Etiqueta cor="#0B6FA8">no PGR</Etiqueta>}
                    <span className="ml-auto flex flex-wrap gap-2">
                      {aberta && <Botao onClick={() => { navigator.clipboard.writeText(url); alert("Link copiado."); }}><Copy size={14} /> Link</Botao>}
                      {aberta && <a href={`https://wa.me/?text=${encodeURIComponent(`Pesquisa anônima sobre as condições de trabalho. Leva cerca de 5 minutos e ninguém saberá quem respondeu: ${url}`)}`} target="_blank" rel="noreferrer"><Botao><MessageCircle size={14} /> WhatsApp</Botao></a>}
                      <Botao tipo="primario" onClick={() => verResultados(ap)}><BarChart3 size={14} /> Resultados</Botao>
                      {aberta && <Botao onClick={async () => { if (confirm("Encerrar a pesquisa? O link deixa de aceitar respostas.")) { await base44.entities.AplicacaoPsicossocial.update(ap.id, { status: "encerrada" }); carregar(); } }}>Encerrar</Botao>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Cartao>
      )}

      {aba === "instrumentos" && (
        <Cartao titulo="Instrumentos de avaliação" acoes={<>
          <Botao onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([modeloCsv()], { type: "text/csv" })); a.download = "modelo_instrumento_psicossocial.csv"; a.click(); }}><Download size={14} /> Modelo de planilha</Botao>
          <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm cursor-pointer" style={{ background: WORK.accent, color: "#fff" }}><Upload size={14} /> Importar (CSV/XLSX)<input type="file" accept=".csv,.xlsx,.xls" hidden onChange={(e) => importar(e.target.files?.[0])} /></label>
        </>}>
          <div className="rounded-lg p-3 mb-2 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
            <b>{INSTRUMENTO_TRIAGEM.nome}</b> <span className="text-xs" style={{ color: WORK.muted }}>· {INSTRUMENTO_TRIAGEM.itens.length} perguntas · {INSTRUMENTO_TRIAGEM.dimensoes.length} dimensões · padrão do sistema</span>
            <p className="text-xs mt-1" style={{ color: "#8A5A00" }}>{INSTRUMENTO_TRIAGEM.referencia}</p>
          </div>
          {d.instrumentos.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-2 rounded-lg p-3 mb-2 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
              <b>{i.nome}</b> <span className="text-xs" style={{ color: WORK.muted }}>· {i.itens?.length} perguntas · {i.dimensoes?.length} dimensões</span>
              <label className="text-xs flex items-center gap-1 ml-auto" style={{ color: WORK.muted }}>
                <input type="checkbox" checked={!!i.validado} onChange={async (e) => { await base44.entities.InstrumentoPsicossocial.update(i.id, { validado: e.target.checked }); carregar(); }} /> instrumento validado
              </label>
              <button onClick={async () => { if (confirm("Excluir instrumento? Pesquisas já criadas continuam com a cópia.")) { await base44.entities.InstrumentoPsicossocial.delete(i.id); carregar(); } }} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
            </div>
          ))}
          <p className="text-[11px] mt-2" style={{ color: WORK.muted }}>Para usar o COPSOQ II – versão brasileira, importe a planilha com as 40 perguntas, as escalas de cada item (inclusive a escala invertida e as perguntas de pontuação binária) e os pontos de corte de cada dimensão.</p>
        </Cartao>
      )}

      {nova && (
        <Modal aberto onFechar={() => setNova(null)} titulo="Nova pesquisa psicossocial" largura="max-w-2xl"
          rodape={<><Botao onClick={() => setNova(null)}>Cancelar</Botao><Botao tipo="primario" onClick={criar}>Criar e gerar link</Botao></>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Campo label="Nome" valor={nova.nome} onChange={(v) => setNova((x) => ({ ...x, nome: v }))} placeholder="Ex.: Pesquisa psicossocial 2026" className="md:col-span-2" />
            <Campo label="Instrumento" tipo="select" opcoes={{ triagem: INSTRUMENTO_TRIAGEM.nome, ...Object.fromEntries(d.instrumentos.map((i) => [i.id, i.nome])) }} valor={nova.instrumento_id} onChange={(v) => setNova((x) => ({ ...x, instrumento_id: v || "triagem" }))} className="md:col-span-2" />
            <Campo label="Início" tipo="date" valor={nova.inicio} onChange={(v) => setNova((x) => ({ ...x, inicio: v }))} />
            <Campo label="Encerramento" tipo="date" valor={nova.fim} onChange={(v) => setNova((x) => ({ ...x, fim: v }))} />
            <Campo label="Trabalhadores convidados" tipo="number" valor={nova.publico} onChange={(v) => setNova((x) => ({ ...x, publico: v }))} />
          </div>
          <p className="text-xs mt-3 mb-1" style={{ color: WORK.muted }}>Setores oferecidos no questionário (o respondente escolhe o seu)</p>
          <div className="flex flex-wrap gap-1.5">
            {d.setores.map((s) => {
              const on = (nova.setores || []).includes(s.id);
              return <button key={s.id} onClick={() => setNova((x) => ({ ...x, setores: on ? x.setores.filter((y) => y !== s.id) : [...(x.setores || []), s.id] }))} className="px-2.5 py-1 rounded-full text-xs border" style={{ borderColor: on ? WORK.accent : WORK.border, color: on ? WORK.accent : WORK.muted }}>{s.nome}</button>;
            })}
            {!d.setores.length && <span className="text-xs" style={{ color: WORK.muted }}>Sem setores cadastrados: o resultado será só da empresa toda.</span>}
          </div>
          <p className="text-[11px] mt-3" style={{ color: WORK.muted }}>Dica: setores pequenos (menos de 5 pessoas) nunca terão resultado próprio, para proteger o anonimato. Agrupe-os quando fizer sentido.</p>
        </Modal>
      )}

      {res && (
        <Modal aberto onFechar={() => setRes(null)} titulo={`Resultados — ${res.ap.nome}`} largura="max-w-4xl"
          rodape={<><Botao onClick={() => setRes(null)}>Fechar</Botao>{res.r.geral && <Botao tipo="primario" onClick={gerarRiscos} carregando={gerando}><ShieldCheck size={14} /> Incluir no PGR</Botao>}</>}>
          <p className="text-sm mb-3" style={{ color: WORK.text }}><b>{res.r.total}</b> resposta(s){res.r.adesao !== null ? ` · adesão de ${res.r.adesao}%` : ""}. {res.r.adesao !== null && res.r.adesao < 50 && <span style={{ color: "#8A5A00" }}>Adesão baixa: amplie a divulgação antes de concluir.</span>}</p>
          {!res.r.geral ? <Vazio>Ainda há menos de {res.r.min} respostas: o resultado fica oculto para proteger o anonimato.</Vazio> : <TabelaDims dims={res.r.geral} />}
          {res.r.porSetor.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold mb-2" style={{ color: WORK.text }}>Por setor</p>
              {res.r.porSetor.map((s) => (
                <div key={s.id} className="rounded-lg border p-3 mb-2" style={{ borderColor: WORK.border }}>
                  <p className="text-sm mb-2" style={{ color: WORK.text }}><b>{s.nome}</b> <span className="text-xs" style={{ color: WORK.muted }}>· {s.n} resposta(s)</span></p>
                  {s.dimensoes ? <TabelaDims dims={s.dimensoes} /> : <p className="text-xs" style={{ color: WORK.muted }}>Menos de {res.r.min} respostas — oculto para preservar o anonimato.</p>}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
