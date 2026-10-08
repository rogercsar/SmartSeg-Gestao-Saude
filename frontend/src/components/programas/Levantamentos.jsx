import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Copy, Send, Eye, Sparkles, Trash2 } from "lucide-react";
import { WORK, novoToken } from "@/lib/sst";
import { linkTemporario } from "@/lib/privateFiles";
import { analisarLevantamento } from "@/lib/programasIA";
import { Botao, Campo, Modal, Cartao, Etiqueta, Vazio, erroMsg } from "@/components/programas/ui";
import PropostaRiscos from "@/components/programas/PropostaRiscos";

const APP_URL = "https://zela-work-care.base44.app";
const APP_ID = "6ab51b5efe53d6829e11b8bc";
export const linkLevantamento = (token) => `${APP_URL}/api/apps/${APP_ID}/functions/levantamento-publico?t=${token}`;

const TIPOS = { colaborador: "Colaborador", tecnico: "Técnico de SST", empresa: "Responsável da empresa" };
const STATUS = { enviado: ["Aguardando resposta", "#EAB308"], respondido: ["Respondido", "#22C55E"], incorporado: ["Incorporado aos riscos", "#94A3B8"] };
const EXP = {
  ruido: "Ruído", calor: "Calor", frio: "Frio", vibracao: "Vibração", poeira: "Poeira", fumos: "Fumos/gases/vapores", quimicos: "Químicos",
  biologico: "Biológico", radiacao: "Radiação", peso: "Peso", postura: "Postura/repetitividade", altura: "Altura", eletricidade: "Eletricidade",
  maquinas: "Máquinas", confinado: "Espaço confinado", inflamaveis: "Inflamáveis", transito: "Trânsito", psicossocial: "Psicossocial", noturno: "Noturno/turnos",
};

function Respostas({ lev, dados, onFechar, recarregar }) {
  const [links, setLinks] = useState([]);
  const [ocupado, setOcupado] = useState(false);
  const [proposta, setProposta] = useState(null);
  const r = lev.respostas || {};
  const setor = dados.setores.find((s) => s.id === lev.setor_id);
  const cargo = dados.cargos.find((c) => c.id === lev.cargo_id);

  useEffect(() => {
    Promise.all((lev.fotos || []).map((u) => linkTemporario(u, 900).catch(() => null))).then((l) => setLinks(l.filter(Boolean)));
  }, [lev.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const gerar = async () => {
    if (!lev.setor_id) return alert("Este levantamento não tem setor definido.");
    setOcupado(true);
    try {
      const res = await analisarLevantamento({ ...r, _quem: TIPOS[lev.destinatario_tipo] }, { empresa: dados.empresa, setor, cargo });
      setProposta(res);
    } catch (e) { erroMsg(e); } finally { setOcupado(false); }
  };

  const fotosParaSetor = async () => {
    if (!setor) return;
    const novas = (lev.fotos || []).filter((u) => !(setor.fotos || []).some((f) => f.file_uri === u)).map((u) => ({ file_uri: u, legenda: "Levantamento" }));
    await base44.entities.Setor.update(setor.id, { fotos: [...(setor.fotos || []), ...novas] });
    alert(`${novas.length} foto(s) adicionada(s) ao setor ${setor.nome}.`);
    recarregar();
  };

  const linha = (t, v) => v ? <div className="mb-3"><p className="text-xs" style={{ color: WORK.muted }}>{t}</p><p className="text-sm whitespace-pre-line" style={{ color: WORK.text }}>{v}</p></div> : null;

  return (
    <Modal aberto onFechar={onFechar} titulo={`Respostas — ${lev.destinatario_nome || TIPOS[lev.destinatario_tipo]}`}
      rodape={<>
        {links.length > 0 && <Botao onClick={fotosParaSetor}>Adicionar fotos ao setor</Botao>}
        {lev.status !== "enviado" && <Botao tipo="primario" onClick={gerar} carregando={ocupado} title="2 créditos"><Sparkles size={14} /> Gerar riscos com IA</Botao>}
      </>}>
      {lev.status === "enviado" && <Vazio>Ainda não respondido.</Vazio>}
      {linha("Atividades", r.atividades)}
      {linha("Equipamentos", r.equipamentos)}
      {(r.exposicoes || []).length > 0 && (
        <div className="mb-3"><p className="text-xs mb-1" style={{ color: WORK.muted }}>Exposições relatadas</p>
          <div className="flex flex-wrap gap-1">{r.exposicoes.map((e) => <Etiqueta key={e} cor={WORK.accent}>{EXP[e] || e}</Etiqueta>)}</div></div>
      )}
      {linha("Produtos químicos", r.quimicos)}
      {linha("EPIs", r.epis)}
      {linha("Acidentes / quase acidentes", r.acidentes)}
      {linha("Queixas", r.queixas)}
      {linha("Sugestões", r.sugestoes)}
      {links.length > 0 && <div className="flex flex-wrap gap-2">{links.map((u) => <img key={u} src={u} alt="" className="w-28 h-28 object-cover rounded-lg" />)}</div>}
      <PropostaRiscos aberto={!!proposta} onFechar={() => setProposta(null)} riscos={proposta?.riscos || []} observacoes={proposta?.observacoes}
        dados={dados} setorId={lev.setor_id} cargoIds={lev.cargo_id ? [lev.cargo_id] : []} origem="levantamento"
        aoSalvar={async () => { await base44.entities.Levantamento.update(lev.id, { status: "incorporado" }); recarregar(); onFechar(); }} />
    </Modal>
  );
}

export default function Levantamentos({ dados, recarregar }) {
  const [novo, setNovo] = useState(null);
  const [ver, setVer] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const setores = Object.fromEntries(dados.setores.map((s) => [s.id, s.nome]));

  const criar = async () => {
    if (!novo.setor_id) return alert("Escolha o setor.");
    setSalvando(true);
    try {
      const expira = new Date(Date.now() + (Number(novo.dias) || 15) * 86400000).toISOString();
      const l = await base44.entities.Levantamento.create({
        company_id: dados.empresa.id, setor_id: novo.setor_id, cargo_id: novo.cargo_id || "", destinatario_nome: novo.nome || "",
        destinatario_tipo: novo.tipo || "colaborador", token: novoToken(), status: "enviado", expira_em: expira,
      });
      setNovo(null);
      recarregar();
      compartilhar(l);
    } catch (e) {
      alert("Erro: " + (e?.message || ""));
    } finally {
      setSalvando(false);
    }
  };

  const texto = (l) => `Olá${l.destinatario_nome ? " " + l.destinatario_nome : ""}! Ajude a identificar os riscos do seu trabalho em ${dados.empresa.razao_social}. Leva 5 minutos: ${linkLevantamento(l.token)}`;
  const compartilhar = async (l) => {
    try { await navigator.clipboard.writeText(linkLevantamento(l.token)); alert("Link copiado! Envie por WhatsApp ou e-mail."); } catch { prompt("Copie o link:", linkLevantamento(l.token)); }
  };

  return (
    <div className="space-y-4">
      <Cartao titulo="Levantamento a quatro mãos"
        acoes={<Botao tipo="primario" onClick={() => setNovo({ tipo: "colaborador", dias: 15, setor_id: dados.setores[0]?.id || "" })} disabled={!dados.setores.length}><Plus size={14} /> Novo formulário</Botao>}>
        <p className="text-sm" style={{ color: WORK.text }}>
          Envie um link para o colaborador, o técnico de SST ou o responsável da empresa responder <b>sem precisar de login</b>: atividades, exposições, produtos, EPIs, acidentes e fotos.
          Depois, a IA transforma as respostas em riscos caracterizados, que você revisa antes de incluir.
        </p>
        {!dados.setores.length && <p className="text-xs mt-2" style={{ color: WORK.muted }}>Cadastre setores na aba Estrutura primeiro.</p>}
      </Cartao>

      <Cartao titulo={`Formulários (${dados.levantamentos.length})`}>
        {dados.levantamentos.length === 0 && <Vazio>Nenhum formulário enviado.</Vazio>}
        <div className="space-y-2">
          {[...dados.levantamentos].sort((a, b) => (b.created_date || "").localeCompare(a.created_date || "")).map((l) => {
            const [st, cor] = STATUS[l.status] || ["", "#94A3B8"];
            const expirado = l.status === "enviado" && l.expira_em && new Date(l.expira_em) < new Date();
            return (
              <div key={l.id} className="flex flex-wrap items-center gap-2 rounded-lg p-3" style={{ background: WORK.bg }}>
                <div className="flex-1 min-w-0 text-sm" style={{ color: WORK.text }}>
                  <b>{l.destinatario_nome || TIPOS[l.destinatario_tipo]}</b>
                  <span style={{ color: WORK.muted }}> · {TIPOS[l.destinatario_tipo]} · {setores[l.setor_id] || "—"}</span>
                </div>
                <Etiqueta cor={expirado ? "#EF4444" : cor}>{expirado ? "Expirado" : st}</Etiqueta>
                {l.status === "enviado" && !expirado && <>
                  <button onClick={() => compartilhar(l)} title="Copiar link" style={{ color: WORK.muted }}><Copy size={15} /></button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(texto(l))}`} target="_blank" rel="noreferrer" title="Enviar por WhatsApp" style={{ color: "#22C55E" }}><Send size={15} /></a>
                </>}
                {l.status !== "enviado" && <button onClick={() => setVer(l)} title="Ver respostas" style={{ color: WORK.accent }}><Eye size={16} /></button>}
                <button onClick={async () => { if (confirm("Excluir formulário?")) { await base44.entities.Levantamento.delete(l.id); recarregar(); } }} style={{ color: WORK.muted }}><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>
      </Cartao>

      <Modal aberto={!!novo} onFechar={() => setNovo(null)} titulo="Novo formulário de levantamento" largura="max-w-lg"
        rodape={<><Botao onClick={() => setNovo(null)}>Cancelar</Botao><Botao tipo="primario" onClick={criar} carregando={salvando}>Criar e copiar link</Botao></>}>
        {novo && (
          <div className="space-y-3">
            <Campo label="Quem vai responder" tipo="select" opcoes={TIPOS} valor={novo.tipo} onChange={(v) => setNovo((n) => ({ ...n, tipo: v }))} />
            <Campo label="Nome (opcional)" valor={novo.nome} onChange={(v) => setNovo((n) => ({ ...n, nome: v }))} />
            <Campo label="Setor *" tipo="select" opcoes={setores} valor={novo.setor_id} onChange={(v) => setNovo((n) => ({ ...n, setor_id: v, cargo_id: "" }))} />
            <Campo label="Cargo (opcional)" tipo="select" opcoes={Object.fromEntries(dados.cargos.filter((c) => c.setor_id === novo.setor_id).map((c) => [c.id, c.nome_cargo]))}
              valor={novo.cargo_id} onChange={(v) => setNovo((n) => ({ ...n, cargo_id: v }))} />
            <Campo label="Validade do link (dias)" tipo="number" valor={novo.dias} onChange={(v) => setNovo((n) => ({ ...n, dias: v }))} />
          </div>
        )}
      </Modal>
      {ver && <Respostas lev={ver} dados={dados} onFechar={() => setVer(null)} recarregar={recarregar} />}
    </div>
  );
}
