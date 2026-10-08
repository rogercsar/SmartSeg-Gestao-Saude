import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Eye, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import { WORK, DOCUMENTOS } from "@/lib/sst";
import { TIPOS_MEDICAO } from "@/lib/calculos";
import { uploadPrivado, linkTemporario } from "@/lib/privateFiles";
import { Botao, Campo, Modal, Cartao, Etiqueta, Vazio } from "@/components/programas/ui";
import { descEquip } from "@/components/programas/Medicoes";

export const CATEGORIAS_ANEXO = {
  fispq: "FISPQ / FDS",
  certificado_calibracao: "Certificado de calibração",
  laudo_laboratorio: "Laudo de laboratório",
  ca_epi: "CA de EPI",
  certificado_treinamento: "Certificado de treinamento",
  art_rrt: "ART / RRT",
  documento_assinado: "Documento assinado",
  foto: "Foto",
  outro: "Outro",
};
const VINCULOS = { empresa: "Empresa (geral)", setor: "Setor", risco: "Risco", medicao: "Medição", equipamento: "Equipamento", programa: "Documento (PGR, PCMSO…)" };
const MAX_MB = 20;

export function opcoesVinculo(tipo, dados) {
  if (tipo === "setor") return Object.fromEntries(dados.setores.map((s) => [s.id, s.nome]));
  if (tipo === "risco") return Object.fromEntries(dados.riscos.map((r) => [r.id, r.agente]));
  if (tipo === "medicao") return Object.fromEntries(dados.medicoes.map((m) => [m.id, `${TIPOS_MEDICAO[m.tipo]?.label} — ${m.data || ""}`]));
  if (tipo === "equipamento") return Object.fromEntries(dados.equipamentos.map((e) => [e.id, descEquip(e)]));
  if (tipo === "programa") return Object.fromEntries(dados.programas.map((p) => [p.id, DOCUMENTOS[p.tipo]?.label || p.tipo]));
  return {};
}

export default function Anexos({ dados, recarregar }) {
  const [novo, setNovo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [filtro, setFiltro] = useState("");

  const enviar = async () => {
    if (!novo.arquivos?.length) return alert("Escolha o(s) arquivo(s).");
    if (novo.vinculo_tipo !== "empresa" && !novo.vinculo_id) return alert("Escolha a que o anexo se refere.");
    const grandes = novo.arquivos.filter((f) => f.size > MAX_MB * 1024 * 1024);
    if (grandes.length) return alert(`Arquivo acima de ${MAX_MB} MB: ${grandes.map((f) => f.name).join(", ")}`);
    setEnviando(true);
    try {
      for (const f of novo.arquivos) {
        const { file_uri } = await uploadPrivado(f);
        await base44.entities.Anexo.create({
          company_id: dados.empresa.id, vinculo_tipo: novo.vinculo_tipo, vinculo_id: novo.vinculo_tipo === "empresa" ? dados.empresa.id : novo.vinculo_id,
          categoria: novo.categoria, nome: novo.arquivos.length === 1 && novo.nome ? novo.nome : f.name, descricao: novo.descricao || "",
          file_uri, mime: f.type, tamanho: f.size, incluir_no_documento: novo.incluir !== false,
        });
      }
      setNovo(null);
      recarregar();
    } catch (e) {
      alert("Erro no envio: " + (e?.message || ""));
    } finally {
      setEnviando(false);
    }
  };

  const abrir = async (a) => { try { window.open(await linkTemporario(a.file_uri, 600), "_blank"); } catch { alert("Não foi possível abrir o arquivo."); } };
  const nomeVinculo = (a) => a.vinculo_tipo === "empresa" ? "Empresa" : `${VINCULOS[a.vinculo_tipo]}: ${opcoesVinculo(a.vinculo_tipo, dados)[a.vinculo_id] || "(removido)"}`;
  const lista = dados.anexos.filter((a) => !filtro || a.categoria === filtro);

  return (
    <div className="space-y-4">
      <Cartao titulo={`Anexos (${dados.anexos.length})`}
        acoes={<Botao tipo="primario" onClick={() => setNovo({ categoria: "fispq", vinculo_tipo: "empresa", incluir: true })}><Upload size={14} /> Enviar arquivos</Botao>}>
        <p className="text-xs mb-3" style={{ color: WORK.muted }}>
          FISPQ, certificados de calibração, laudos de laboratório, CAs, certificados de treinamento, ART e outros, em PDF ou imagem (até {MAX_MB} MB).
          Os arquivos ficam privados e os marcados aparecem na lista de anexos dos documentos.
        </p>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="mb-3 px-2 py-1.5 rounded-lg border text-xs" style={{ background: WORK.bg, borderColor: WORK.border, color: WORK.text }}>
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORIAS_ANEXO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {lista.length === 0 && <Vazio>Nenhum anexo.</Vazio>}
        <div className="space-y-2">
          {lista.map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded-lg p-3" style={{ background: WORK.bg }}>
              {(a.mime || "").startsWith("image/") ? <ImageIcon size={18} style={{ color: WORK.muted }} /> : <FileText size={18} style={{ color: WORK.muted }} />}
              <div className="flex-1 min-w-0 text-sm" style={{ color: WORK.text }}>
                <div className="flex flex-wrap items-center gap-2"><b className="truncate">{a.nome}</b><Etiqueta cor={WORK.accent}>{CATEGORIAS_ANEXO[a.categoria] || a.categoria}</Etiqueta></div>
                <p className="text-xs" style={{ color: WORK.muted }}>{nomeVinculo(a)}{a.descricao ? ` · ${a.descricao}` : ""}{a.tamanho ? ` · ${(a.tamanho / 1048576).toFixed(1)} MB` : ""}</p>
              </div>
              <label className="text-[11px] flex items-center gap-1" style={{ color: WORK.muted }} title="Listar nos anexos dos documentos">
                <input type="checkbox" checked={a.incluir_no_documento !== false} onChange={async (e) => { await base44.entities.Anexo.update(a.id, { incluir_no_documento: e.target.checked }); recarregar(); }} /> no doc
              </label>
              <button onClick={() => abrir(a)} style={{ color: WORK.accent }}><Eye size={16} /></button>
              <button onClick={async () => { if (confirm("Excluir anexo?")) { await base44.entities.Anexo.delete(a.id); recarregar(); } }} style={{ color: WORK.muted }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </Cartao>

      <Modal aberto={!!novo} onFechar={() => setNovo(null)} titulo="Enviar anexos" largura="max-w-lg"
        rodape={<><Botao onClick={() => setNovo(null)}>Cancelar</Botao><Botao tipo="primario" onClick={enviar} carregando={enviando}>Enviar</Botao></>}>
        {novo && (
          <div className="space-y-3">
            <input type="file" multiple accept="application/pdf,image/*" onChange={(e) => setNovo((n) => ({ ...n, arquivos: [...e.target.files] }))} className="text-sm" style={{ color: WORK.text }} />
            <Campo label="Categoria" tipo="select" opcoes={CATEGORIAS_ANEXO} valor={novo.categoria} onChange={(v) => setNovo((n) => ({ ...n, categoria: v }))} />
            <Campo label="Refere-se a" tipo="select" opcoes={VINCULOS} valor={novo.vinculo_tipo} onChange={(v) => setNovo((n) => ({ ...n, vinculo_tipo: v || "empresa", vinculo_id: "" }))} />
            {novo.vinculo_tipo !== "empresa" && (
              <Campo label="Qual" tipo="select" opcoes={opcoesVinculo(novo.vinculo_tipo, dados)} valor={novo.vinculo_id} onChange={(v) => setNovo((n) => ({ ...n, vinculo_id: v }))} />
            )}
            {novo.arquivos?.length === 1 && <Campo label="Nome (opcional)" valor={novo.nome} onChange={(v) => setNovo((n) => ({ ...n, nome: v }))} />}
            <Campo label="Descrição (opcional)" valor={novo.descricao} onChange={(v) => setNovo((n) => ({ ...n, descricao: v }))} />
            <Campo tipo="checkbox" label="Listar nos anexos dos documentos" valor={novo.incluir !== false} onChange={(v) => setNovo((n) => ({ ...n, incluir: v }))} />
          </div>
        )}
      </Modal>
    </div>
  );
}
