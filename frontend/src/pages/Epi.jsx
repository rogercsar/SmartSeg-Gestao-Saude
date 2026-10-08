import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, PackageCheck, FileText, Download, AlertTriangle } from "lucide-react";
import { WORK } from "@/lib/sst";
import { situacao, TIPOS_EPI, MOTIVOS_ENTREGA, hojeLocal, addDias, dataBR } from "@/lib/sstGestao";
import { uploadPrivado } from "@/lib/privateFiles";
import { Botao, Campo, Modal, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";
import { PadAssinatura } from "@/components/programas/Assinatura";
import { useEmpresa, SeletorEmpresa, Cabecalho, Abas, Indicador } from "@/components/sst/useEmpresa";

const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const soNum = (s) => String(s || "").replace(/\D/g, "");

// EPIs exigidos pelo PGR para o cargo do colaborador x entregas feitas
export function situacaoEpiColaborador(t, riscos, entregas) {
  const exigidos = [];
  riscos.filter((r) => (r.cargo_ids || []).includes(t.cargo_id)).forEach((r) =>
    (r.epi || []).forEach((e) => { if (e?.nome && !exigidos.some((x) => norm(x.nome) === norm(e.nome))) exigidos.push({ nome: e.nome, ca: e.ca }); }));
  const minhas = entregas.filter((e) => e.trabalhador_id === t.id && !e.devolvido_em);
  const atende = (x) => minhas.some((e) => (soNum(x.ca) && soNum(e.ca) === soNum(x.ca)) || norm(e.epi_nome) === norm(x.nome) || norm(e.epi_nome).includes(norm(x.nome)) || norm(x.nome).includes(norm(e.epi_nome)));
  const pendentes = exigidos.filter((x) => !atende(x));
  // última entrega de cada EPI define a próxima troca
  const ultimas = {};
  minhas.forEach((e) => { const k = e.epi_id || norm(e.epi_nome); if (!ultimas[k] || e.data_entrega > ultimas[k].data_entrega) ultimas[k] = e; });
  const trocas = Object.values(ultimas).filter((e) => e.proxima_troca).map((e) => ({ ...e, sit: situacao(e.proxima_troca, 15) }));
  return { exigidos, pendentes, trocas, entregas: minhas };
}

function EditorItem({ item, setItem, empresaId, onFechar, aoSalvar }) {
  const [salvando, setSalvando] = useState(false);
  const set = (k, v) => setItem((i) => ({ ...i, [k]: v }));
  const salvar = async () => {
    if (!item.nome) return alert("Informe o nome do EPI.");
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...d } = item; // eslint-disable-line no-unused-vars
      if (id) await base44.entities.EpiItem.update(id, d); else await base44.entities.EpiItem.create({ ...d, company_id: empresaId });
      aoSalvar(); onFechar();
    } catch (e) { alert("Erro: " + (e?.message || "")); } finally { setSalvando(false); }
  };
  return (
    <Modal aberto onFechar={onFechar} titulo={item.id ? "Editar EPI" : "Novo EPI"} largura="max-w-2xl"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={salvando}>Salvar</Botao></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Campo label="EPI *" valor={item.nome} onChange={(v) => set("nome", v)} className="md:col-span-2" />
        <Campo label="Tipo" tipo="select" opcoes={TIPOS_EPI} valor={item.tipo} onChange={(v) => set("tipo", v)} />
        <Campo label="Fabricante" valor={item.fabricante} onChange={(v) => set("fabricante", v)} />
        <Campo label="Número do CA" valor={item.ca} onChange={(v) => set("ca", v)} />
        <Campo label="Validade do CA" tipo="date" valor={item.validade_ca} onChange={(v) => set("validade_ca", v)} />
        <Campo label="Troca periódica (dias; 0 = por desgaste)" tipo="number" valor={item.vida_util_dias} onChange={(v) => set("vida_util_dias", v)} />
        <Campo label="Unidade" valor={item.unidade} onChange={(v) => set("unidade", v)} placeholder="un, par, cx" />
        <Campo label="Estoque atual" tipo="number" valor={item.estoque_atual} onChange={(v) => set("estoque_atual", v)} />
        <Campo label="Estoque mínimo" tipo="number" valor={item.estoque_minimo} onChange={(v) => set("estoque_minimo", v)} />
      </div>
      <p className="text-[11px] mt-3" style={{ color: WORK.muted }}>Consulte a validade do CA no sistema CAEPI do Ministério do Trabalho. EPI com CA vencido não pode ser entregue (NR-6).</p>
    </Modal>
  );
}

function NovaEntrega({ d, empresaId, inicialTrab, onFechar, aoSalvar }) {
  const [trabId, setTrabId] = useState(inicialTrab || "");
  const [data, setData] = useState(hojeLocal());
  const [motivo, setMotivo] = useState("primeira_entrega");
  const [orientado, setOrientado] = useState(true);
  const [qtd, setQtd] = useState({});
  const [assinatura, setAssinatura] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const t = d.trabalhadores.find((x) => x.id === trabId);
  const exig = t ? situacaoEpiColaborador(t, d.riscos, d.entregas).exigidos : [];
  const sugerido = (it) => exig.some((x) => (soNum(x.ca) && soNum(x.ca) === soNum(it.ca)) || norm(x.nome) === norm(it.nome));

  useEffect(() => {
    if (!t) return;
    const q = {};
    d.itens.filter((it) => it.ativo !== false && sugerido(it)).forEach((it) => { q[it.id] = 1; });
    setQtd(q);
  }, [trabId]); // eslint-disable-line react-hooks/exhaustive-deps

  const escolhidos = d.itens.filter((it) => Number(qtd[it.id]) > 0);
  const caVencido = escolhidos.filter((it) => situacao(it.validade_ca, 0).k === "vencido");
  const semEstoque = escolhidos.filter((it) => Number(it.estoque_atual || 0) < Number(qtd[it.id]));

  const salvar = async () => {
    if (!t) return alert("Escolha o colaborador.");
    if (!escolhidos.length) return alert("Marque ao menos um EPI.");
    if (caVencido.length && !confirm(`CA vencido: ${caVencido.map((i) => i.nome).join(", ")}. A NR-6 proíbe a entrega de EPI sem CA válido. Registrar mesmo assim?`)) return;
    setSalvando(true);
    try {
      let assinatura_uri = "";
      if (assinatura) assinatura_uri = (await uploadPrivado(assinatura)).file_uri;
      const registros = escolhidos.map((it) => ({
        company_id: empresaId, trabalhador_id: t.id, trabalhador_nome: t.nome, epi_id: it.id, epi_nome: it.nome, ca: it.ca || "",
        quantidade: Number(qtd[it.id]), data_entrega: data, motivo, orientado_uso: orientado,
        proxima_troca: Number(it.vida_util_dias) > 0 ? addDias(data, Number(it.vida_util_dias)) : "",
        assinatura_uri, assinado_em: assinatura_uri ? new Date().toISOString() : "",
      }));
      await base44.entities.EntregaEpi.bulkCreate(registros);
      for (const it of escolhidos) {
        await base44.entities.EpiItem.update(it.id, { estoque_atual: Math.max(0, Number(it.estoque_atual || 0) - Number(qtd[it.id])) });
      }
      aoSalvar(); onFechar();
    } catch (e) { alert("Erro ao registrar: " + (e?.message || "")); } finally { setSalvando(false); }
  };

  return (
    <Modal aberto onFechar={onFechar} titulo="Registrar entrega de EPI" largura="max-w-3xl"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={salvando}><PackageCheck size={14} /> Registrar entrega</Botao></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Campo label="Colaborador *" tipo="select" opcoes={Object.fromEntries(d.trabalhadores.map((x) => [x.id, x.nome]))} valor={trabId} onChange={setTrabId} className="md:col-span-2" />
          <Campo label="Data" tipo="date" valor={data} onChange={setData} />
          <Campo label="Motivo" tipo="select" opcoes={MOTIVOS_ENTREGA} valor={motivo} onChange={(v) => setMotivo(v || "primeira_entrega")} />
        </div>
        {t && exig.length > 0 && <p className="text-xs" style={{ color: WORK.muted }}>EPIs exigidos pelo PGR para o cargo: {exig.map((x) => x.nome).join(", ")}. Já marcados abaixo quando existem no catálogo.</p>}
        {d.itens.length === 0 && <Vazio>Cadastre os EPIs no catálogo primeiro (aba Catálogo e estoque).</Vazio>}
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {d.itens.filter((it) => it.ativo !== false).map((it) => {
            const ca = situacao(it.validade_ca, 30);
            return (
              <div key={it.id} className="flex flex-wrap items-center gap-2 rounded-lg p-2" style={{ background: sugerido(it) ? "#E6F2F8" : WORK.bg }}>
                <input type="number" min={0} className="w-16 px-2 py-1 rounded border text-sm" style={{ borderColor: WORK.border }}
                  value={qtd[it.id] ?? ""} placeholder="0" onChange={(e) => setQtd((q) => ({ ...q, [it.id]: e.target.value }))} />
                <span className="flex-1 text-sm" style={{ color: WORK.text }}>{it.nome} <span style={{ color: WORK.muted }}>· CA {it.ca || "—"} · estoque {it.estoque_atual ?? 0}</span></span>
                {ca.k !== "ok" && <Etiqueta cor={ca.cor}>CA: {ca.label}</Etiqueta>}
              </div>
            );
          })}
        </div>
        {semEstoque.length > 0 && <p className="text-xs" style={{ color: "#8A5A00" }}>Estoque insuficiente no sistema para: {semEstoque.map((i) => i.nome).join(", ")} (a entrega será registrada e o estoque ficará zerado).</p>}
        <Campo tipo="checkbox" label="Colaborador orientado sobre uso adequado, guarda, conservação e higienização (NR-6)" valor={orientado} onChange={setOrientado} />
        <div>
          <p className="text-xs mb-1" style={{ color: WORK.muted }}>Assinatura do colaborador {assinatura ? "✔ capturada" : "(assine com o dedo ou o mouse)"}</p>
          {!assinatura ? <PadAssinatura onPronto={setAssinatura} /> : <Botao onClick={() => setAssinatura(null)}>Refazer assinatura</Botao>}
        </div>
      </div>
    </Modal>
  );
}

export default function Epi() {
  const { empresas, empresaId, setEmpresaId } = useEmpresa();
  const [d, setD] = useState(null);
  const [aba, setAba] = useState("colaboradores");
  const [editItem, setEditItem] = useState(null);
  const [entrega, setEntrega] = useState(null);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    if (!empresaId) { setD(null); return; }
    const f = (e, ord) => base44.entities[e].filter({ company_id: empresaId }, ord).catch(() => []);
    const [itens, entregas, trabalhadores, cargos, riscos] = await Promise.all([f("EpiItem", "nome"), f("EntregaEpi", "-data_entrega"), f("Trabalhador", "nome"), f("CargoFuncao"), f("Risco")]);
    setD({ itens, entregas, trabalhadores: trabalhadores.filter((t) => t.status !== "inativo"), cargos, riscos });
  }, [empresaId]);
  useEffect(() => { carregar(); }, [carregar]);

  const porColab = useMemo(() => (d ? d.trabalhadores.map((t) => ({ t, s: situacaoEpiColaborador(t, d.riscos, d.entregas) })) : []), [d]);
  const cargoNome = d ? Object.fromEntries(d.cargos.map((c) => [c.id, c.nome_cargo])) : {};

  const importarPgr = async () => {
    const novos = [];
    d.riscos.forEach((r) => (r.epi || []).forEach((e) => {
      if (!e?.nome) return;
      const existe = [...d.itens, ...novos].some((i) => (soNum(e.ca) && soNum(i.ca) === soNum(e.ca)) || norm(i.nome) === norm(e.nome));
      if (!existe) novos.push({ company_id: empresaId, nome: e.nome, ca: e.ca || "", tipo: "outro", estoque_atual: 0, estoque_minimo: 0, vida_util_dias: 0, unidade: "un", ativo: true });
    }));
    if (!novos.length) return alert("Todos os EPIs do PGR já estão no catálogo.");
    if (!confirm(`Adicionar ${novos.length} EPI(s) do PGR ao catálogo? Depois complete a validade do CA e o estoque.`)) return;
    await base44.entities.EpiItem.bulkCreate(novos);
    carregar();
  };

  if (!d) return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Cabecalho titulo="Gestão de EPI" subtitulo="Entregas com assinatura, validade do CA, trocas periódicas e estoque (NR-6)."><SeletorEmpresa empresas={empresas} empresaId={empresaId} setEmpresaId={setEmpresaId} /></Cabecalho>
    </div>
  );

  const pendentes = porColab.filter((x) => x.s.pendentes.length).length;
  const trocasVencidas = porColab.reduce((n, x) => n + x.s.trocas.filter((e) => e.sit.k === "vencido").length, 0);
  const caVencidos = d.itens.filter((i) => i.ativo !== false && situacao(i.validade_ca, 0).k === "vencido").length;
  const estoqueBaixo = d.itens.filter((i) => i.ativo !== false && Number(i.estoque_minimo) > 0 && Number(i.estoque_atual || 0) <= Number(i.estoque_minimo)).length;
  const lista = porColab.filter((x) => !busca || norm(x.t.nome).includes(norm(busca)));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Cabecalho titulo="Gestão de EPI" subtitulo="Entregas com assinatura, validade do CA, trocas periódicas e estoque (NR-6). A ficha assinada é a prova de fornecimento e orientação.">
        <SeletorEmpresa empresas={empresas} empresaId={empresaId} setEmpresaId={setEmpresaId} />
        <Botao tipo="primario" onClick={() => setEntrega({})}><PackageCheck size={14} /> Registrar entrega</Botao>
      </Cabecalho>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        <Indicador rotulo="Colaboradores com EPI pendente" valor={pendentes} cor={pendentes ? "#B42318" : "#146C43"} detalhe="exigido no PGR e não entregue" onClick={() => setAba("colaboradores")} />
        <Indicador rotulo="Trocas vencidas" valor={trocasVencidas} cor={trocasVencidas ? "#B42318" : "#146C43"} onClick={() => setAba("colaboradores")} />
        <Indicador rotulo="EPIs com CA vencido" valor={caVencidos} cor={caVencidos ? "#B42318" : "#146C43"} onClick={() => setAba("catalogo")} />
        <Indicador rotulo="Estoque no mínimo" valor={estoqueBaixo} cor={estoqueBaixo ? "#8A5A00" : "#146C43"} onClick={() => setAba("catalogo")} />
      </div>

      <Abas abas={[["colaboradores", "Por colaborador"], ["entregas", "Entregas"], ["catalogo", "Catálogo e estoque"]]} aba={aba} setAba={setAba} />

      {aba === "colaboradores" && (
        <Cartao>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar colaborador" className="w-full mb-3 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: WORK.border }} />
          {lista.length === 0 && <Vazio>Nenhum colaborador ativo.</Vazio>}
          <div className="space-y-2">
            {lista.map(({ t, s }) => {
              const venc = s.trocas.filter((e) => e.sit.k !== "ok");
              return (
                <div key={t.id} className="rounded-lg border p-3" style={{ borderColor: s.pendentes.length ? "#F5C2C0" : WORK.border }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-sm" style={{ color: WORK.text }}>{t.nome}</b>
                    <span className="text-xs" style={{ color: WORK.muted }}>{cargoNome[t.cargo_id] || "sem cargo"}</span>
                    <Etiqueta cor={s.pendentes.length ? "#B42318" : "#146C43"}>{s.exigidos.length ? `${s.exigidos.length - s.pendentes.length}/${s.exigidos.length} exigidos entregues` : "sem EPI exigido no PGR"}</Etiqueta>
                    <span className="ml-auto flex gap-2">
                      <Link to={`/epi/ficha?trabalhador=${t.id}`} target="_blank"><Botao><FileText size={14} /> Ficha</Botao></Link>
                      <Botao tipo="primario" onClick={() => setEntrega({ trabalhador_id: t.id })}><Plus size={14} /> Entregar</Botao>
                    </span>
                  </div>
                  {s.pendentes.length > 0 && <p className="text-xs mt-2" style={{ color: "#B42318" }}>Pendente: {s.pendentes.map((x) => x.nome).join(", ")}</p>}
                  {venc.length > 0 && <p className="text-xs mt-1" style={{ color: "#8A5A00" }}>Troca: {venc.map((e) => `${e.epi_nome} (${e.sit.label})`).join("; ")}</p>}
                </div>
              );
            })}
          </div>
        </Cartao>
      )}

      {aba === "entregas" && (
        <Cartao titulo={`Entregas registradas (${d.entregas.length})`}>
          {d.entregas.length === 0 && <Vazio>Nenhuma entrega registrada.</Vazio>}
          <div className="overflow-x-auto">
            {d.entregas.length > 0 && (
              <table className="w-full text-xs" style={{ color: WORK.text }}>
                <thead><tr style={{ color: WORK.muted }}><th className="text-left p-2">Data</th><th className="text-left p-2">Colaborador</th><th className="text-left p-2">EPI</th><th className="text-left p-2">CA</th><th className="p-2">Qtd</th><th className="text-left p-2">Motivo</th><th className="p-2">Assinado</th><th /></tr></thead>
                <tbody>
                  {d.entregas.map((e) => (
                    <tr key={e.id} className="border-t" style={{ borderColor: WORK.border }}>
                      <td className="p-2">{dataBR(e.data_entrega)}</td><td className="p-2">{e.trabalhador_nome}</td><td className="p-2">{e.epi_nome}</td><td className="p-2">{e.ca}</td>
                      <td className="p-2 text-center">{e.quantidade}</td><td className="p-2">{MOTIVOS_ENTREGA[e.motivo] || e.motivo}</td>
                      <td className="p-2 text-center">{e.assinatura_uri ? "✔" : "—"}</td>
                      <td className="p-2"><button onClick={async () => { if (confirm("Excluir este registro de entrega?")) { await base44.entities.EntregaEpi.delete(e.id); carregar(); } }} style={{ color: WORK.muted }}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Cartao>
      )}

      {aba === "catalogo" && (
        <Cartao titulo={`Catálogo de EPIs (${d.itens.length})`} acoes={<>
          <Botao onClick={importarPgr}><Download size={14} /> Importar EPIs do PGR</Botao>
          <Botao tipo="primario" onClick={() => setEditItem({ tipo: "outro", unidade: "un", estoque_atual: 0, estoque_minimo: 0, vida_util_dias: 0, ativo: true })}><Plus size={14} /> Novo EPI</Botao>
        </>}>
          {d.itens.length === 0 && <Vazio>Nenhum EPI cadastrado. Use "Importar EPIs do PGR" para começar.</Vazio>}
          <div className="space-y-2">
            {d.itens.map((i) => {
              const ca = situacao(i.validade_ca, 30);
              const baixo = Number(i.estoque_minimo) > 0 && Number(i.estoque_atual || 0) <= Number(i.estoque_minimo);
              return (
                <div key={i.id} className="flex flex-wrap items-center gap-2 rounded-lg p-3" style={{ background: WORK.bg, opacity: i.ativo === false ? 0.5 : 1 }}>
                  <div className="flex-1 min-w-[200px] text-sm" style={{ color: WORK.text }}>
                    <b>{i.nome}</b> <span style={{ color: WORK.muted }}>· {TIPOS_EPI[i.tipo] || ""} · CA {i.ca || "—"}{Number(i.vida_util_dias) > 0 ? ` · troca a cada ${i.vida_util_dias} dias` : ""}</span>
                  </div>
                  <Etiqueta cor={ca.cor}>{ca.k === "sem" ? "Validade do CA não informada" : `CA: ${ca.label}`}</Etiqueta>
                  <Etiqueta cor={baixo ? "#8A5A00" : "#5F6368"}>{baixo && <AlertTriangle size={10} className="inline mr-1" />}Estoque {i.estoque_atual ?? 0} {i.unidade || ""}</Etiqueta>
                  <button onClick={() => setEditItem({ ...i })} style={{ color: WORK.muted }}><Pencil size={15} /></button>
                  <button onClick={async () => { if (confirm("Excluir este EPI do catálogo?")) { await base44.entities.EpiItem.delete(i.id); carregar(); } }} style={{ color: WORK.muted }}><Trash2 size={15} /></button>
                </div>
              );
            })}
          </div>
        </Cartao>
      )}

      {editItem && <EditorItem item={editItem} setItem={setEditItem} empresaId={empresaId} onFechar={() => setEditItem(null)} aoSalvar={carregar} />}
      {entrega && <NovaEntrega d={d} empresaId={empresaId} inicialTrab={entrega.trabalhador_id} onFechar={() => setEntrega(null)} aoSalvar={carregar} />}
    </div>
  );
}
