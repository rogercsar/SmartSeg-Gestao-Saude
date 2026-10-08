import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { WORK, TIPOS_RISCO, NIVEIS, avaliar, MOMENTOS_EXAME } from "@/lib/sst";
import { montarArvore } from "@/lib/estruturaCopia";
import { Botao } from "@/components/programas/ui";
import EditarNo, { TIPOS_NO } from "@/components/empresa/EditarNo";
import CopiarHierarquia from "@/components/empresa/CopiarHierarquia";
import {
  Building2, Layers, Briefcase, Users, ShieldAlert, Stethoscope,
  Pencil, Printer, Copy, ChevronDown, ChevronRight, FileText, RotateCw,
} from "lucide-react";

const TOGGLES = [
  { key: "unidades", label: "Unidades", icon: Building2 },
  { key: "setores", label: "Setores", icon: Layers },
  { key: "cargos", label: "Cargos", icon: Briefcase },
  { key: "funcionarios", label: "Funcionários", icon: Users },
  { key: "riscos", label: "Riscos", icon: ShieldAlert },
  { key: "exames", label: "Exames", icon: Stethoscope },
  { key: "caracterizacoes", label: "Caracterizações", icon: FileText },
];

function NoIcon({ tipo, aberto, onClick }) {
  const iconProps = { size: 15, style: { color: WORK.muted } };
  if (onClick) {
    return (
      <button onClick={onClick} style={{ color: WORK.muted }}>
        {aberto ? <ChevronDown {...iconProps} /> : <ChevronRight {...iconProps} />}
      </button>
    );
  }
  return <span style={{ width: 15 }} />;
}

function RiscoBadge({ risco }) {
  const t = TIPOS_RISCO[risco.tipo] || { label: risco.tipo, cor: "#64748B" };
  const av = avaliar(risco);
  const nivel = av ? NIVEIS[av.nivel] : null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full" style={{ background: t.cor + "1a", color: t.cor, border: `1px solid ${t.cor}40` }}>
      {t.label}
      {nivel && <span style={{ color: nivel.cor }}>· {nivel.label}</span>}
    </span>
  );
}

function NoArvore({ no, visiveis, opcoesCtx, onEdit, depth = 0 }) {
  const [aberto, setAberto] = useState(true);
  const [abertoCargo, setAbertoCargo] = useState(true);
  const paddingLeft = 12 + depth * 18;

  if (no.tipo === "unidade" || no.tipo === "sem_unidade") {
    const u = no.item;
    return (
      <div>
        <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft }}>
          {no.filhos?.length > 0 ? (
            <NoIcon tipo="unidade" aberto={aberto} onClick={() => setAberto(!aberto)} />
          ) : <NoIcon />}
          <Building2 size={15} style={{ color: WORK.accent }} />
          <span className="text-sm font-semibold" style={{ color: WORK.text }}>{u.nome}</span>
          {u.id && visiveis.unidades && (
            <button onClick={() => onEdit("unidade", u)} style={{ color: WORK.muted }} title="Editar"><Pencil size={13} /></button>
          )}
          {u.numero_inscricao && <span className="text-xs" style={{ color: WORK.muted }}>· {String(u.tipo_inscricao || "").toUpperCase()} {u.numero_inscricao}</span>}
          {u.municipio && <span className="text-xs" style={{ color: WORK.muted }}>· {u.municipio}/{u.uf}</span>}
        </div>
        {aberto && no.filhos?.map((s) => <NoArvore key={s.item.id || s.item.nome} no={s} visiveis={visiveis} opcoesCtx={opcoesCtx} onEdit={onEdit} depth={depth + 1} />)}
      </div>
    );
  }

  if (no.tipo === "setor") {
    const s = no.item;
    return (
      <div>
        <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft }}>
          {no.filhos?.length > 0 ? (
            <NoIcon aberto={aberto} onClick={() => setAberto(!aberto)} />
          ) : <NoIcon />}
          <Layers size={14} style={{ color: WORK.accent }} />
          <span className="text-sm font-medium" style={{ color: WORK.text }}>{s.nome}</span>
          <button onClick={() => onEdit("setor", s)} style={{ color: WORK.muted }} title="Editar"><Pencil size={12} /></button>
          {s.descricao_ambiente && <span className="text-xs truncate max-w-md" style={{ color: WORK.muted }}>· {s.descricao_ambiente}</span>}
        </div>
        {aberto && no.filhos?.map((c) => <NoArvore key={c.item.id} no={c} visiveis={visiveis} opcoesCtx={opcoesCtx} onEdit={onEdit} depth={depth + 1} />)}
      </div>
    );
  }

  // Cargo
  const c = no.item;
  return (
    <div>
      <div className="flex items-center gap-2 py-1" style={{ paddingLeft }}>
        <NoIcon aberto={abertoCargo} onClick={() => setAbertoCargo(!abertoCargo)} />
        <Briefcase size={14} style={{ color: WORK.accent }} />
        <span className="text-sm" style={{ color: WORK.text }}>{c.nome_cargo}</span>
        <button onClick={() => onEdit("cargo", c)} style={{ color: WORK.muted }} title="Editar"><Pencil size={12} /></button>
        {c.cbo && <span className="text-xs" style={{ color: WORK.muted }}>· CBO {c.cbo}</span>}
        {c.ghe && <span className="text-xs" style={{ color: WORK.muted }}>· {c.ghe}</span>}
        <span className="text-xs" style={{ color: WORK.muted }}>· {no.trabalhadores.length} func.</span>
      </div>
      {abertoCargo && (
        <div style={{ paddingLeft: paddingLeft + 18 }}>
          {/* Funcionários */}
          {visiveis.funcionarios && no.trabalhadores.length > 0 && (
            <div className="py-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Users size={12} style={{ color: WORK.muted }} />
                <span className="text-xs font-medium" style={{ color: WORK.muted }}>Funcionários ({no.trabalhadores.length})</span>
              </div>
              {no.trabalhadores.map((t) => (
                <div key={t.id} className="flex items-center gap-2 ml-4 py-0.5">
                  <span className="text-xs" style={{ color: WORK.text }}>{t.nome}</span>
                  <button onClick={() => onEdit("trabalhador", t)} style={{ color: WORK.muted }}><Pencil size={11} /></button>
                  {t.cpf && <span className="text-[11px]" style={{ color: WORK.muted }}>· CPF {t.cpf}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Riscos */}
          {visiveis.riscos && no.riscos.length > 0 && (
            <div className="py-1.5 mt-1 rounded-lg" style={{ background: WORK.bg }}>
              <div className="flex items-center gap-1.5 mb-1 px-2">
                <ShieldAlert size={12} style={{ color: WORK.muted }} />
                <span className="text-xs font-medium" style={{ color: WORK.muted }}>Riscos ({no.riscos.length})</span>
              </div>
              <div className="space-y-1.5 px-2">
                {no.riscos.map((r) => (
                  <div key={r.id} className="rounded-md border p-2" style={{ background: WORK.surface, borderColor: WORK.border }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <RiscoBadge risco={r} />
                      <span className="text-xs font-medium" style={{ color: WORK.text }}>{r.agente}</span>
                      <button onClick={() => onEdit("risco", r)} style={{ color: WORK.muted }}><Pencil size={11} /></button>
                      {r.fonte_geradora && <span className="text-[11px]" style={{ color: WORK.muted }}>· {r.fonte_geradora}</span>}
                    </div>
                    {r.possiveis_danos && <p className="text-[11px] mt-0.5" style={{ color: WORK.muted }}>Danos: {r.possiveis_danos}</p>}
                    {(r.medidas_existentes?.length > 0) && (
                      <p className="text-[11px] mt-0.5" style={{ color: WORK.muted }}>Controles: {r.medidas_existentes.join(", ")}</p>
                    )}
                    {visiveis.caracterizacoes && (r.insalubridade?.caracteriza || r.periculosidade?.caracteriza || r.aposentadoria_especial?.enquadra) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.insalubridade?.caracteriza && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(225,29,72,0.1)", color: "#E11D48" }}>Insalubridade: {r.insalubridade.grau || "—"} {r.insalubridade.anexo || ""}</span>}
                        {r.periculosidade?.caracteriza && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(234,88,12,0.1)", color: "#EA580C" }}>Periculosidade</span>}
                        {r.aposentadoria_especial?.enquadra && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>Aposentadoria especial</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exames */}
          {visiveis.exames && no.exames.length > 0 && (
            <div className="py-1 mt-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Stethoscope size={12} style={{ color: WORK.muted }} />
                <span className="text-xs font-medium" style={{ color: WORK.muted }}>Exames do PCMSO ({no.exames.length})</span>
              </div>
              {no.exames.map((e) => (
                <div key={e.id} className="flex items-center gap-2 ml-4 py-0.5">
                  <span className="text-xs" style={{ color: WORK.text }}>{e.exame}</span>
                  <button onClick={() => onEdit("exame", e)} style={{ color: WORK.muted }}><Pencil size={11} /></button>
                  <span className="text-[11px]" style={{ color: WORK.muted }}>· {e.periodicidade_meses}m · {(e.momentos || []).map((m) => MOMENTOS_EXAME[m] || m).join(", ")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Relatório para impressão
function RelatorioImpressao({ empresa, arvore, visiveis }) {
  const renderCargo = (c) => (
    <div key={c.item.id} style={{ marginBottom: 6 }}>
      <b>{c.item.nome_cargo}</b> {c.item.cbo ? `(CBO ${c.item.cbo})` : ""}
      {visiveis.funcionarios && c.trabalhadores.length > 0 && (
        <div style={{ marginLeft: 12 }}>
          <i>Funcionários:</i> {c.trabalhadores.map((t) => t.nome).join(", ")}
        </div>
      )}
      {visiveis.riscos && c.riscos.length > 0 && (
        <div style={{ marginLeft: 12 }}>
          <i>Riscos:</i>
          {c.riscos.map((r) => (
            <div key={r.id} style={{ marginLeft: 12 }}>
              • {TIPOS_RISCO[r.tipo]?.label || r.tipo} — {r.agente}
              {r.fonte_geradora ? ` (fonte: ${r.fonte_geradora})` : ""}
              {r.possiveis_danos ? ` — danos: ${r.possiveis_danos}` : ""}
              {visiveis.caracterizacoes && r.insalubridade?.caracteriza ? ` [Insalubridade: ${r.insalubridade.grau || ""}]` : ""}
              {visiveis.caracterizacoes && r.periculosidade?.caracteriza ? " [Periculosidade]" : ""}
              {visiveis.caracterizacoes && r.aposentadoria_especial?.enquadra ? " [Aposentadoria especial]" : ""}
            </div>
          ))}
        </div>
      )}
      {visiveis.exames && c.exames.length > 0 && (
        <div style={{ marginLeft: 12 }}>
          <i>Exames:</i> {c.exames.map((e) => `${e.exame} (${e.periodicidade_meses}m)`).join(", ")}
        </div>
      )}
    </div>
  );

  const renderSetor = (s) => (
    <div key={s.item.id || s.item.nome} style={{ marginBottom: 8 }}>
      <b>{s.item.nome}</b>
      {s.item.descricao_ambiente ? ` — ${s.item.descricao_ambiente}` : ""}
      <div style={{ marginLeft: 12 }}>{s.filhos?.map(renderCargo)}</div>
    </div>
  );

  const renderUnidade = (u) => (
    <div key={u.item.id || u.item.nome} style={{ marginBottom: 10, pageBreakInside: "avoid" }}>
      <h3 style={{ borderBottom: "1px solid #ccc" }}>{u.item.nome}</h3>
      <div style={{ marginLeft: 12 }}>{u.filhos?.map(renderSetor)}</div>
    </div>
  );

  return (
    <div style={{ padding: 24, fontFamily: "Inter, sans-serif", fontSize: 12, color: "#1F2328" }}>
      <h1 style={{ fontSize: 18, marginBottom: 4 }}>{empresa.razao_social}</h1>
      <p style={{ color: "#5F6368", marginBottom: 16 }}>
        Relatório de estrutura · CNPJ {empresa.cnpj || "—"} · CNAE {empresa.cnae || "—"} · Gerado em {new Date().toLocaleDateString("pt-BR")}
      </p>
      {arvore.map(renderUnidade)}
    </div>
  );
}

export default function AnaliseEstrutura({ companyId }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visiveis, setVisiveis] = useState({
    unidades: true, setores: true, cargos: true, funcionarios: true, riscos: true, exames: true, caracterizacoes: true,
  });
  const [editando, setEditando] = useState(null); // { tipo, item }
  const [copiar, setCopiar] = useState(false);
  const [imprimindo, setImprimindo] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const [empresa, unidades, setores, cargos, trabalhadores, riscos, exames] = await Promise.all([
        base44.entities.Company.get(companyId),
        base44.entities.Unidade.filter({ company_id: companyId }).catch(() => []),
        base44.entities.Setor.filter({ company_id: companyId }).catch(() => []),
        base44.entities.CargoFuncao.filter({ company_id: companyId }).catch(() => []),
        base44.entities.Trabalhador.filter({ company_id: companyId }).catch(() => []),
        base44.entities.Risco.filter({ company_id: companyId }).catch(() => []),
        base44.entities.ExamePcmso.filter({ company_id: companyId }).catch(() => []),
      ]);
      setDados({ empresa, unidades: unidades || [], setores: setores || [], cargos: cargos || [], trabalhadores: trabalhadores || [], riscos: riscos || [], exames: exames || [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (k) => setVisiveis((v) => ({ ...v, [k]: !v[k] }));

  const onEdit = (tipoKey, item) => setEditando({ tipo: TIPOS_NO[tipoKey], item });
  const onSaved = () => { setEditando(null); carregar(); };

  const opcoesCtx = {
    unidades: Object.fromEntries(dados?.unidades.map((u) => [u.id, u.nome]) || []),
    setores: Object.fromEntries(dados?.setores.map((s) => [s.id, s.nome]) || []),
    cargos: Object.fromEntries(dados?.cargos.map((c) => [c.id, c.nome_cargo]) || []),
  };

  const imprimir = () => {
    setImprimindo(true);
    setTimeout(() => { window.print(); }, 200);
    setTimeout(() => setImprimindo(false), 500);
  };

  if (loading) return <div className="p-8 text-center text-sm" style={{ color: WORK.muted }}>Carregando estrutura…</div>;
  if (!dados) return null;

  const arvore = montarArvore(dados);

  return (
    <div>
      {/* Barra de ações */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Botao onClick={carregar}><RotateCw size={14} /> Atualizar</Botao>
        <Botao onClick={imprimir}><Printer size={14} /> Imprimir / relatório</Botao>
        <Botao onClick={() => setCopiar(true)}><Copy size={14} /> Copiar hierarquia</Botao>
      </div>

      {/* Filtros de visualização */}
      <div className="flex flex-wrap gap-1.5 mb-4 p-2 rounded-lg border" style={{ background: WORK.surface, borderColor: WORK.border }}>
        <span className="text-xs self-center mr-1" style={{ color: WORK.muted }}>Exibir:</span>
        {TOGGLES.map((t) => {
          const Icone = t.icon;
          const ativo = visiveis[t.key];
          return (
            <button key={t.key} onClick={() => toggle(t.key)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border transition-colors"
              style={{
                background: ativo ? "rgba(11,111,168,0.08)" : "transparent",
                borderColor: ativo ? WORK.accent + "60" : WORK.border,
                color: ativo ? WORK.accent : WORK.muted,
                fontWeight: ativo ? 600 : 400,
              }}>
              <Icone size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Resumo */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs" style={{ color: WORK.muted }}>
        <span>{dados.unidades.length} unidades</span>
        <span>· {dados.setores.length} setores</span>
        <span>· {dados.cargos.length} cargos</span>
        <span>· {dados.trabalhadores.length} funcionários</span>
        <span>· {dados.riscos.length} riscos</span>
        <span>· {dados.exames.length} exames</span>
      </div>

      {/* Árvore hierárquica */}
      <div className="rounded-lg border p-3" style={{ background: WORK.surface, borderColor: WORK.border }}>
        {arvore.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: WORK.muted }}>Nenhuma unidade cadastrada. Adicione unidades, setores e cargos para visualizar a estrutura.</p>
        ) : (
          arvore.map((no) => <NoArvore key={no.item.id || no.item.nome} no={no} visiveis={visiveis} opcoesCtx={opcoesCtx} onEdit={onEdit} />)
        )}
      </div>

      {/* Editor */}
      {editando && <EditarNo tipo={editando.tipo} item={editando.item} opcoes={opcoesCtx} onClose={() => setEditando(null)} onSaved={onSaved} />}

      {/* Cópia */}
      <CopiarHierarquia aberto={copiar} onClose={() => setCopiar(false)} dados={dados} onConcluido={carregar} />

      {/* Impressão overlay */}
      {imprimindo && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto print-root">
          <RelatorioImpressao empresa={dados.empresa} arvore={arvore} visiveis={visiveis} />
        </div>
      )}
    </div>
  );
}