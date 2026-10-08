import React, { useCallback, useEffect, useState } from "react";
import { base44, obterOrganizacao } from "@/api/base44Client";
import { Plus, Pencil, Save, ShieldCheck, Users } from "lucide-react";
import { WORK } from "@/lib/sst";
import { MODULOS, SO_VER, PERFIS_ORG } from "@/lib/organizacao";
import { Botao, Campo, Modal, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";
import { Cabecalho, Abas } from "@/components/sst/useEmpresa";

async function acao(action, params = {}) {
  try {
    const r = await base44.functions.invoke("organizacao", { action, ...params });
    return r?.data || {};
  } catch (err) {
    const d = (err?.data && typeof err.data === "object" ? err.data : null) || err?.response?.data || {};
    throw new Error(d.mensagem || err?.message || "Falha na operação.");
  }
}

const NIVEL = { nenhum: ["Sem acesso", "#5F6368"], ver: ["Ver", "#0B6FA8"], editar: ["Ver e editar", "#146C43"] };

export default function Organizacao() {
  const [ctx, setCtx] = useState(null);
  const [membros, setMembros] = useState([]);
  const [aba, setAba] = useState("equipe");
  const [edit, setEdit] = useState(null);
  const [perm, setPerm] = useState(null);
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [empresas, setEmpresas] = useState([]);

  const carregar = useCallback(async () => {
    const c = await obterOrganizacao(true);
    setCtx(c);
    setPerm(c?.org?.permissoes || null);
    setNome(c?.org?.nome || "");
    setMembros(await base44.entities.MembroOrganizacao.filter({ org_id: c?.org?.id }, "nome").catch(() => []));
    setEmpresas(await base44.entities.Company.list("razao_social", 1000).catch(() => []));
  }, []);
  useEffect(() => { carregar().catch((e) => alert(e.message)); }, [carregar]);

  if (!ctx) return <div className="p-4 md:p-8 max-w-5xl mx-auto"><Cabecalho titulo="Perfil de acesso" /><Vazio>Carregando…</Vazio></div>;
  const admin = ctx.membro?.perfil === "admin";

  const salvarMembro = async () => {
    setSalvando(true);
    try {
      await acao("membro_salvar", edit);
      if (!edit.id) {
        try { await base44.users.inviteUser(edit.email, "user"); } catch { /* já tem conta no SmartSeg */ }
      }
      setEdit(null);
      await carregar();
    } catch (e) { alert(e.message); } finally { setSalvando(false); }
  };

  const salvarPermissoes = async () => {
    setSalvando(true);
    try {
      const r = await acao("permissoes_salvar", { permissoes: perm });
      alert(`Permissões salvas e aplicadas a ${r.atualizados} pessoa(s). Quem estiver conectado verá a mudança ao atualizar a página.`);
      await carregar();
    } catch (e) { alert(e.message); } finally { setSalvando(false); }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <Cabecalho titulo="Perfil de acesso" subtitulo="Todos os membros trabalham na mesma base de dados. O administrador define o que cada perfil pode ver e editar." />

      <Cartao className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <Campo label="Nome da organização" valor={nome} onChange={setNome} className="flex-1 min-w-[240px]" />
          {admin && <Botao onClick={async () => { try { await acao("renomear", { nome }); await carregar(); } catch (e) { alert(e.message); } }}><Save size={14} /> Salvar nome</Botao>}
        </div>
        <p className="text-xs mt-2" style={{ color: WORK.muted }}>Você está como <b>{PERFIS_ORG[ctx.membro?.perfil]}</b>{ctx.titular ? " (titular)" : ""}.</p>
        <label className="flex items-start gap-2 mt-3 text-sm" style={{ color: WORK.text }}>
          <input type="checkbox" disabled={!admin} checked={!!ctx.org?.canal_escuta} className="mt-1"
            onChange={async (e) => { try { await acao("config", { canal_escuta: e.target.checked }); await carregar(); } catch (err) { alert(err.message); } }} />
          <span><b>Canal de escuta</b> (opcional): espaço anônimo para o trabalhador registrar como está se sentindo, com triagem de risco e orientação de ajuda. Os relatos não são visíveis para a empresa. Pode apoiar a gestão de riscos psicossociais (NR-1).</span>
        </label>
      </Cartao>

      <Abas abas={[["equipe", "Equipe"], ["permissoes", "Permissões por perfil"], ["portal", "Portal do cliente"]]} aba={aba} setAba={setAba} />

      {aba === "portal" && (
        <Cartao titulo="Portal do cliente (RH da empresa atendida)">
          <p className="text-xs mb-3" style={{ color: WORK.muted }}>Cada empresa recebe um link exclusivo, somente leitura, com ASOs liberados (apto/inapto), periódicos a agendar, treinamentos vencidos, programas e laudos e ações atrasadas. Nenhum dado clínico é exibido. Desativar invalida o link na hora; reativar gera um link novo.</p>
          <div className="space-y-1.5">
            {empresas.map((e) => {
              const url = `https://zela-work-care.base44.app/api/apps/6ab51b5efe53d6829e11b8bc/functions/portal-cliente?t=${e.portal_token}`;
              return (
                <div key={e.id} className="flex flex-wrap items-center gap-2 rounded-lg p-2.5 text-sm" style={{ background: WORK.bg, color: WORK.text }}>
                  <span className="flex-1 min-w-[200px]">{e.razao_social}</span>
                  {e.portal_ativo && e.portal_token ? <>
                    <Etiqueta cor="#146C43">ativo</Etiqueta>
                    <Botao onClick={() => { navigator.clipboard.writeText(url); alert("Link copiado."); }}>Copiar link</Botao>
                    <a href={url} target="_blank" rel="noreferrer"><Botao>Abrir</Botao></a>
                    <Botao tipo="perigo" onClick={async () => { await base44.entities.Company.update(e.id, { portal_ativo: false, portal_token: "" }); carregar(); }}>Desativar</Botao>
                  </> : (
                    <Botao tipo="primario" onClick={async () => {
                      const tk = Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => b.toString(16).padStart(2, "0")).join("");
                      try { await base44.entities.Company.update(e.id, { portal_ativo: true, portal_token: tk }); carregar(); } catch (err) { alert("Sem permissão para editar esta empresa: " + err.message); }
                    }}>Ativar portal</Botao>
                  )}
                </div>
              );
            })}
          </div>
        </Cartao>
      )}

      {aba === "equipe" && (
        <Cartao titulo={`Membros (${membros.length})`} acoes={admin && <Botao tipo="primario" onClick={() => setEdit({ perfil: "funcionario", ativo: true })}><Plus size={14} /> Convidar</Botao>}>
          <p className="text-xs mb-3" style={{ color: WORK.muted }}>O convidado recebe um e-mail de acesso ao SmartSeg. No primeiro acesso, ele entra automaticamente nesta organização e passa a ver os mesmos dados, conforme as permissões do perfil.</p>
          <div className="space-y-1.5">
            {membros.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg p-2.5 text-sm" style={{ background: WORK.bg, color: WORK.text, opacity: m.ativo === false ? 0.5 : 1 }}>
                <span className="flex-1 min-w-[200px]">{m.nome || m.email}<span className="block text-xs" style={{ color: WORK.muted }}>{m.email}</span></span>
                <Etiqueta cor={m.perfil === "admin" ? "#0B6FA8" : m.perfil === "gestor" ? "#7C3AED" : "#5F6368"}>{PERFIS_ORG[m.perfil]}</Etiqueta>
                {!m.user_id && <Etiqueta cor="#8A5A00">aguardando 1º acesso</Etiqueta>}
                {m.ativo === false && <Etiqueta cor="#B42318">inativo</Etiqueta>}
                {admin && <button onClick={() => setEdit({ ...m })} style={{ color: WORK.muted }}><Pencil size={14} /></button>}
              </div>
            ))}
          </div>
        </Cartao>
      )}

      {aba === "permissoes" && perm && (
        <Cartao titulo="O que cada perfil pode fazer" acoes={admin && <Botao tipo="primario" onClick={salvarPermissoes} carregando={salvando}><ShieldCheck size={14} /> Salvar e aplicar</Botao>}>
          <p className="text-xs mb-3" style={{ color: WORK.muted }}>O <b>Administrador</b> sempre tem acesso total. As regras são aplicadas também no servidor: sem permissão, os dados simplesmente não chegam à tela.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: WORK.text }}>
              <thead><tr className="text-xs" style={{ color: WORK.muted }}><th className="text-left p-2">Módulo</th><th className="p-2">Gestor</th><th className="p-2">Funcionário</th></tr></thead>
              <tbody>
                {MODULOS.map(([k, l, d]) => (
                  <tr key={k} className="border-t" style={{ borderColor: WORK.border }}>
                    <td className="p-2"><b>{l}</b><span className="block text-[11px]" style={{ color: WORK.muted }}>{d}</span></td>
                    {["gestor", "funcionario"].map((pf) => (
                      <td key={pf} className="p-2 text-center">
                        {admin ? (
                          <select value={perm[pf]?.[k] || "nenhum"} onChange={(e) => setPerm((x) => ({ ...x, [pf]: { ...x[pf], [k]: e.target.value } }))}
                            className="px-2 py-1 rounded border text-xs" style={{ borderColor: WORK.border }}>
                            <option value="nenhum">Sem acesso</option><option value="ver">Ver</option>{!SO_VER.includes(k) && <option value="editar">Ver e editar</option>}
                          </select>
                        ) : <Etiqueta cor={NIVEL[perm[pf]?.[k] || "nenhum"][1]}>{NIVEL[perm[pf]?.[k] || "nenhum"][0]}</Etiqueta>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Cartao>
      )}

      {edit && (
        <Modal aberto onFechar={() => setEdit(null)} titulo={edit.id ? "Editar membro" : "Convidar para a organização"} largura="max-w-lg"
          rodape={<><Botao onClick={() => setEdit(null)}>Cancelar</Botao><Botao tipo="primario" onClick={salvarMembro} carregando={salvando}><Users size={14} /> {edit.id ? "Salvar" : "Convidar"}</Botao></>}>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="E-mail *" valor={edit.email} onChange={(v) => setEdit((x) => ({ ...x, email: v }))} className="col-span-2" />
            <Campo label="Nome" valor={edit.nome} onChange={(v) => setEdit((x) => ({ ...x, nome: v }))} className="col-span-2" />
            <Campo label="Perfil" tipo="select" opcoes={PERFIS_ORG} valor={edit.perfil} onChange={(v) => setEdit((x) => ({ ...x, perfil: v || "funcionario" }))} />
            {edit.id && <Campo tipo="checkbox" label="Ativo" valor={edit.ativo !== false} onChange={(v) => setEdit((x) => ({ ...x, ativo: v }))} />}
          </div>
          <p className="text-[11px] mt-3" style={{ color: WORK.muted }}>Desativar remove o acesso imediatamente; os dados continuam na organização.</p>
        </Modal>
      )}
    </div>
  );
}