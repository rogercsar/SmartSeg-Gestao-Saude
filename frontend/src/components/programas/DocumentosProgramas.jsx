import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sparkles, Printer, Download, CheckCircle2, AlertTriangle, Info, Library } from "lucide-react";
import GerarPgrCatalogo from "@/components/programas/GerarPgrCatalogo";
import { WORK, DOCUMENTOS, CONSELHOS, TIPOS_RISCO, soNumeros, avaliar } from "@/lib/sst";
import { gerarTextos } from "@/lib/programasIA";
import { Botao, Campo, Cartao, Etiqueta, erroMsg } from "@/components/programas/ui";
import { conclusaoCargo } from "@/components/programas/Laudos";
import AssinaturaDoc from "@/components/programas/Assinatura";
import { statusCalibracao } from "@/components/programas/Medicoes";
import { pendenciasPgr } from "@/lib/pgrConformidade";

// ===== Validação para eSocial (S-2240 e S-2220) =====
export function validarEsocial(dados) {
  const erros = [];
  const avisos = [];
  const pgr = dados.programas.find((p) => p.tipo === "pgr");
  const resp = pgr?.responsavel || {};
  if (!dados.unidades.length) erros.push("Cadastre ao menos uma unidade (estabelecimento com CNPJ/CNO/CAEPF).");
  dados.unidades.forEach((u) => { if (!soNumeros(u.numero_inscricao)) erros.push(`Unidade "${u.nome}": falta o número de inscrição.`); });
  dados.setores.forEach((s) => { if (!s.unidade_id) erros.push(`Setor "${s.nome}": vincule a uma unidade.`); });
  dados.cargos.forEach((c) => {
    if (!c.setor_id) erros.push(`Cargo "${c.nome_cargo}": vincule a um setor.`);
    if (!c.atividades) erros.push(`Cargo "${c.nome_cargo}": descreva as atividades (campo dscAtivDes do S-2240).`);
    if (!c.cbo) avisos.push(`Cargo "${c.nome_cargo}": informe o CBO.`);
    if (!dados.riscos.some((r) => (r.cargo_ids || []).includes(c.id))) avisos.push(`Cargo "${c.nome_cargo}": sem riscos — no S-2240 será informado "ausência de agente nocivo" (09.01.001).`);
    if (!dados.exames.some((e) => e.cargo_id === c.id && e.ativo !== false)) erros.push(`Cargo "${c.nome_cargo}": sem exames no PCMSO.`);
  });
  dados.trabalhadores.forEach((t) => {
    if (soNumeros(t.cpf).length !== 11) erros.push(`Colaborador "${t.nome}": CPF inválido ou ausente.`);
    if (!t.matricula) erros.push(`Colaborador "${t.nome}": falta a matrícula do eSocial.`);
    if (!t.cargo_id) erros.push(`Colaborador "${t.nome}": sem cargo.`);
  });
  dados.riscos.forEach((r) => {
    const nome = `Risco "${r.agente}"`;
    if (!r.codigo_esocial) erros.push(`${nome}: falta o código da Tabela 24.`);
    if (!(r.cargo_ids || []).length) avisos.push(`${nome}: não está vinculado a nenhum cargo.`);
    if (r.tipo_avaliacao === "quantitativa" && (!r.intensidade || !r.unidade_medida || !r.tecnica_medicao)) erros.push(`${nome}: avaliação quantitativa sem intensidade, unidade ou técnica de medição.`);
    (r.epi || []).forEach((e) => { if (!soNumeros(e.ca)) erros.push(`${nome}: EPI "${e.nome}" sem número de CA.`); });
    if (!r.revisado) avisos.push(`${nome}: ainda não revisado pelo responsável técnico.`);
  });
  if (!resp.nome || soNumeros(resp.cpf).length !== 11 || !resp.conselho || !resp.numero || !resp.uf) erros.push("PGR: complete os dados do responsável técnico (nome, CPF, conselho, número e UF) — obrigatórios no S-2240.");
  const pcmso = dados.programas.find((p) => p.tipo === "pcmso");
  const med = pcmso?.medico_coordenador || {};
  if (!med.nome || !med.crm || !med.uf) erros.push("PCMSO: complete os dados do médico coordenador (nome, CRM e UF).");
  (dados.medicoes || []).forEach((m) => {
    const eq = (dados.equipamentos || []).find((e) => e.id === m.equipamento_id);
    if (!eq) avisos.push(`Medição de ${m.data || "data?"}: sem equipamento informado.`);
    else if (!statusCalibracao(eq, m.data).ok) avisos.push(`Medição de ${m.data || "data?"}: equipamento com calibração inválida na data.`);
  });
  return { erros, avisos, pronto: erros.length === 0 };
}

// ===== Prévia dos dados do S-2240 por colaborador (o módulo eSocial gera o XML) =====
function exportarS2240(dados) {
  const pgr = dados.programas.find((p) => p.tipo === "pgr");
  const resp = pgr?.responsavel || {};
  const ideOC = { CRM: 1, CREA: 4 }[resp.conselho] || 9;
  const tpInsc = { cnpj: 1, caepf: 3, cno: 4 };
  const hoje = new Date().toISOString().slice(0, 10);
  const saida = dados.trabalhadores.map((t) => {
    const cargo = dados.cargos.find((c) => c.id === t.cargo_id) || {};
    const setor = dados.setores.find((s) => s.id === (t.setor_id || cargo.setor_id)) || {};
    const unidade = dados.unidades.find((u) => u.id === setor.unidade_id) || {};
    const riscos = dados.riscos.filter((r) => (r.cargo_ids || []).includes(cargo.id));
    const efic = (lista) => (lista.length ? (lista.every((x) => x.eficaz) ? "S" : "N") : undefined);
    return {
      evento: "S-2240",
      cpfTrab: soNumeros(t.cpf),
      matricula: t.matricula || "",
      nome: t.nome,
      infoExpRisco: {
        dtIniCondicao: t.data_admissao && t.data_admissao > (pgr?.data_emissao || "") ? t.data_admissao : pgr?.data_emissao || hoje,
        infoAmb: [{ localAmb: 1, dscSetor: setor.nome || "", tpInsc: tpInsc[unidade.tipo_inscricao] || 1, nrInsc: soNumeros(unidade.numero_inscricao) }],
        infoAtiv: { dscAtivDes: cargo.atividades || "" },
        agNoc: riscos.length
          ? riscos.map((r) => ({
            codAgNoc: r.codigo_esocial || "",
            dscAgNoc: r.agente,
            tpAval: r.tipo_avaliacao === "quantitativa" ? 1 : 2,
            ...(r.tipo_avaliacao === "quantitativa" ? { intConc: r.intensidade, limTol: r.limite_tolerancia, unMed: r.unidade_medida, tecMedicao: r.tecnica_medicao } : {}),
            epcEpi: {
              utilizEPC: (r.epc || []).length ? 2 : 0,
              eficEpc: efic(r.epc || []),
              utilizEPI: (r.epi || []).length ? 2 : 0,
              eficEpi: efic(r.epi || []),
              epi: (r.epi || []).map((e) => ({ docAval: soNumeros(e.ca), dscEPI: e.nome })),
            },
          }))
          : [{ codAgNoc: "09.01.001", dscAgNoc: "Ausência de agente nocivo ou de atividades previstas no Anexo IV do Decreto 3.048/1999" }],
        respReg: [{ cpfResp: soNumeros(resp.cpf), nmResp: resp.nome, ideOC, dscOC: ideOC === 9 ? resp.conselho : undefined, nrOC: resp.numero, ufOC: resp.uf }],
      },
    };
  });
  const blob = new Blob([JSON.stringify({ empresa: dados.empresa.razao_social, cnpj: soNumeros(dados.empresa.cnpj), gerado_em: new Date().toISOString(), observacao: "Prévia de dados para o módulo eSocial. unMed deve ser convertido para o código da tabela do leiaute.", eventos: saida }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `S-2240_${soNumeros(dados.empresa.cnpj) || "empresa"}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function Responsavel({ valor = {}, onChange, medico }) {
  const set = (k, v) => onChange({ ...valor, [k]: v });
  if (medico) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Campo label="Médico coordenador" valor={valor.nome} onChange={(v) => set("nome", v)} className="md:col-span-2" />
        <Campo label="CRM" valor={valor.crm} onChange={(v) => set("crm", v)} />
        <Campo label="UF" valor={valor.uf} onChange={(v) => set("uf", v)} />
        <Campo label="CPF" valor={valor.cpf} onChange={(v) => set("cpf", v)} />
      </div>
  );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      <Campo label="Responsável técnico" valor={valor.nome} onChange={(v) => set("nome", v)} className="md:col-span-2" />
      <Campo label="CPF" valor={valor.cpf} onChange={(v) => set("cpf", v)} />
      <Campo label="Formação" valor={valor.formacao} onChange={(v) => set("formacao", v)} placeholder="Eng. de Segurança…" />
      <Campo label="Conselho" tipo="select" opcoes={CONSELHOS} valor={valor.conselho} onChange={(v) => set("conselho", v)} />
      <Campo label="Número do registro" valor={valor.numero} onChange={(v) => set("numero", v)} />
      <Campo label="UF" valor={valor.uf} onChange={(v) => set("uf", v)} />
    </div>
);
}

function resumoParaIA(dados, tipo) {
  const porTipo = Object.fromEntries(Object.keys(TIPOS_RISCO).map((k) => [TIPOS_RISCO[k].label, dados.riscos.filter((r) => r.tipo === k).map((r) => r.agente)]));
  return {
    empresa: { razao_social: dados.empresa.razao_social, cnae: dados.empresa.cnae, grau_risco: dados.empresa.grau_de_risco, atividade: dados.empresa.setor_descricao },
    unidades: dados.unidades.map((u) => `${u.nome} (${u.municipio || ""}/${u.uf || ""})`),
    setores: dados.setores.map((s) => s.nome),
    cargos: dados.cargos.map((c) => {
      const riscos = dados.riscos.filter((r) => (r.cargo_ids || []).includes(c.id));
      const k = conclusaoCargo(riscos);
      return { cargo: c.nome_cargo, riscos: riscos.map((r) => `${r.agente} (${avaliar(r, "5x5")?.label || "não avaliado"})`), insalubre: k.insalubre ? k.grau : false, periculoso: k.perigoso, aposentadoria_especial: k.aposentadoria, exames: tipo === "pcmso" ? dados.exames.filter((e) => e.cargo_id === c.id && e.ativo !== false).map((e) => e.exame) : undefined };
    }),
    riscos_por_tipo: porTipo,
    acoes_pendentes: dados.riscos.flatMap((r) => (r.plano_acao || []).filter((a) => a.status !== "concluida").map((a) => a.acao)).length,
  };
}

function CartaoDocumento({ tipo, dados, recarregar }) {
  const info = DOCUMENTOS[tipo];
  const existente = dados.programas.find((p) => p.tipo === tipo);
  const pgr = dados.programas.find((p) => p.tipo === "pgr");
  const [doc, setDoc] = useState(existente || { tipo, versao: "1.0", status: "rascunho", matriz: "5x5", responsavel: pgr?.responsavel || {} });
  const [salvando, setSalvando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [gerandoCat, setGerandoCat] = useState(false);
  const set = (k, v) => setDoc((d) => ({ ...d, [k]: v }));
  const [textosSalvos, setTextosSalvos] = useState(existente?.textos || {});
  const [trilha, setTrilha] = useState(null);
  const autenticidade = (action, params) => base44.functions.invoke("autenticidade", { action, ...params }).then((r) => r?.data || {});

  const salvar = async (extra = {}, origemIa = false) => {
    const futuro = { ...doc, ...extra };
    if (tipo === "pgr" && futuro.status === "emitido") {
      const faltas = pendenciasPgr(dados, futuro);
      if (faltas.length || !futuro.documento_assinado?.file_uri) {
        alert(`O PGR não pode ser marcado como emitido: ${faltas.length ? faltas.join("; ") : "anexe a versão assinada do documento"}.`);
        return;
      }
    }
    setSalvando(true);
    try {
      const { id, created_date, updated_date, created_by, created_by_id, ...d } = futuro; // eslint-disable-line no-unused-vars
      let programaId = id;
      if (id) await base44.entities.ProgramaSST.update(id, d);
      else { const novo = await base44.entities.ProgramaSST.create({ ...d, company_id: dados.empresa.id }); setDoc(novo); programaId = novo.id; }
      // Trilha de autoria: registra o que o profissional alterou nos textos (comparado à última sugestão da IA)
      const novosTextos = futuro.textos || {};
      const mudou = Object.keys({ ...novosTextos, ...textosSalvos }).filter((k) => (novosTextos[k] || "") !== (textosSalvos[k] || ""));
      if (programaId && mudou.length && !origemIa) {
        await autenticidade("registrar", { documento_id: programaId, evento: "editado", secoes: Object.fromEntries(mudou.map((k) => [k, novosTextos[k] || ""])) }).catch(() => {});
      }
      setTextosSalvos(novosTextos);
      // Emissão: gera (ou reaproveita) o código de autenticidade com o hash do conteúdo
      if (programaId && futuro.status === "emitido") {
        const r2 = await autenticidade("emitir", { documento_id: programaId }).catch((e) => { alert("Documento salvo, mas o código de autenticidade não foi gerado: " + (e?.data?.mensagem || e.message)); return {}; });
        if (r2.codigo) setDoc((x) => ({ ...x, id: programaId, autenticacao_codigo: r2.codigo }));
      }
      // Snapshot automático do inventário quando o PGR é emitido (NR-01, 1.5.7.3.3.1 — preservar 20 anos)
      if (tipo === "pgr" && futuro.status === "emitido" && programaId) {
        const versao = futuro.versao || "1.0";
        const jaExiste = await base44.entities.InventarioSnapshot.filter({ company_id: dados.empresa.id, programa_id: programaId, versao }, { limit: 1 }).catch(() => ({ items: [] }));
        const lista = jaExiste.items || jaExiste;
        if (!lista.length) {
          const inventario = {
            setores: dados.setores.map((s) => ({ id: s.id, nome: s.nome, descricao_ambiente: s.descricao_ambiente })),
            cargos: dados.cargos.map((c) => ({ id: c.id, nome_cargo: c.nome_cargo, cbo: c.cbo, setor_id: c.setor_id, atividades: c.atividades })),
            riscos: dados.riscos.map((r) => ({
              id: r.id, tipo: r.tipo, agente: r.agente, codigo_esocial: r.codigo_esocial,
              setor_id: r.setor_id, cargo_ids: r.cargo_ids, fonte_geradora: r.fonte_geradora,
              possiveis_danos: r.possiveis_danos, exposicao: r.exposicao,
              tipo_avaliacao: r.tipo_avaliacao, intensidade: r.intensidade, unidade_medida: r.unidade_medida,
              limite_tolerancia: r.limite_tolerancia, tecnica_medicao: r.tecnica_medicao,
              severidade: r.severidade, probabilidade: r.probabilidade, nivel_risco: r.nivel_risco,
              criterio_avaliacao: r.criterio_avaliacao, data_avaliacao: r.data_avaliacao,
              medidas_existentes: r.medidas_existentes, epc: r.epc, epi: r.epi, plano_acao: r.plano_acao, revisado: r.revisado,
            })),
          };
          await base44.entities.InventarioSnapshot.create({
            company_id: dados.empresa.id, programa_id: programaId, versao,
            data_emissao: futuro.data_emissao, data_snapshot: new Date().toISOString(),
            inventario,
            resumo: { total_setores: dados.setores.length, total_cargos: dados.cargos.length, total_riscos: dados.riscos.length },
            responsavel_tecnico: futuro.responsavel || {},
          }).catch(() => {});
        }
      }
      recarregar();
      return programaId;
    } catch (e) {
      alert("Erro ao salvar: " + (e?.message || ""));
    } finally {
      setSalvando(false);
    }
  };

  const iaTextos = async () => {
    setGerando(true);
    try {
      const textos = await gerarTextos(tipo, info.nome, info.base, resumoParaIA(dados, tipo));
      set("textos", textos);
      const id = await salvar({ textos }, true);
      if (id) await autenticidade("registrar", { documento_id: id, evento: "ia_sugeriu", secoes: textos }).catch(() => {});
    } catch (e) { erroMsg(e); } finally { setGerando(false); }
  };

  const t = doc.textos || {};
  return (
    <Cartao titulo={`${info.label} — ${info.nome}`}
      acoes={<>
        <Etiqueta cor={doc.status === "emitido" && (tipo !== "pgr" || (doc.documento_assinado?.file_uri && !pendenciasPgr(dados, doc).length)) ? "#22C55E" : "#EAB308"}>{doc.status === "emitido" && (tipo !== "pgr" || (doc.documento_assinado?.file_uri && !pendenciasPgr(dados, doc).length)) ? "Emitido" : "Rascunho"}</Etiqueta>
        {doc.id && <Link to={`/programas/imprimir?empresa=${dados.empresa.id}&tipo=${tipo}`} target="_blank"><Botao><Printer size={14} /> Visualizar / PDF</Botao></Link>}
      </>}>
      <p className="text-xs mb-3" style={{ color: WORK.muted }}>Base: {info.base}</p>
      {tipo === "pgr" && <div className="rounded-lg border p-3 mb-3 text-xs" style={{ borderColor: WORK.border, color: WORK.text }}>
        <strong>Pendências documentais NR-01 (não substitui avaliação técnica):</strong>
        {pendenciasPgr(dados, doc).length ? <ul className="list-disc pl-5 mt-2 space-y-1">{pendenciasPgr(dados, doc).map((p, i) => <li key={i}>{p}</li>)}</ul> : <p className="mt-1">Campos verificados; confira evidências, assinatura e requisitos aplicáveis antes de usar.</p>}
        <p className="mt-2" style={{ color: WORK.muted }}>Ao emitir o PGR, o sistema cria automaticamente um snapshot imutável do inventário (aba "Histórico"). O histórico é preservado por, no mínimo, 20 anos (1.5.7.3.3.1).</p>
      </div>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
        <Campo label="Versão" valor={doc.versao} onChange={(v) => set("versao", v)} />
        <Campo label="Data de emissão" tipo="date" valor={doc.data_emissao} onChange={(v) => set("data_emissao", v)} />
        <Campo label="Vigência até" tipo="date" valor={doc.vigencia_ate} onChange={(v) => set("vigencia_ate", v)} />
        <Campo label="Status" tipo="select" opcoes={{ rascunho: "Rascunho", emitido: "Emitido" }} valor={doc.status} onChange={(v) => set("status", v)} />
      </div>
      <Responsavel valor={doc.responsavel} onChange={(v) => set("responsavel", v)} />
      {tipo === "pcmso" && <div className="mt-2"><Responsavel medico valor={doc.medico_coordenador} onChange={(v) => set("medico_coordenador", v)} /></div>}
      <details className="mt-3">
        <summary className="text-sm cursor-pointer" style={{ color: WORK.text }}>Textos técnicos {Object.keys(t).length ? "(preenchidos)" : "(vazios)"}</summary>
        <div className="space-y-2 mt-2">
          {["introducao", "metodologia", "responsabilidades", "conclusao", "revisao"].map((k) => (
            <Campo key={k} label={k[0].toUpperCase() + k.slice(1)} tipo="textarea" linhas={4} valor={t[k]} onChange={(v) => set("textos", { ...t, [k]: v })} />
        ))}
        </div>
      </details>
      <AssinaturaDoc doc={doc} dados={dados} onSalvar={async (extra) => { setDoc((d) => ({ ...d, ...extra })); await salvar(extra); }} />
      <div className="flex flex-wrap gap-2 mt-3">
        <Botao onClick={iaTextos} carregando={gerando} title="3 créditos"><Sparkles size={14} /> Redigir textos com IA</Botao>
        {tipo === "pgr" && <Botao tipo="primario" onClick={() => setGerandoCat(true)}><Library size={14} /> Gerar PGR do catálogo</Botao>}
        <Botao tipo="primario" onClick={() => salvar()} carregando={salvando}>Salvar</Botao>
        {doc.id && <Botao onClick={async () => setTrilha(await autenticidade("trilha", { documento_id: doc.id }).catch((e) => ({ erro: e.message })))}>Trilha de autoria</Botao>}
        {doc.autenticacao_codigo && <span className="text-xs self-center" style={{ color: "#146C43" }}>Código de autenticidade: <b>{doc.autenticacao_codigo}</b></span>}
      </div>
      {tipo === "pgr" && gerandoCat && (
        <GerarPgrCatalogo
          aberto={gerandoCat}
          dados={dados}
          recarregar={recarregar}
          onFechar={() => setGerandoCat(false)}
          onConcluido={(textos) => { setDoc((d) => ({ ...d, textos })); salvar({ textos }); setGerandoCat(false); }}
        />
    )}
      {trilha && (
        <div className="mt-4 rounded-lg border p-3" style={{ borderColor: "#E3E8EE" }}>
          <div className="flex items-center mb-2"><b className="text-sm">Trilha de autoria</b><button className="ml-auto text-xs underline" onClick={() => setTrilha(null)}>fechar</button></div>
          {trilha.erro && <p className="text-xs" style={{ color: "#B42318" }}>{trilha.erro}</p>}
          {(trilha.eventos || []).length === 0 && !trilha.erro && <p className="text-xs" style={{ color: "#5F6368" }}>Nenhum evento registrado ainda.</p>}
          <div className="space-y-1">
            {(trilha.eventos || []).map((e) => (
              <div key={e.id} className="text-xs flex flex-wrap gap-2" style={{ color: "#1F2328" }}>
                <span style={{ color: "#5F6368" }}>{new Date(e.data).toLocaleString("pt-BR")}</span>
                <b>{{ ia_sugeriu: "IA sugeriu textos", editado: "Profissional editou", emitido: "Documento emitido", revogado: "Revogado" }[e.evento] || e.evento}</b>
                <span>por {e.usuario}</span>
                {e.detalhes?.secoes && <span style={{ color: "#5F6368" }}>· seções: {e.detalhes.secoes.join(", ")}</span>}
                {e.detalhes?.percentual_alterado_vs_ia && <span style={{ color: "#0B6FA8" }}>· alterado em relação à IA: {Object.entries(e.detalhes.percentual_alterado_vs_ia).map(([k, v]) => `${k} ${v === null ? "—" : v + "%"}`).join("; ")}</span>}
                {e.detalhes?.codigo && <span style={{ color: "#146C43" }}>· código {e.detalhes.codigo}</span>}
              </div>
          ))}
          </div>
          <p className="text-[11px] mt-2" style={{ color: "#5F6368" }}>Registros imutáveis: não podem ser editados nem apagados por nenhum usuário. Mostram que o conteúdo sugerido pela IA foi revisado pelo profissional antes da emissão.</p>
        </div>
    )}
    </Cartao>
);
}

export default function DocumentosProgramas({ dados, recarregar }) {
  const v = validarEsocial(dados);
  const [verTudo, setVerTudo] = useState(false);
  const lista = [...v.erros.map((e) => ["erro", e]), ...v.avisos.map((a) => ["aviso", a])];

  return (
    <div className="space-y-4">
      <Cartao titulo="Prontidão para o eSocial (S-2240 / S-2220)"
        acoes={<Botao onClick={() => exportarS2240(dados)} disabled={!dados.trabalhadores.length}><Download size={14} /> Exportar dados S-2240 (JSON)</Botao>}>
        <div className="flex items-center gap-2 mb-2">
          {v.pronto ? <CheckCircle2 size={18} style={{ color: "#22C55E" }} /> : <AlertTriangle size={18} style={{ color: "#EAB308" }} />}
          <span className="text-sm" style={{ color: WORK.text }}>
            {v.pronto ? "Dados obrigatórios completos." : `${v.erros.length} pendência(s) obrigatória(s)`} · {v.avisos.length} aviso(s)
          </span>
        </div>
        <div className="space-y-1">
          {(verTudo ? lista : lista.slice(0, 8)).map(([tipo, m], i) => (
            <p key={i} className="text-xs flex gap-1.5" style={{ color: tipo === "erro" ? "#FCA5A5" : WORK.muted }}>
              {tipo === "erro" ? <AlertTriangle size={12} className="mt-0.5 shrink-0" /> : <Info size={12} className="mt-0.5 shrink-0" />}{m}
            </p>
        ))}
        </div>
        {lista.length > 8 && <button className="text-xs underline mt-2" style={{ color: WORK.muted }} onClick={() => setVerTudo(!verTudo)}>{verTudo ? "Ver menos" : `Ver todas (${lista.length})`}</button>}
        <p className="text-[11px] mt-3" style={{ color: WORK.muted }}>O arquivo exportado é uma prévia estruturada no leiaute do S-2240; o módulo eSocial fará a geração do XML, a assinatura e o envio.</p>
      </Cartao>
      {Object.keys(DOCUMENTOS).map((tipo) => <CartaoDocumento key={tipo} tipo={tipo} dados={dados} recarregar={recarregar} />)}
    </div>
);
}