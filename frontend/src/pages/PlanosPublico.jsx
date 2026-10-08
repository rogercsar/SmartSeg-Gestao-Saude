import { useEffect } from "react";

// A contratação acontece na página pública servida pela função "assinar" (fluxo único).
const URL_CONTRATACAO = "https://zela-work-care.base44.app/api/apps/6ab51b5efe53d6829e11b8bc/functions/assinar";

export default function PlanosPublico() {
  useEffect(() => { window.location.replace(URL_CONTRATACAO); }, []);
  return <div style={{ padding: 40, fontFamily: "system-ui" }}>Abrindo a página de contratação… <a href={URL_CONTRATACAO}>clique aqui</a> se não abrir.</div>;
}
