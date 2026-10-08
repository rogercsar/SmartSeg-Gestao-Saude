import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { WORK, resolverAnexos } from "@/lib/suporte";
import { UploadCloud, X, Loader2 } from "lucide-react";

export default function AnexoUpload({ value = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [thumbs, setThumbs] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    let alive = true;
    resolverAnexos(value).then((urls) => { if (alive) setThumbs(urls); });
    return () => { alive = false; };
  }, [value]);

  const handleFiles = async (files) => {
    const arr = Array.from(files || []).filter((f) =>
      /image\/(png|jpe?g|webp)/.test(f.type) || /\.(png|jpe?g|webp)$/i.test(f.name)
    );
    if (!arr.length) return;
    setUploading(true);
    try {
      const uris = [];
      for (const f of arr) {
        const res = await base44.integrations.Core.UploadPrivateFile({ file: f });
        if (res?.file_uri) uris.push(res.file_uri);
      }
      onChange([...(value || []), ...uris]);
    } catch (e) { alert("Falha no upload: " + e.message); }
    setUploading(false);
  };

  const onDrop = (e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); };
  const remove = (i) => onChange((value || []).filter((_, j) => j !== i));

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border-2 border-dashed p-5 text-center cursor-pointer"
        style={{ borderColor: drag ? WORK.accent : WORK.border, background: WORK.bg }}
      >
        {uploading
          ? <Loader2 className="animate-spin mx-auto mb-2" size={22} style={{ color: WORK.accent }} />
          : <UploadCloud className="mx-auto mb-2" size={22} style={{ color: WORK.accent }} />}
        <p className="text-sm" style={{ color: WORK.text }}>{uploading ? "Enviando anexos…" : "Arraste prints aqui ou clique para selecionar"}</p>
        <p className="text-xs mt-1" style={{ color: WORK.muted }}>PNG, JPG ou WebP — armazenados de forma privada</p>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
      </div>
      {value?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {value.map((uri, i) => (
            <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border" style={{ borderColor: WORK.border, background: WORK.bg }}>
              {thumbs[i]
                ? <img src={thumbs[i]} alt="anexo" className="w-full h-full object-cover" />
                : <Loader2 className="animate-spin m-auto mt-8" size={14} style={{ color: WORK.muted }} />}
              <button type="button" onClick={() => remove(i)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}