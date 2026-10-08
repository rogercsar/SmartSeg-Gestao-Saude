import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppState } from "@/lib/AppState";
import { rotuloDe } from "@/lib/rotasRotulo";

// Rotas que não devem ser lembradas como "último acesso".
const IGNORAR = ["/login", "/register", "/forgot-password", "/reset-password", "/assinar"];

/**
 * Persiste a última tela acessada (rota + empresa ativa) no localStorage,
 * para o painel inicial oferecer o atalho "Continuar de onde parou".
 * Renderiza null.
 */
export default function RetomadaTracker() {
  const { pathname } = useLocation();
  const { activeCompanyId } = useAppState();

  useEffect(() => {
    if (IGNORAR.some((p) => pathname.startsWith(p))) return;
    const rotulo = rotuloDe(pathname);
    try {
      localStorage.setItem(
        "smartseg:lastNav",
        JSON.stringify({ path: pathname, rotulo, companyId: activeCompanyId || null, ts: Date.now() })
      );
    } catch {
      /* localStorage indisponível — ignora */
    }
  }, [pathname, activeCompanyId]);

  return null;
}