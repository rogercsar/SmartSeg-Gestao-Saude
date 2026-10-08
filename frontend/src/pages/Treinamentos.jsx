import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Sparkles, Users, Upload, Eye } from "lucide-react";
import { WORK } from "@/lib/sst";
import { situacao, CATALOGO_TREINAMENTOS, hojeLocal, addMeses, dataBR } from "@/lib/sstGestao";
import { invokeAI } from "@/lib/ai";
import { uploadPrivado, linkTemporario } from "@/lib/privateFiles";
import { Botao, Campo, Modal, Cartao, Etiqueta, Vazio, erroMsg } from "@/components/programas/ui";
import { useEmpresa, SeletorEmpresa, Cabecalho, Abas, Indicador } from "@/components/sst/useEmpresa";

const nrKey = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^NR0?/, "NR");

// Situação de cada exigência da matriz para cada colaborador
export function situacaoTreinamentos(trabalhadores, matriz, registros, hoje = hojeLocal()) {
  return trabalhadores.map((t) => {
    const exig = matriz.filter((m) => m.cargo_id === t.cargo_id && m.obrigatorio !== false);
    const itens = exig.map((m) => {
      const regs = registros.filter((r) => r.trabalhador_id === t.id && nrKey(r.nr) === nrKey(m.nr)).sort((a, b) => (b.data_realizacao || "").localeCompare(a.data_realizacao || ""));
      const ult = regs[0];
      if (!ult) return { m, ult: null, sit: { k: "pendente", label: "Não realizado", cor: "#B42318" } };
      const validade = ult.validade || (Number(m.reciclagem_meses) > 0 ? addMeses(ult.data_realizacao, m.reciclagem_meses) : null);
      const sit = validade ? situacao(validade, 30, hoje) : { k: "ok", label: `Realizado em ${dataBR(ult.data_realizacao)}`, cor: "#146C43" };
      return { m, ult, validade, sit };
    });
    return { t, itens, pend: itens.filter((i) => i.sit.k === "pendente" || i.sit.k === "vencido").length, vence: itens.filter((i) => i.sit.k === "vence").length };
  });
}

function Turma({ d, empresaId, inicial, onFechar, aoSalvar }) {
  const [f, setF] = useState({ nr: "", titulo: "", data_realizacao: hojeLocal(), carga_horaria: "", instrutor: "", reciclagem: "", ...inicial });
  const [sel, setSel] = useState(inicial?.trabalhadores || []);
  const [cert, setCert] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const escolherCatalogo = (nr) => {
    const c = CATALOGO_TREINAMENTOS.find((x) => x.nr === nr);
    if (c) setF((x) => ({ ...x, nr: c.nr, titulo: c.titulo, carga_horaria: c.carga_horaria || x.carga_horaria, reciclagem: c.reciclagem_meses || "" }));
  };
  const salvar = async () => {
    if (!f.nr || !f.data_realizacao || !sel.length) return alert("Informe NR, data e ao menos um participante.");
    setSalvando(true);
    try {
      const certificado_uri = cert ? (await uploadPrivado(cert)).file_uri : "";
      const validade = Number(f.reciclagem) > 0 ? addMeses(f.data_realizacao, f.reciclagem) : "";
      await base44.entities.Treinamento.bulkCreate(sel.map((id) => {
        const t = d.trabalhadores.find((x) => x.id === id);
        return { company_id: empresaId, trabalhador_id: id, trabalhador_nome: t?.nome || "", cargo_id: t?.cargo_id || "", nr: f.nr, titulo: f.titulo,
          data_realizacao: f.data_realizacao, validade, carga_horaria: Number(f.carga_horaria) || null, instrutor: f.instrutor, certificado_uri };
      }));
      aoSalvar(); onFechar();
    } catch (e) { alert("Erro: " + (e?.message || "")); } finally { setSalvando(false); }
  };
  return (
    <Modal aberto onFechar={onFechar} titulo="Registrar treinamento (turma)" largura="max-w-3xl"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao tipo="primario" onClick={salvar} carregando={salvando}>Registrar para {sel.length} pessoa(s)</Botao></>}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Campo label="Do catálogo" tipo="select" opcoes={Object.fromEntries(CATALOGO_TREINAMENTOS.map((c) => [c.nr, `${c.nr} — ${c.titulo}`]))} valor="" onChange={escolherCatalogo} className="md:col-span-3" />
        <Campo label="NR / código *" valor={f.nr} onChange={(v) => set("nr", v)} placeholder="NR-35" />
        <Campo label="Título" valor={f.titulo} onChange={(v) => set("titulo", v)} className="md:col-span-2" />
        <Campo label="Data *" tipo="date" valor={f.data_realizacao} onChange={(v) => set("data_realizacao", v)} />
        <Campo label="Carga horária (h)" tipo="number" valor={f.carga_horaria} onChange={(v) => set("carga_horaria", v)} />
        <Campo label="Reciclagem (meses)" tipo="number" valor={f.reciclagem} onChange={(v) => set("reciclagem", v)} />
        <Campo label="Instrutor / responsável" valor={f.instrutor} onChange={(v) => set("instrutor", v)} className="md:col-span-2" />
        <label className="text-xs flex items-end gap-2 pb-2" style={{ color: WORK.muted }}>
          <span className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border cursor-pointer" style={{ borderColor: WORK.border, color: WORK.text }}>
            <Upload size={14} /> {cert ? "Lista/certificado anexado" : "Anexar lista ou certificado"}
            <input type="file" accept="application/pdf,image/*" hidden onChange={(e) => setCert(e.target.files?.[0] || null)} />
          </span>
        </label>
      </div>
      <div className="flex items-center justify-between mt-4 mb-2">
        <span className="text-xs" style={{ color: WORK.muted }}>Participantes</span>
        <button className="text-xs underline" style={{ color: WORK.accent }} onClick={() => setSel(sel.length === d.trabalhadores.length ? [] : d.trabalhadores.map((t) => t.id))}>{sel.length === d.trabalhadores.length ? "Desmarcar todos" : "Marcar todos"}</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 max-h-60 overflow-y-auto">
        {d.trabalhadores.map((t) => (
          <label key={t.id} className="flex items-center gap-2 text-sm p-1.5 rounded" style={{ color: WORK.text, background: sel.includes(t.id) ? "#E6F2F8" : "transparent" }}>
            <input type="checkbox" checked={sel.includes(t.id)} onChange={() => setSel((s) => (s.includes(t.id) ? s.filter((x) => x !== t.id) : [...s, t.id]))} />
            {t.nome} <span className="text-xs" style={{ color: WORK.muted }}>· {d.cargoNome[t.cargo_id] || "sem cargo"}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}

export default function Treinamentos() {
  const { empresas, empresaId, setEmpresaId, empresa } = useEmpresa();
  const [d, setD] = useState(null);
  const [aba, setAba] = useState("situacao");
  const [turma, setTurma] = useState(null);
  const [cargoSel, setCargoSel] = useState("");
  const [novoReq, setNovoReq] = useState({});
  const [ia, setIa] = useState(false);

  const carregar = useCallback(async () => {
    if (!empresaId) { setD(null); return; }
    const f = (e, o) => base44.entities[e].filter({ company_id: empresaId }, o).catch(() => []);
    const [trabalhadores, cargos, matriz, registros, riscos] = await Promise.all([f("Trabalhador", "nome"), f("CargoFuncao"), f("MatrizTreinamento"), f("Treinamento", "-data_realizacao"), f("Risco")]);
    setD({ trabalhadores: trabalhadores.filter((t) => t.status !== "inativo"), cargos, matriz, registros, riscos, cargoNome: Object.fromEntries(cargos.map((c) => [c.id, c.nome_cargo])) });
    if (!cargoSel && cargos[0]) setCargoSel(cargos[0].id);
  }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { carregar(); }, [carregar]);

  const sit = useMemo(() => (d ? situacaoTreinamentos(d.trabalhadores, d.matriz, d.registros) : []), [d]);

  const addReq = async (req) => {
    if (!cargoSel || !req.nr) return alert("Escolha o cargo e a NR.");
    await base44.entities.MatrizTreinamento.create({ company_id: empresaId, cargo_id: cargoSel, obrigatorio: true, origem: "manual", ...req, carga_horaria: Number(req.carga_horaria) || null, reciclagem_meses: Number(req.reciclagem_meses) || 0 });
    setNovoReq({});
    carregar();
  };

  const sugerirIA = async () => {
    const cargo = d.cargos.find((c) => c.id === cargoSel);
    if (!cargo) return;
    setIa(true);
    try {
      const riscos = d.riscos.filter((r) => (r.cargo_ids || []).includes(cargo.id)).map((r) => `${r.agente} (${r.tipo})`);
      const r = await invokeAI("treinamentos_matriz", {
        prompt: `Você é engenheiro de segurança do trabalho no Brasil. Defina os treinamentos OBRIGATÓRIOS pelas NRs para o cargo abaixo, apenas os que se aplicam às atividades e riscos descritos. Não invente obrigações: se a exigência depender de condição específica, diga isso no fundamento. Informe carga horária mínima e periodicidade de reciclagem em meses (0 quando a NR não fixar prazo), conforme a NR vigente.
Empresa: CNAE ${empresa?.cnae || "?"}, grau de risco ${empresa?.grau_de_risco || "?"}.
Cargo: ${cargo.nome_cargo}. Atividades: ${cargo.atividades || "não descritas"}.
Riscos do PGR: ${riscos.join("; ") || "não cadastrados"}.`,
        response_json_schema: { type: "object", properties: { itens: { type: "array", items: { type: "object", properties: { nr: { type: "string" }, titulo: { type: "string" }, carga_horaria: { type: "number" }, reciclagem_meses: { type: "number" }, fundamento: { type: "string" } } } } } },
      });
      const atuais = d.matriz.filter((m) => m.cargo_id === cargoSel).map((m) => nrKey(m.nr) + "|" + (m.titulo || "").toLowerCase());
      const novos = (r?.itens || []).filter((i) => i.nr && !atuais.includes(nrKey(i.nr) + "|" + (i.titulo || "").toLowerCase()));
      if (!novos.length) return alert("A IA não sugeriu treinamentos novos para este cargo.");
      if (!confirm(`Adicionar à matriz de ${cargo.nome_cargo}:\n\n${novos.map((i) => `• ${i.nr} — ${i.titulo} (${i.carga_horaria || "?"} h, reciclagem ${i.reciclagem_meses || 0} meses)`).join("\n")}\n\nRevise cada item antes de usar.`)) return;
      await base44.entities.MatrizTreinamento.bulkCreate(novos.map((i) => ({ company_id: empresaId, cargo_id: cargoSel, nr: i.nr, titulo: i.titulo, carga_horaria: i.carga_horaria || null, reciclagem_meses: i.reciclagem_meses || 0, fundamento: i.fundamento || "", obrigatorio: true, origem: "ia" })));
      carregar();
    } catch (e) { erroMsg(e); } finally { setIa(false); }
  };

  if (!d) return <div className="p-4 md:p-8 max-w-6xl mx-auto"><Cabecalho titulo="Treinamentos" subtitulo="Matriz de treinamentos por cargo, validade e reciclagem."><SeletorEmpresa empresas={empresas} empresaId={empresaId} setEmpresaId={setEmpresaId} /></Cabecalho></div>;

  const pendentes = sit.reduce((n, s) => n + s.pend, 0);
  const vencem = sit.reduce((n, s) => n + s.vence, 0);
  const semMatriz = d.cargos.filter((c) => !d.matriz.some((m) => m.cargo_id === c.id)).length;
  const matrizCargo = d.matriz.filter((m) => m.cargo_id === cargoSel);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Cabecalho titulo="Treinamentos" subtitulo="A matriz define o que cada cargo precisa; o sistema mostra quem está pendente, vencido ou para vencer.">
        <SeletorEmpresa empresas={empresas} empresaId={empresaId} setEmpresaId={setEmpresaId} />
        <Botao tipo="primario" onClick={() => setTurma({})}><Users size={14} /> Registrar turma</Botao>
      </Cabecalho>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        <Indicador rotulo="Pendentes ou vencidos" valor={pendentes} cor={pendentes ? "#B42318" : "#146C43"} onClick={() => setAba("situacao")} />
        <Indicador rotulo="Vencem em 30 dias" valor={vencem} cor={vencem ? "#8A5A00" : "#146C43"} onClick={() => setAba("situacao")} />
        <Indicador rotulo="Cargos sem matriz" valor={semMatriz} cor={semMatriz ? "#8A5A00" : "#146C43"} onClick={() => setAba("matriz")} />
        <Indicador rotulo="Registros" valor={d.registros.length} onClick={() => setAba("registros")} />
      </div>

      <Abas abas={[["situacao", "Situação por colaborador"], ["matriz", "Matriz por cargo"], ["registros", "Registros"]]} aba={aba} setAba={setAba} />

      {aba === "situacao" && (
        <Cartao>
          {d.matriz.length === 0 && <Vazio>Monte a matriz de treinamentos por cargo para ver a situação de cada colaborador.</Vazio>}
          <div className="space-y-2">
            {sit.filter((s) => s.itens.length).map((s) => (
              <div key={s.t.id} className="rounded-lg border p-3" style={{ borderColor: s.pend ? "#F5C2C0" : WORK.border }}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <b className="text-sm" style={{ color: WORK.text }}>{s.t.nome}</b>
                  <span className="text-xs" style={{ color: WORK.muted }}>{d.cargoNome[s.t.cargo_id]}</span>
                  <span className="ml-auto" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.itens.map((i) => (
                    <button key={i.m.id} title={i.m.titulo} onClick={() => (i.sit.k === "pendente" || i.sit.k === "vencido" || i.sit.k === "vence") && setTurma({ nr: i.m.nr, titulo: i.m.titulo, carga_horaria: i.m.carga_horaria || "", reciclagem: i.m.reciclagem_meses || "", trabalhadores: [s.t.id] })}>
                      <Etiqueta cor={i.sit.cor}>{i.m.nr}: {i.sit.label}</Etiqueta>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-3" style={{ color: WORK.muted }}>Clique em um treinamento pendente ou vencido para registrá-lo.</p>
        </Cartao>
      )}

      {aba === "matriz" && (
        <Cartao titulo="Matriz de treinamentos" acoes={<Botao onClick={sugerirIA} carregando={ia} title="2 créditos"><Sparkles size={14} /> Sugerir com IA</Botao>}>
          <Campo label="Cargo" tipo="select" opcoes={d.cargoNome} valor={cargoSel} onChange={setCargoSel} className="max-w-md mb-3" />
          {matrizCargo.length === 0 && <Vazio>Nenhum treinamento exigido para este cargo.</Vazio>}
          <div className="space-y-1.5 mb-4">
            {matrizCargo.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg p-2.5 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
                <b>{m.nr}</b> {m.titulo}
                <span className="text-xs" style={{ color: WORK.muted }}>· {m.carga_horaria || "?"} h · {Number(m.reciclagem_meses) > 0 ? `reciclagem ${m.reciclagem_meses} meses` : "sem prazo fixo"}{m.fundamento ? ` · ${m.fundamento}` : ""}</span>
                {m.origem === "ia" && <Etiqueta cor="#7C3AED">IA — revisar</Etiqueta>}
                <button className="ml-auto" onClick={async () => { await base44.entities.MatrizTreinamento.delete(m.id); carregar(); }} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
            <Campo label="Do catálogo" tipo="select" opcoes={Object.fromEntries(CATALOGO_TREINAMENTOS.map((c) => [c.nr, `${c.nr} — ${c.titulo}`]))} valor=""
              onChange={(v) => { const c = CATALOGO_TREINAMENTOS.find((x) => x.nr === v); if (c) setNovoReq({ ...c }); }} className="md:col-span-5" />
            <Campo label="NR" valor={novoReq.nr} onChange={(v) => setNovoReq((r) => ({ ...r, nr: v }))} />
            <Campo label="Título" valor={novoReq.titulo} onChange={(v) => setNovoReq((r) => ({ ...r, titulo: v }))} className="md:col-span-2" />
            <Campo label="CH (h)" tipo="number" valor={novoReq.carga_horaria} onChange={(v) => setNovoReq((r) => ({ ...r, carga_horaria: v }))} />
            <Campo label="Reciclagem (meses)" tipo="number" valor={novoReq.reciclagem_meses} onChange={(v) => setNovoReq((r) => ({ ...r, reciclagem_meses: v }))} />
          </div>
          <div className="mt-2"><Botao onClick={() => addReq(novoReq)}><Plus size={14} /> Adicionar ao cargo</Botao></div>
          <p className="text-[11px] mt-3" style={{ color: WORK.muted }}>Cargas horárias e reciclagens do catálogo são referências — confirme na NR vigente e nas normas estaduais aplicáveis.</p>
        </Cartao>
      )}

      {aba === "registros" && (
        <Cartao titulo={`Registros (${d.registros.length})`}>
          {d.registros.length === 0 && <Vazio>Nenhum treinamento registrado.</Vazio>}
          <div className="overflow-x-auto">
            {d.registros.length > 0 && (
              <table className="w-full text-xs" style={{ color: WORK.text }}>
                <thead><tr style={{ color: WORK.muted }}><th className="text-left p-2">Data</th><th className="text-left p-2">Colaborador</th><th className="text-left p-2">Treinamento</th><th className="p-2">CH</th><th className="text-left p-2">Validade</th><th /></tr></thead>
                <tbody>
                  {d.registros.map((r) => {
                    const s = r.validade ? situacao(r.validade) : null;
                    return (
                      <tr key={r.id} className="border-t" style={{ borderColor: WORK.border }}>
                        <td className="p-2">{dataBR(r.data_realizacao)}</td><td className="p-2">{r.trabalhador_nome}</td><td className="p-2"><b>{r.nr}</b> {r.titulo}</td>
                        <td className="p-2 text-center">{r.carga_horaria || ""}</td><td className="p-2">{s ? <Etiqueta cor={s.cor}>{s.label}</Etiqueta> : "sem prazo"}</td>
                        <td className="p-2 flex gap-2">
                          {r.certificado_uri && <button title="Ver anexo" onClick={async () => window.open(await linkTemporario(r.certificado_uri, 600), "_blank")} style={{ color: WORK.accent }}><Eye size={14} /></button>}
                          <button onClick={async () => { if (confirm("Excluir registro?")) { await base44.entities.Treinamento.delete(r.id); carregar(); } }} style={{ color: WORK.muted }}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Cartao>
      )}

      {turma && <Turma d={d} empresaId={empresaId} inicial={turma} onFechar={() => setTurma(null)} aoSalvar={carregar} />}
    </div>
  );
}
