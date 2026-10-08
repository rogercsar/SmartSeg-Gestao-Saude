import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

export const URL_VERIFICACAO = "https://zela-work-care.base44.app/api/apps/6ab51b5efe53d6829e11b8bc/functions/autenticidade";
export const linkVerificacao = (codigo) => `${URL_VERIFICACAO}?c=${codigo}`;

// Selo impresso: QR Code + código para conferência pública da autenticidade e da integridade do documento
export default function QrAutenticidade({ codigo, tamanho = 84 }) {
  const [img, setImg] = useState("");
  useEffect(() => { if (codigo) QRCode.toDataURL(linkVerificacao(codigo), { margin: 1, width: tamanho * 2 }).then(setImg).catch(() => {}); }, [codigo, tamanho]);
  if (!codigo) return null;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid #bbb", borderRadius: 6, padding: 6, marginTop: 10, fontSize: "8pt", pageBreakInside: "avoid" }}>
      {img && <img src={img} alt="QR Code de autenticidade" style={{ width: tamanho, height: tamanho }} />}
      <div>
        <b>Documento com autenticidade verificável</b><br />
        Aponte a câmera para o QR Code ou acesse o endereço abaixo e informe o código <b>{codigo}</b>.<br />
        <span style={{ wordBreak: "break-all", color: "#555" }}>{URL_VERIFICACAO}</span>
      </div>
    </div>
  );
}
