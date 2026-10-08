import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("zela:mode") || "work");
  const [activeCompanyId, setActiveCompanyId] = useState(
    () => localStorage.getItem("zela:activeCompany") || null
  );
  const [persona, setPersona] = useState(() => localStorage.getItem("zela:persona") || "acolhedor");

  useEffect(() => {
    localStorage.setItem("zela:mode", mode);
  }, [mode]);
  useEffect(() => {
    if (activeCompanyId) localStorage.setItem("zela:activeCompany", activeCompanyId);
    else localStorage.removeItem("zela:activeCompany");
  }, [activeCompanyId]);
  useEffect(() => {
    localStorage.setItem("zela:persona", persona);
  }, [persona]);

  // No primeiro login (ou se a empresa ativa sumir), seleciona automaticamente
  // a empresa matriz (gerenciadora) — ou a primeira empresa cadastrada.
  useEffect(() => {
    if (activeCompanyId) return;
    let cancelled = false;
    base44.entities.Company
      .list("-created_date", 200)
      .then((lista) => {
        if (cancelled || !lista?.length) return;
        const matriz = lista.find((c) => c.e_matriz) || lista[0];
        setActiveCompanyId(matriz.id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppStateContext.Provider
      value={{
        mode,
        setMode,
        activeCompanyId,
        setActiveCompanyId,
        persona,
        setPersona,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}