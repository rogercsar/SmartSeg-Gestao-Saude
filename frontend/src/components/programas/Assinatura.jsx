import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PenLine, Upload, ShieldCheck, Eye, Eraser } from "lucide-react";
import { WORK } from "@/lib/sst";
import { uploadPrivado, linkTemporario } from "@/lib/privateFiles";
import { pendenciasPgr } from "@/lib/pgrConformidade";
import { Botao, Campo } from "@/components/programas/ui";

const MODOS = {
  manual: "Manual (assinar à caneta no documento impresso)",
  imagem: "Assinatura desenhada ou imagem",
  certificado: "Certificado digital (ICP-Brasil ou gov.br)",
};

export function PadAssinatura({ onPronto }) {
  const ref = useRef(null);
  const desenhando = useRef(false);
  const [vazio, setVazio] = useState(true);

  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext("2d");
    ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.strokeStyle = "#0B1F4B";
    const pos = (e) => { const r = c.getBoundingClientRect(); const t = e.touches?.[0] || e; return [(t.clientX - r.left) * (c.width / r.width), (t.clientY - r.top) * (c.height / r.height)]; };
    const ini = (e) => { e.preventDefault(); desenhando.current = true; ctx.beginPath(); ctx.moveTo(...pos(e)); };
    const mov = (e) => { if (!desenhando.current) return; e.preventDefault(); ctx.lineTo(...pos(e)); ctx.stroke(); setVazio(false); };
    const fim = () => { desenhando.current = false; };
    c.addEventListener("pointerdown", ini); c.addEventListener("pointermove", mov); window.addEventListener("pointerup", fim);
    c.addEventListener("touchstart", ini, { passive: false }); c.addEventListener("touchmove", mov, { passive: false }); c.addEventListener("touchend", fim);
    return () => {
      c.removeEventListener("pointerdown", ini); c.removeEventListener("pointermove", mov); window.removeEventListener("pointerup", fim);
      c.removeEventListener("touchstart", ini); c.removeEventListener("touchmove", mov); c.removeEventListener("touchend", fim);
    };
  }, []);

  const limpar = () => { const c = ref.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); setVazio(true); };
  const usar = () => ref.current.toBlob((b) => onPronto(new File([b], "assinatura.png", { type: "image/png" })), "image/png");

  return (
    <div>
      <canvas ref={ref} width={600} height={180} className="w-full max-w-md rounded-lg touch-none" style={{ background: "#fff", cursor: "crosshair" }} />
      <div className="flex gap-2 mt-2">
        <Botao onClick={limpar}><Eraser size={14} /> Limpar</Botao>
        <Botao tipo="primario" onClick={usar} disabled={vazio}>Usar esta assinatura</Botao>
      </div>
    </div>
  );
}

// Assinatura de um documento (ProgramaSST). onSalvar(campos) grava no documento.
export default function Assinatura({ doc, dados, onSalvar }) {
  const a = doc.assinatura || { modo: "manual" };
  const assinado = doc.documento_assinado;
  const [enviando, setEnviando] = useState(false);
  const [preview, setPreview] = useState(null);
  const [desenhar, setDesenhar] = useState(false);

  useEffect(() => {
    if (a.modo === "imagem" && a.file_uri) linkTemporario(a.file_uri, 900).then(setPreview).catch(() => setPreview(null));
    else setPreview(null);
  }, [a.file_uri, a.modo]);

  const salvarImagem = async (file) => {
    setEnviando(true);
    try {
      const { file_uri } = await uploadPrivado(file);
      await onSalvar({ assinatura: { ...a, modo: "imagem", file_uri, nome: doc.responsavel?.nome || "", data: new Date().toISOString() } });
      setDesenhar(false);
    } catch (e) { alert("Erro: " + (e?.message || "")); } finally { setEnviando(false); }
  };

  const enviarAssinado = async (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") return alert("Envie o PDF assinado digitalmente.");
    if (doc.tipo === "pgr" && pendenciasPgr(dados, doc).length) {
      alert("Complete as pendências NR-01 do PGR e salve o documento antes de anexar a versão assinada.");
      ev.target.value = "";
      return;
    }
    setEnviando(true);
    try {
      const { file_uri } = await uploadPrivado(f);
      const info = { file_uri, nome: f.name, data: new Date().toISOString(), assinante: doc.responsavel?.nome || "" };
      await base44.entities.Anexo.create({
        company_id: dados.empresa.id, vinculo_tipo: "programa", vinculo_id: doc.id, categoria: "documento_assinado",
        nome: f.name, descricao: "Versão assinada digitalmente", file_uri, mime: f.type, tamanho: f.size, incluir_no_documento: false,
      });
      await onSalvar({ documento_assinado: info, status: "emitido" });
    } catch (e) { alert("Erro: " + (e?.message || "")); } finally { setEnviando(false); ev.target.value = ""; }
  };

  if (!doc.id) return <p className="text-xs" style={{ color: WORK.muted }}>Salve o documento para configurar a assinatura.</p>;

  return (
    <div className="border-t pt-3 mt-3 space-y-3" style={{ borderColor: WORK.border }}>
      <Campo label="Assinatura" tipo="select" opcoes={MODOS} valor={a.modo} onChange={(v) => onSalvar({ assinatura: { ...a, modo: v || "manual" } })} />

      {a.modo === "imagem" && (
        <div className="space-y-2">
          {preview && <img src={preview} alt="Assinatura" className="h-16 rounded bg-white p-1" />}
          <div className="flex flex-wrap gap-2">
            <Botao onClick={() => setDesenhar(!desenhar)}><PenLine size={14} /> {preview ? "Refazer desenhando" : "Desenhar assinatura"}</Botao>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm cursor-pointer" style={{ borderColor: WORK.border, color: WORK.text }}>
              <Upload size={14} /> {enviando ? "Enviando…" : "Enviar imagem (PNG/JPG)"}
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && salvarImagem(e.target.files[0])} />
            </label>
          </div>
          {desenhar && <PadAssinatura onPronto={salvarImagem} />}
          <p className="text-[11px]" style={{ color: WORK.muted }}>A imagem aparece sobre a linha de assinatura do PDF. É uma assinatura eletrônica simples — para validade jurídica plena, use certificado digital.</p>
        </div>
      )}

      {a.modo === "certificado" && (
        <div className="space-y-2 text-sm" style={{ color: WORK.text }}>
          <ol className="list-decimal pl-5 space-y-1 text-xs" style={{ color: WORK.muted }}>
            <li>Gere o PDF em "Visualizar / PDF" → "Salvar em PDF" (com status Emitido).</li>
            <li>Assine o PDF com seu certificado ICP-Brasil (A1/A3) no seu assinador (Adobe, assinador do seu certificado) ou gratuitamente pelo gov.br (assinador.iti.br).</li>
            <li>Envie aqui o PDF assinado — ele passa a ser a versão oficial do documento.</li>
            <li>A validade da assinatura pode ser conferida em validar.iti.gov.br.</li>
          </ol>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm cursor-pointer" style={{ borderColor: WORK.accent, color: WORK.accent }}>
              <Upload size={14} /> {enviando ? "Enviando…" : assinado ? "Substituir PDF assinado" : "Enviar PDF assinado"}
              <input type="file" accept="application/pdf" hidden onChange={enviarAssinado} />
            </label>
            {assinado && (
              <>
                <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#22C55E" }}><ShieldCheck size={14} /> {assinado.nome} · {new Date(assinado.data).toLocaleDateString("pt-BR")}</span>
                <Botao onClick={async () => window.open(await linkTemporario(assinado.file_uri, 600), "_blank")}><Eye size={14} /> Abrir</Botao>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}