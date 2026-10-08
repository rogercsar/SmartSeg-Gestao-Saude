import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Library, Stethoscope, ClipboardCheck } from "lucide-react";
import { WORK, TIPOS_RISCO, MOMENTOS_EXAME } from "@/lib/sst";
import { Botao, Campo, Modal, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";
import ComboboxCodigoEsocial from "@/components/esocial/ComboboxCodigoEsocial";
import { carregarCatalogos, limparCacheCatalogo, riscosDoExame } from "@/lib/catalogoSst";

const tiposOpc = Object.fromEntries(Object.entries(TIPOS_RISCO).map(([k, v]) => [k, v.label]));

function ChipeSocial({ codigo, descricao }) {
  if (!codigo) return <Etiqueta cor="#94A3B8">sem código eSocial</Etiqueta>;
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(11,111,168,0.12)", color: WORK.accent }} title={descricao || ""}>
      eSocial {codigo}{descricao ? ` — ${descricao}` : ""}
    </span>
  );
}

function MultiChips({ opcoes, selecionados, onToggle, vazioMsg }) {
  if (!opcoes.length) return <span className="text-xs" style={{ color: WORK.muted }}>{vazioMsg}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {opcoes.map((o) => {
        const on = (selecionados || []).includes(o.id);
        return (
          <button key={o.id} type="button" onClick={() => onToggle(o.id)} className="px-2 py-0.5 rounded-full text-[11px] border" style={{ borderColor: on ? WORK.accent : WORK.border, color: on ? WORK.accent : WORK.muted }} title={o.descricao || ""}>
            {on ? "✓ " : ""}{o.nome || o.exame}
          </button>
        );
      })}
    </div>
  );
}

function CatalogoRiscos() {
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);
  const [cat, setCat] = useState({ exames: [], aptidoes: [] });

  const carregar = () => {
    setLoading(true);
    base44.entities.RiscoCatalogo.filter({}, { sort: "agente", limit: 500 })
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    carregarCatalogos().then(setCat).catch(() => {});
  };
  useEffect(carregar, []);

  const termo = busca.trim().toLowerCase();
  const filtrados = items.filter(
    (i) => !termo || (i.agente || "").toLowerCase().includes(termo) || (i.descricao || "").toLowerCase().includes(termo) || (i.codigo_esocial || "").toLowerCase().includes(termo)
  );

  const salvar = async () => {
    if (!edit.tipo || !edit.agente) return alert("Informe o tipo e o agente.");
    const { id, created_date, updated_date, created_by, created_by_id, ...d } = edit; // eslint-disable-line no-unused-vars
    d.codigo_esocial_descricao = d.codigo_esocial_descricao || "";
    d.exame_ids = d.exame_ids || [];
    d.aptidao_ids = d.aptidao_ids || [];
    if (id) await base44.entities.RiscoCatalogo.update(id, d);
    else await base44.entities.RiscoCatalogo.create(d);
    limparCacheCatalogo();
    setEdit(null);
    carregar();
  };
  const excluir = async (i) => {
    if (!confirm(`Excluir "${i.agente}" do catálogo?`)) return;
    await base44.entities.RiscoCatalogo.delete(i.id);
    limparCacheCatalogo();
    carregar();
  };

  const nomesExames = (ids) => (ids || []).map((id) => cat.exames.find((x) => x.id === id)).filter(Boolean).map((x) => x.exame);
  const nomesAptidoes = (ids) => (ids || []).map((id) => cat.aptidoes.find((x) => x.id === id)).filter(Boolean).map((x) => x.nome);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 min-w-[220px]" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar agente, descrição ou código eSocial..." className="flex-1 text-sm outline-none" style={{ color: WORK.text, background: "transparent" }} />
        </div>
        <Botao tipo="primario" onClick={() => setEdit({ tipo: "fisico", ativo: true, exame_ids: [], aptidao_ids: [] })}><Plus size={14} /> Novo risco</Botao>
      </div>
      <div className="text-sm" style={{ color: WORK.muted }}>{items.length} item(ns) no catálogo global</div>
      {loading && <Vazio>Carregando...</Vazio>}
      {!loading && filtrados.length === 0 && <Vazio>Nenhum item. Cadastre o primeiro risco do catálogo.</Vazio>}
      {!loading &&
        filtrados.map((i) => {
          const exs = nomesExames(i.exame_ids);
          const aps = nomesAptidoes(i.aptidao_ids);
          return (
            <Cartao key={i.id}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Etiqueta cor={TIPOS_RISCO[i.tipo]?.cor || "#94A3B8"}>{TIPOS_RISCO[i.tipo]?.label || i.tipo}</Etiqueta>
                    <b style={{ color: WORK.text }}>{i.agente}</b>
                    <ChipeSocial codigo={i.codigo_esocial} descricao={i.codigo_esocial_descricao} />
                  </div>
                  {i.descricao && <p className="text-sm mt-1" style={{ color: WORK.text }}>{i.descricao}</p>}
                  <p className="text-xs mt-1" style={{ color: WORK.muted }}>
                    {i.fonte_geradora && <>Fonte: {i.fonte_geradora}. </>}
                    {i.possiveis_danos && <>Danos: {i.possiveis_danos}.</>}
                  </p>
                  {(exs.length > 0 || aps.length > 0) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {exs.length > 0 && <span className="text-[11px]" style={{ color: WORK.muted }}>Exames: {exs.join(", ")}</span>}
                      {aps.length > 0 && <span className="text-[11px]" style={{ color: "#0B6FA8" }}>Aptidões: {aps.join(", ")}</span>}
                    </div>
                  )}
                </div>
                <button onClick={() => setEdit({ ...i, exame_ids: i.exame_ids || [], aptidao_ids: i.aptidao_ids || [] })} style={{ color: WORK.muted }}><Pencil size={15} /></button>
                <button onClick={() => excluir(i)} style={{ color: WORK.muted }}><Trash2 size={15} /></button>
              </div>
            </Cartao>
          );
        })}

      {edit && (
        <Modal
          aberto
          onFechar={() => setEdit(null)}
          titulo={edit.id ? "Editar risco do catálogo" : "Novo risco do catálogo"}
          largura="max-w-2xl"
          rodape={<><Botao onClick={() => setEdit(null)}>Cancelar</Botao><Botao tipo="primario" onClick={salvar}>Salvar</Botao></>}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Campo label="Tipo *" tipo="select" opcoes={tiposOpc} valor={edit.tipo} onChange={(v) => setEdit((e) => ({ ...e, tipo: v }))} />
              <Campo label="Agente / perigo *" valor={edit.agente} onChange={(v) => setEdit((e) => ({ ...e, agente: v }))} className="md:col-span-2" />
            </div>
            <Campo label="Descrição / orientação de uso" tipo="textarea" valor={edit.descricao} onChange={(v) => setEdit((e) => ({ ...e, descricao: v }))} />
            <div>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Código eSocial (Tabela 24 — agente nocivo / aposentadoria especial)</span>
              <ComboboxCodigoEsocial
                tabela="agente_nocivo_aposentadoria"
                value={edit.codigo_esocial || ""}
                onChange={(v) => setEdit((e) => ({ ...e, codigo_esocial: v }))}
                onChangeItem={(it) => setEdit((e) => ({ ...e, codigo_esocial_descricao: it?.descricao || "" }))}
                placeholder="Buscar agente nocivo..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Campo label="Fonte geradora sugerida" valor={edit.fonte_geradora} onChange={(v) => setEdit((e) => ({ ...e, fonte_geradora: v }))} />
              <Campo label="Possíveis danos / agravos" valor={edit.possiveis_danos} onChange={(v) => setEdit((e) => ({ ...e, possiveis_danos: v }))} />
            </div>
            <Campo label="Meio de propagação / via" valor={edit.meio_propagacao} onChange={(v) => setEdit((e) => ({ ...e, meio_propagacao: v }))} />

            <div className="rounded-lg border p-3" style={{ borderColor: WORK.border, background: "rgba(11,111,168,0.04)" }}>
              <div className="text-xs font-medium mb-2" style={{ color: WORK.accent }}>Vínculos globais (sugeridos em PGR e PCMSO)</div>
              <div className="mb-3">
                <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Exames associados (catálogo)</span>
                <MultiChips opcoes={cat.exames} selecionados={edit.exame_ids} onToggle={(id) => setEdit((e) => ({ ...e, exame_ids: (e.exame_ids || []).includes(id) ? e.exame_ids.filter((x) => x !== id) : [...(e.exame_ids || []), id] }))} vazioMsg="Nenhum exame cadastrado." />
              </div>
              <div>
                <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Aptidões ASO associadas (catálogo)</span>
                <MultiChips opcoes={cat.aptidoes} selecionados={edit.aptidao_ids} onToggle={(id) => setEdit((e) => ({ ...e, aptidao_ids: (e.aptidao_ids || []).includes(id) ? e.aptidao_ids.filter((x) => x !== id) : [...(e.aptidao_ids || []), id] }))} vazioMsg="Nenhuma aptidão cadastrada." />
              </div>
            </div>

            <Campo tipo="checkbox" label="Ativo no catálogo" valor={edit.ativo !== false} onChange={(v) => setEdit((e) => ({ ...e, ativo: v }))} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function CatalogoExames() {
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);
  const [cat, setCat] = useState({ riscos: [] });

  const carregar = () => {
    setLoading(true);
    base44.entities.ExameCatalogo.filter({}, { sort: "exame", limit: 500 })
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    carregarCatalogos().then(setCat).catch(() => {});
  };
  useEffect(carregar, []);

  const termo = busca.trim().toLowerCase();
  const filtrados = items.filter(
    (i) => !termo || (i.exame || "").toLowerCase().includes(termo) || (i.descricao || "").toLowerCase().includes(termo) || (i.codigo_esocial || "").toLowerCase().includes(termo)
  );

  const salvar = async () => {
    if (!edit.exame) return alert("Informe o nome do exame.");
    const { id, created_date, updated_date, created_by, created_by_id, ...d } = edit; // eslint-disable-line no-unused-vars
    d.codigo_esocial_descricao = d.codigo_esocial_descricao || "";
    if (id) await base44.entities.ExameCatalogo.update(id, d);
    else await base44.entities.ExameCatalogo.create(d);
    limparCacheCatalogo();
    setEdit(null);
    carregar();
  };
  const excluir = async (i) => {
    if (!confirm(`Excluir "${i.exame}" do catálogo?`)) return;
    await base44.entities.ExameCatalogo.delete(i.id);
    limparCacheCatalogo();
    carregar();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 min-w-[220px]" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar exame, descrição ou código eSocial..." className="flex-1 text-sm outline-none" style={{ color: WORK.text, background: "transparent" }} />
        </div>
        <Botao tipo="primario" onClick={() => setEdit({ periodicidade_meses: 12, momentos_default: ["admissional", "periodico"], ativo: true })}><Plus size={14} /> Novo exame</Botao>
      </div>
      <div className="text-sm" style={{ color: WORK.muted }}>{items.length} item(ns) no catálogo global</div>
      {loading && <Vazio>Carregando...</Vazio>}
      {!loading && filtrados.length === 0 && <Vazio>Nenhum item. Cadastre o primeiro exame do catálogo.</Vazio>}
      {!loading &&
        filtrados.map((i) => {
          const riscosRel = riscosDoExame(cat, i.id);
          return (
            <Cartao key={i.id}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <b style={{ color: WORK.text }}>{i.exame}</b>
                    <ChipeSocial codigo={i.codigo_esocial} descricao={i.codigo_esocial_descricao} />
                    {i.periodicidade_meses && <span className="text-[11px]" style={{ color: WORK.muted }}>a cada {i.periodicidade_meses}m</span>}
                  </div>
                  {i.descricao && <p className="text-sm mt-1" style={{ color: WORK.text }}>{i.descricao}</p>}
                  {i.momentos_default?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {i.momentos_default.map((m) => <span key={m} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: WORK.bg, color: WORK.muted }}>{MOMENTOS_EXAME[m] || m}</span>)}
                    </div>
                  )}
                  {riscosRel.length > 0 && (
                    <div className="mt-2">
                      <span className="text-[11px]" style={{ color: WORK.muted }}>Riscos associados: </span>
                      {riscosRel.map((r) => <span key={r.id} className="text-[11px] mr-1" style={{ color: WORK.accent }}>{r.agente};</span>)}
                    </div>
                  )}
                </div>
                <button onClick={() => setEdit({ ...i })} style={{ color: WORK.muted }}><Pencil size={15} /></button>
                <button onClick={() => excluir(i)} style={{ color: WORK.muted }}><Trash2 size={15} /></button>
              </div>
            </Cartao>
          );
        })}

      {edit && (
        <Modal
          aberto
          onFechar={() => setEdit(null)}
          titulo={edit.id ? "Editar exame do catálogo" : "Novo exame do catálogo"}
          largura="max-w-2xl"
          rodape={<><Botao onClick={() => setEdit(null)}>Cancelar</Botao><Botao tipo="primario" onClick={salvar}>Salvar</Botao></>}
        >
          <div className="space-y-3">
            <Campo label="Exame *" valor={edit.exame} onChange={(v) => setEdit((e) => ({ ...e, exame: v }))} />
            <Campo label="Descrição / indicação" tipo="textarea" valor={edit.descricao} onChange={(v) => setEdit((e) => ({ ...e, descricao: v }))} />
            <div>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Código eSocial (Tabela 27 — procedimento diagnóstico)</span>
              <ComboboxCodigoEsocial
                tabela="procedimento_diagnostico"
                value={edit.codigo_esocial || ""}
                onChange={(v) => setEdit((e) => ({ ...e, codigo_esocial: v }))}
                onChangeItem={(it) => setEdit((e) => ({ ...e, codigo_esocial_descricao: it?.descricao || "" }))}
                placeholder="Buscar procedimento diagnóstico..."
              />
            </div>
            <Campo label="Periodicidade padrão (meses)" tipo="number" valor={edit.periodicidade_meses ?? 12} onChange={(v) => setEdit((e) => ({ ...e, periodicidade_meses: v || 12 }))} />
            <div>
              <span className="block text-xs mb-1" style={{ color: WORK.muted }}>Momentos padrão</span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(MOMENTOS_EXAME).map(([k, v]) => {
                  const on = (edit.momentos_default || []).includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setEdit((e) => ({ ...e, momentos_default: on ? (e.momentos_default || []).filter((x) => x !== k) : [...(e.momentos_default || []), k] }))}
                      className="px-2 py-0.5 rounded-full text-[11px] border"
                      style={{ borderColor: on ? WORK.accent : WORK.border, color: on ? WORK.accent : WORK.muted }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
            <Campo label="Modelo de justificativa técnica" tipo="textarea" valor={edit.justificativa_modelo} onChange={(v) => setEdit((e) => ({ ...e, justificativa_modelo: v }))} />
            <Campo tipo="checkbox" label="Ativo no catálogo" valor={edit.ativo !== false} onChange={(v) => setEdit((e) => ({ ...e, ativo: v }))} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function CatalogoAptidoes() {
  const [items, setItems] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);

  const carregar = () => {
    setLoading(true);
    base44.entities.AptidaoCatalogo.filter({}, { sort: "nome", limit: 500 })
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
  useEffect(carregar, []);

  const termo = busca.trim().toLowerCase();
  const filtrados = items.filter((i) => !termo || (i.nome || "").toLowerCase().includes(termo) || (i.descricao || "").toLowerCase().includes(termo));

  const salvar = async () => {
    if (!edit.nome) return alert("Informe o nome da aptidão.");
    const { id, created_date, updated_date, created_by, created_by_id, ...d } = edit; // eslint-disable-line no-unused-vars
    if (id) await base44.entities.AptidaoCatalogo.update(id, d);
    else await base44.entities.AptidaoCatalogo.create(d);
    limparCacheCatalogo();
    setEdit(null);
    carregar();
  };
  const excluir = async (i) => {
    if (!confirm(`Excluir "${i.nome}" do catálogo?`)) return;
    await base44.entities.AptidaoCatalogo.delete(i.id);
    limparCacheCatalogo();
    carregar();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 min-w-[220px]" style={{ background: WORK.surface, borderColor: WORK.border }}>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar aptidão..." className="flex-1 text-sm outline-none" style={{ color: WORK.text, background: "transparent" }} />
        </div>
        <Botao tipo="primario" onClick={() => setEdit({ ativo: true })}><Plus size={14} /> Nova aptidão</Botao>
      </div>
      <div className="text-xs" style={{ color: WORK.muted }}>Aptidões são sugestões do catálogo para avaliação e validação do médico responsável no ASO — não substituem decisão clínica.</div>
      <div className="text-sm" style={{ color: WORK.muted }}>{items.length} item(ns) no catálogo global</div>
      {loading && <Vazio>Carregando...</Vazio>}
      {!loading && filtrados.length === 0 && <Vazio>Nenhum item. Cadastre a primeira aptidão.</Vazio>}
      {!loading &&
        filtrados.map((i) => (
          <Cartao key={i.id}>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <b style={{ color: WORK.text }}>{i.nome}</b>
                  {i.grupo && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(11,111,168,0.12)", color: WORK.accent }}>{i.grupo}</span>}
                </div>
                {i.descricao && <p className="text-sm mt-1" style={{ color: WORK.muted }}>{i.descricao}</p>}
              </div>
              <button onClick={() => setEdit({ ...i })} style={{ color: WORK.muted }}><Pencil size={15} /></button>
              <button onClick={() => excluir(i)} style={{ color: WORK.muted }}><Trash2 size={15} /></button>
            </div>
          </Cartao>
        ))}

      {edit && (
        <Modal
          aberto
          onFechar={() => setEdit(null)}
          titulo={edit.id ? "Editar aptidão do catálogo" : "Nova aptidão do catálogo"}
          largura="max-w-xl"
          rodape={<><Botao onClick={() => setEdit(null)}>Cancelar</Botao><Botao tipo="primario" onClick={salvar}>Salvar</Botao></>}
        >
          <div className="space-y-3">
            <Campo label="Aptidão *" valor={edit.nome} onChange={(v) => setEdit((e) => ({ ...e, nome: v }))} placeholder="Ex.: Apto para trabalho em altura" />
            <Campo label="Descrição / quando aplicar" tipo="textarea" valor={edit.descricao} onChange={(v) => setEdit((e) => ({ ...e, descricao: v }))} />
            <Campo label="Grupo" tipo="select" opcoes={{ "": "—", altura: "Trabalho em altura", eletricidade: "Eletricidade", espaco_confinado: "Espaço confinado", radiacao: "Radiação", quimico: "Químico", biologico: "Biológico", fisico: "Físico", maquinario: "Maquinário", transporte: "Transporte", outro: "Outro" }} valor={edit.grupo || ""} onChange={(v) => setEdit((e) => ({ ...e, grupo: v }))} />
            <Campo tipo="checkbox" label="Ativa no catálogo" valor={edit.ativo !== false} onChange={(v) => setEdit((e) => ({ ...e, ativo: v }))} />
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function CatalogosSst() {
  const [aba, setAba] = useState("riscos");
  const ABAS = [
    { key: "riscos", label: "Riscos", icon: Library },
    { key: "exames", label: "Exames", icon: Stethoscope },
    { key: "aptidoes", label: "Aptidões ASO", icon: ClipboardCheck },
  ];
  return (
    <div className="p-4 md:p-8 space-y-4">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: WORK.text, fontFamily: "Plus Jakarta Sans" }}>Catálogos compartilhados</h1>
        <p className="text-sm" style={{ color: WORK.muted }}>Riscos, exames e aptidões globais disponíveis para todas as empresas, vinculados às tabelas do eSocial.</p>
      </div>
      <div className="flex items-center gap-1 border-b overflow-x-auto" style={{ borderColor: WORK.border }}>
        {ABAS.map((a) => {
          const Icon = a.icon;
          const on = aba === a.key;
          return (
            <button
              key={a.key}
              onClick={() => setAba(a.key)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap"
              style={{ borderColor: on ? WORK.accent : "transparent", color: on ? WORK.accent : WORK.muted }}
            >
              <Icon size={16} /> {a.label}
            </button>
          );
        })}
      </div>
      {aba === "riscos" ? <CatalogoRiscos /> : aba === "exames" ? <CatalogoExames /> : <CatalogoAptidoes />}
    </div>
  );
}