import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Pencil, Trash2, Plus, Camera, Sparkles } from "lucide-react";
import { WORK } from "@/lib/sst";
import { uploadPrivado, linkTemporario } from "@/lib/privateFiles";
import { analisarFoto } from "@/lib/programasIA";
import { Botao, Campo, Modal, Cartao, Vazio, erroMsg } from "@/components/programas/ui";
import PropostaRiscos from "@/components/programas/PropostaRiscos";

// Cadastro genérico (unidade, setor, cargo, trabalhador)
function Crud({ titulo, entidade, itens, campos, companyId, recarregar, linha, extra, padrao = {}, dica }) {
  const [edit, setEdit] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const faltando = campos.filter((c) => c.obrigatorio && !String(edit[c.key] ?? "").trim());
    if (faltando.length) return alert("Preencha: " + faltando.map((c) => c.label).join(", "));
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...dadosItem } = edit; // eslint-disable-line no-unused-vars
      if (id) await base44.entities[entidade].update(id, dadosItem);
      else await base44.entities[entidade].create({ ...dadosItem, company_id: companyId });
      setEdit(null);
      recarregar();
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || ""));
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (item) => {
    if (!confirm("Excluir este registro?")) return;
    await base44.entities[entidade].delete(item.id);
    recarregar();
  };

  return (
    <Cartao titulo={`${titulo} (${itens.length})`} acoes={<Botao onClick={() => setEdit({ ...padrao })}><Plus size={14} /> Adicionar</Botao>}>
      {dica && <p className="text-xs mb-3" style={{ color: WORK.muted }}>{dica}</p>}
      {itens.length === 0 && <Vazio>Nenhum cadastro ainda.</Vazio>}
      <div className="space-y-2">
        {itens.map((it) => (
          <div key={it.id} className="flex items-center gap-2 rounded-lg p-3" style={{ background: WORK.bg }}>
            <div className="flex-1 min-w-0 text-sm" style={{ color: WORK.text }}>{linha(it)}</div>
            <button onClick={() => setEdit({ ...it })} style={{ color: WORK.muted }} title="Editar"><Pencil size={15} /></button>
            <button onClick={() => excluir(it)} style={{ color: WORK.muted }} title="Excluir"><Trash2 size={15} /></button>
          </div>
      ))}
      </div>
      <Modal aberto={!!edit} onFechar={() => setEdit(null)} titulo={`${edit?.id ? "Editar" : "Novo"} — ${titulo}`}
        rodape={<><Botao onClick={() => setEdit(null)}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={salvando}>Salvar</Botao></>}>
        {edit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {campos.map((c) => (
              <Campo key={c.key} label={c.label + (c.obrigatorio ? " *" : "")} tipo={c.tipo} opcoes={typeof c.opcoes === "function" ? c.opcoes(edit) : c.opcoes}
                valor={edit[c.key]} placeholder={c.placeholder} className={c.largo ? "md:col-span-2" : ""}
                onChange={(v) => setEdit((e) => ({ ...e, [c.key]: v }))} />
          ))}
            {extra && <div className="md:col-span-2">{extra(edit, setEdit)}</div>}
          </div>
      )}
      </Modal>
    </Cartao>
);
}

// Fotos do setor + análise por IA
function FotosSetor({ setor, setSetor, dados, recarregar }) {
  const [links, setLinks] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const [proposta, setProposta] = useState(null);
  const fotos = setor.fotos || [];

  useEffect(() => {
    fotos.forEach((f) => {
      if (!links[f.file_uri]) linkTemporario(f.file_uri, 900).then((u) => setLinks((l) => ({ ...l, [f.file_uri]: u }))).catch(() => {});
    });
  }, [fotos.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!setor.id) return <p className="text-xs" style={{ color: WORK.muted }}>Salve o setor para adicionar fotos.</p>;

  const enviar = async (e) => {
    const arqs = [...e.target.files].slice(0, 6);
    if (!arqs.length) return;
    setEnviando(true);
    try {
      const novas = [];
      for (const a of arqs) {
        const { file_uri } = await uploadPrivado(a);
        novas.push({ file_uri, legenda: "" });
      }
      const lista = [...fotos, ...novas];
      await base44.entities.Setor.update(setor.id, { fotos: lista });
      setSetor((s) => ({ ...s, fotos: lista }));
      recarregar();
    } catch (err) {
      alert("Erro ao enviar foto: " + (err?.message || ""));
    } finally {
      setEnviando(false);
      e.target.value = "";
    }
  };

  const remover = async (uri) => {
    const lista = fotos.filter((f) => f.file_uri !== uri);
    await base44.entities.Setor.update(setor.id, { fotos: lista });
    setSetor((s) => ({ ...s, fotos: lista }));
    recarregar();
  };

  const analisar = async () => {
    setAnalisando(true);
    try {
      const ctx = { empresa: dados.empresa, setor, unidade: dados.unidades.find((u) => u.id === setor.unidade_id) };
      const todos = [];
      const obs = [];
      for (const f of fotos.slice(0, 4)) {
        const r = await analisarFoto(f.file_uri, ctx);
        todos.push(...r.riscos);
        if (r.observacoes) obs.push(r.observacoes);
      }
      const unicos = todos.filter((r, i) => todos.findIndex((x) => (x.agente || "").toLowerCase() === (r.agente || "").toLowerCase()) === i);
      await base44.entities.Setor.update(setor.id, { analise_ia: { data: new Date().toISOString(), observacoes: obs.join("\n\n") } });
      setProposta({ riscos: unicos, observacoes: obs.join("\n\n") });
    } catch (e) {
      erroMsg(e);
    } finally {
      setAnalisando(false);
    }
  };

  return (
    <div className="border-t pt-3" style={{ borderColor: WORK.border }}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs" style={{ color: WORK.muted }}>Fotos do setor (privadas)</span>
        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer" style={{ borderColor: WORK.border, color: WORK.text }}>
          <Camera size={14} /> {enviando ? "Enviando…" : "Adicionar fotos"}
          <input type="file" accept="image/*" multiple hidden onChange={enviar} disabled={enviando} />
        </label>
        {fotos.length > 0 && (
          <Botao onClick={analisar} carregando={analisando} title="2 créditos por foto (até 4 fotos)"><Sparkles size={14} /> Analisar riscos nas fotos</Botao>
      )}
      </div>
      <div className="flex flex-wrap gap-2">
        {fotos.map((f) => (
          <div key={f.file_uri} className="relative w-24 h-24 rounded-lg overflow-hidden" style={{ background: WORK.bg }}>
            {links[f.file_uri] && <img src={links[f.file_uri]} alt="" className="w-full h-full object-cover" />}
            <button onClick={() => remover(f.file_uri)} className="absolute top-1 right-1 rounded bg-black/60 p-0.5" style={{ color: "#fff" }}><Trash2 size={12} /></button>
          </div>
      ))}
      </div>
      {setor.analise_ia?.observacoes && (
        <p className="text-xs mt-2 whitespace-pre-line" style={{ color: WORK.muted }}><b>Última análise:</b> {setor.analise_ia.observacoes}</p>
    )}
      <PropostaRiscos aberto={!!proposta} onFechar={() => setProposta(null)} riscos={proposta?.riscos || []} observacoes={proposta?.observacoes}
        dados={dados} setorId={setor.id} origem="foto" aoSalvar={recarregar} />
    </div>
);
}

export default function Estrutura({ dados, recarregar, irPara }) {
  const cid = dados.empresa.id;
  const unidades = Object.fromEntries(dados.unidades.map((u) => [u.id, u.nome]));
  const setores = Object.fromEntries(dados.setores.map((s) => [s.id, `${s.nome}${unidades[s.unidade_id] ? " — " + unidades[s.unidade_id] : ""}`]));
  const cargos = Object.fromEntries(dados.cargos.map((c) => [c.id, c.nome_cargo]));
  const e = dados.empresa;

  return (
    <div className="space-y-4">
      <Cartao titulo="Empresa">
        <p className="text-sm" style={{ color: WORK.text }}>{e.razao_social} · CNPJ {e.cnpj || "—"} · CNAE {e.cnae || "—"} · Grau de risco {e.grau_de_risco || "—"}</p>
        <p className="text-xs mt-1" style={{ color: WORK.muted }}>
          Ordem recomendada: unidades → setores (com descrição do ambiente e fotos) → cargos (com descrição das atividades) → colaboradores.
          Quanto mais detalhadas as descrições, melhor a caracterização dos riscos pela IA.
        </p>
      </Cartao>

      <Crud titulo="Unidades / estabelecimentos" entidade="Unidade" itens={dados.unidades} companyId={cid} recarregar={recarregar}
        padrao={{ tipo_inscricao: "cnpj", numero_inscricao: e.cnpj || "", cnae: e.cnae || "", uf: e.uf || "", municipio: e.municipio || "", grau_risco: e.grau_de_risco || "" }}
        dica="Cada estabelecimento com CNPJ, CNO (obra) ou CAEPF próprio é uma unidade — o eSocial exige essa inscrição no S-2240."
        campos={[
          { key: "nome", label: "Nome", obrigatorio: true, placeholder: "Matriz, Filial Várzea Grande, Obra X…" },
          { key: "tipo_inscricao", label: "Tipo de inscrição", tipo: "select", opcoes: { cnpj: "CNPJ", cno: "CNO (obra)", caepf: "CAEPF" }, obrigatorio: true },
          { key: "numero_inscricao", label: "Número da inscrição", obrigatorio: true },
          { key: "cnae", label: "CNAE" },
          { key: "grau_risco", label: "Grau de risco (NR-4)", tipo: "select", opcoes: { 1: "1", 2: "2", 3: "3", 4: "4" } },
          { key: "num_trabalhadores", label: "Nº de trabalhadores", tipo: "number" },
          { key: "endereco", label: "Endereço", largo: true },
          { key: "municipio", label: "Município" },
          { key: "uf", label: "UF" },
        ]}
        linha={(u) => <><b>{u.nome}</b> <span style={{ color: WORK.muted }}>· {String(u.tipo_inscricao || "").toUpperCase()} {u.numero_inscricao || "—"} · {u.municipio || ""}/{u.uf || ""}</span></>}
      />

      <Crud titulo="Setores" entidade="Setor" itens={dados.setores} companyId={cid} recarregar={recarregar}
        padrao={{ unidade_id: dados.unidades.length === 1 ? dados.unidades[0].id : "" }}
        dica="Descreva o ambiente: área, pé-direito, piso, iluminação, ventilação, máquinas, produtos. Adicione fotos para a IA analisar."
        campos={[
          { key: "nome", label: "Nome do setor", obrigatorio: true },
          { key: "unidade_id", label: "Unidade", tipo: "select", opcoes: unidades, obrigatorio: true },
          { key: "descricao_ambiente", label: "Descrição do ambiente", tipo: "textarea", largo: true },
        ]}
        linha={(s) => <><b>{s.nome}</b> <span style={{ color: WORK.muted }}>· {unidades[s.unidade_id] || "sem unidade"} · {(s.fotos || []).length} foto(s)</span></>}
        extra={(s, setS) => <FotosSetor setor={s} setSetor={setS} dados={dados} recarregar={recarregar} />}
      />

      <Crud titulo="Cargos / funções" entidade="CargoFuncao" itens={dados.cargos} companyId={cid} recarregar={recarregar}
        dica="A descrição das atividades é a base da caracterização dos riscos, do PCMSO e dos laudos (e vai para o S-2240)."
        campos={[
          { key: "nome_cargo", label: "Nome do cargo", obrigatorio: true },
          { key: "cbo", label: "CBO" },
          { key: "setor_id", label: "Setor", tipo: "select", opcoes: setores, obrigatorio: true },
          { key: "ghe", label: "GHE (opcional)", placeholder: "Ex.: GHE-01 Produção" },
          { key: "jornada", label: "Jornada", placeholder: "Ex.: 44h semanais, 07h às 17h" },
          { key: "quantidade_funcionarios", label: "Qtd. de funcionários", tipo: "number" },
          { key: "atividades", label: "Descrição detalhada das atividades", tipo: "textarea", largo: true },
        ]}
        linha={(c) => <><b>{c.nome_cargo}</b> <span style={{ color: WORK.muted }}>· CBO {c.cbo || "—"} · {setores[c.setor_id] || "sem setor"}{c.atividades ? "" : " ·  sem descrição de atividades"}</span></>}
      />

      <Crud titulo="Colaboradores" entidade="Trabalhador" itens={dados.trabalhadores} companyId={cid} recarregar={recarregar}
        dica="CPF e matrícula são obrigatórios para os eventos S-2220 e S-2240 do eSocial."
        campos={[
          { key: "nome", label: "Nome", obrigatorio: true },
          { key: "cpf", label: "CPF" },
          { key: "matricula", label: "Matrícula eSocial" },
          { key: "data_nascimento", label: "Nascimento", tipo: "date" },
          { key: "sexo", label: "Sexo", tipo: "select", opcoes: { M: "Masculino", F: "Feminino" } },
          { key: "data_admissao", label: "Admissão", tipo: "date" },
          { key: "cargo_id", label: "Cargo", tipo: "select", opcoes: cargos, obrigatorio: true },
          { key: "setor_id", label: "Setor", tipo: "select", opcoes: setores },
        ]}
        linha={(t) => <><b>{t.nome}</b> <span style={{ color: WORK.muted }}>· {cargos[t.cargo_id] || "sem cargo"} · CPF {t.cpf || "—"}{!t.cpf || !t.matricula ? " ·  faltam dados eSocial" : ""}</span></>}
      />

      <div className="flex justify-end"><Botao tipo="primario" onClick={() => irPara("riscos")}>Próximo: riscos →</Botao></div>
    </div>
);
}
