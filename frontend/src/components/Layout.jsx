import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useAppState } from "@/lib/AppState";
import { base44 } from "@/api/base44Client";
import { CreditBadge, SemCreditosDialog } from "@/components/CreditosIA";
import { LOGO_SMARTSEG, LOGO_SIMBOLO } from "@/lib/marca";
import { obterOrganizacao, moduloDaRota, podeVer, PERFIS_ORG } from "@/lib/organizacao";

const URL_CONTRATACAO = "https://zela-work-care.base44.app/api/apps/6ab51b5efe53d6829e11b8bc/functions/assinar";
import { Building2, ChevronDown, Plus, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import SidebarNav, { MobileBottomNav } from "@/components/SidebarNav";
import RetomadaTracker from "@/components/RetomadaTracker";

const WORK = {
  bg: "#F6F9FB",
  surface: "#FFFFFF",
  border: "#E3E8EE",
  accent: "#0B6FA8",
  text: "#1F2328",
  muted: "#5F6368",
  menu: "#EAF4F8",
};

function CompanySwitcher() {
  const { activeCompanyId, setActiveCompanyId } = useAppState();
  const [companies, setCompanies] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Company.list("-created_date", 50)
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, []);

  const active = companies.find((c) => c.id === activeCompanyId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-left"
        style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.text }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={16} style={{ color: WORK.accent }} />
          <span className="text-sm font-medium truncate">
            {active ? active.razao_social : "Selecionar empresa"}
          </span>
        </div>
        <ChevronDown size={16} style={{ color: WORK.muted }} />
      </button>
      {open && (
        <div
          className="absolute z-30 mt-1 w-full rounded-lg border shadow-xl overflow-hidden"
          style={{ background: WORK.surface, borderColor: WORK.border }}
        >
          <div className="max-h-64 overflow-y-auto">
            {companies.length === 0 && (
              <div className="px-3 py-3 text-sm" style={{ color: WORK.muted }}>
                Nenhuma empresa cadastrada.
              </div>
          )}
            {[...companies]
              .sort((a, b) => (b.e_matriz ? 1 : 0) - (a.e_matriz ? 1 : 0))
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCompanyId(c.id);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-sky-50 flex items-center gap-2"
                  style={{ color: WORK.text, background: c.id === activeCompanyId ? "rgba(11,111,168,0.08)" : "transparent" }}
                >
                  <span className="truncate">
                    {c.razao_social}
                    {c.e_matriz && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(11,111,168,0.15)", color: WORK.accent }}>Matriz</span>}
                  </span>
                  <span className="ml-auto text-xs" style={{ color: WORK.muted }}>
                    {c.uf}
                  </span>
                </button>
            ))}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              navigate("/empresas");
            }}
            className="w-full text-left px-3 py-2.5 text-sm border-t flex items-center gap-2 hover:bg-sky-50"
            style={{ borderColor: WORK.border, color: WORK.accent }}
          >
            <Plus size={14} /> Gerenciar empresas
          </button>
        </div>
    )}
    </div>
);
}

export default function Layout() {
  const [org, setOrg] = useState(null);
  const [orgErro, setOrgErro] = useState("");
  useEffect(() => {
    obterOrganizacao().then((c) => {
      // na 1ª vez (organização criada, convite aceito ou permissões alteradas) recarrega para aplicar o novo acesso
      if (c?.recarregar && !sessionStorage.getItem("zela_org_recarregado")) { sessionStorage.setItem("zela_org_recarregado", "1"); window.location.reload(); return; }
      sessionStorage.removeItem("zela_org_recarregado");
      setOrg(c);
    }).catch((e) => setOrgErro(e?.message || "Falha ao carregar a organização."));
  }, []);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { activeCompanyId, setActiveCompanyId } = useAppState();
  const [menuEscondido, setMenuEscondido] = useState(() => localStorage.getItem("zela_menu_escondido") === "1");
  const toggleMenu = () => setMenuEscondido((v) => { const n = !v; localStorage.setItem("zela_menu_escondido", n ? "1" : "0"); return n; });


  return (
    <div className="min-h-screen flex" style={{ background: "#FFFFFF", color: WORK.text }}>
      <SemCreditosDialog />
      <RetomadaTracker />
      {menuEscondido && (
        <button
          onClick={toggleMenu}
          title="Mostrar menu"
          className="hidden md:flex fixed top-3 left-3 z-30 items-center justify-center w-10 h-10 rounded-lg border shadow-md"
          style={{ background: WORK.surface, borderColor: WORK.border, color: WORK.accent }}
        >
          <PanelLeftOpen size={20} />
        </button>
    )}
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col w-64 shrink-0 border-r p-4 gap-4 ${menuEscondido ? "md:hidden" : ""}`}
        style={{ background: WORK.menu, borderColor: WORK.border }}
      >
        <div className="flex items-start justify-between">
          <Link to="/" className="flex flex-col items-center gap-1 pt-1 flex-1">
            <img src={LOGO_SMARTSEG} alt="SmartSeg — Saúde e Segurança do Trabalho" className="w-32 h-auto" />
            <span className="text-[11px] font-medium tracking-wide" style={{ color: WORK.muted }}>Gestão de Saúde e Segurança do Trabalho</span>
          </Link>
          <button onClick={toggleMenu} title="Esconder menu" className="mt-1 p-1 rounded-md hover:bg-sky-100" style={{ color: WORK.muted }}>
            <PanelLeftClose size={18} />
          </button>
        </div>

        <CompanySwitcher />

        <SidebarNav org={org} user={user} />

        <div className="mt-auto flex flex-col gap-3">
          <CreditBadge />
          <div
            className="flex items-center gap-2 px-2 py-2 rounded-lg border text-xs"
            style={{ borderColor: WORK.border, color: WORK.text, background: "#FFFFFF" }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: WORK.accent }}>
              {(user?.full_name || user?.email || "?").charAt(0).toUpperCase()}
            </div>
            <span className="truncate flex-1">{user?.full_name || user?.email}</span>
            <button onClick={() => logout()} className="hover:text-red-600" title="Sair">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="md:hidden sticky top-0 z-20 border-b px-4 py-3"
          style={{ background: "#FFFFFF", borderColor: WORK.border }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={LOGO_SIMBOLO} alt="SmartSeg" className="w-8 h-8" />
              <div className="leading-tight">
                <span className="block font-bold text-sm" style={{ color: WORK.accent }}>SmartSeg</span>
                <span className="block text-[10px]" style={{ color: WORK.muted }}>Copiloto de SST</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditBadge compact />
              <button
                onClick={() => logout()}
                style={{ color: WORK.muted }}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
          <div className="mt-3">
            <CompanySwitcher />
          </div>
        </header>

        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          {!activeCompanyId && (
            <div className="mx-3 mt-3 md:mx-6 md:mt-4 rounded-lg border p-3 flex flex-wrap items-center gap-2"
              style={{ background: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E" }}>
              <Building2 size={16} />
              <span className="text-sm font-medium">Selecione uma empresa no seletor do menu para começar a operar.</span>
            </div>
        )}
          {orgErro && <div className="mx-3 mt-3 md:mx-6 rounded-lg border p-3 text-sm" style={{ borderColor: "#F5C2C0", background: "#FDE8E8", color: "#B42318" }}>{orgErro} Atualize a página; se continuar, fale com o administrador.</div>}
          {(() => {
            const st = org?.assinatura?.status;
            const link = org?.assinatura?.link_pagamento || URL_CONTRATACAO;
            const aviso = (cor, fundo, texto, acao) => (
              <div className="mx-3 mt-3 md:mx-6 rounded-lg border p-3 text-sm flex flex-wrap items-center gap-2" style={{ borderColor: cor, background: fundo, color: cor }}>
                <span className="flex-1">{texto}</span>
                {org?.titular && acao && <a href={link} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: cor }}>{acao}</a>}
              </div>
          );
            if (st === "inadimplente") return aviso("#8A5A00", "#FFF6DB", `Pagamento em atraso${org.assinatura.inadimplente_desde ? " desde " + org.assinatura.inadimplente_desde.split("-").reverse().join("/") : ""}. Após 15 dias de atraso o sistema passa a somente leitura.`, "Regularizar pagamento");
            if (st === "suspensa") return aviso("#B42318", "#FDE8E8", "Assinatura suspensa por pendência de pagamento: o sistema está em modo somente leitura e a IA está pausada.", "Regularizar pagamento");
            if (st === "cancelada") return aviso("#B42318", "#FDE8E8", "Assinatura cancelada: os dados ficam disponíveis apenas para consulta e exportação por 90 dias.", "Contratar novamente");
            return null;
          })()}
          {org && ["sem_assinatura", "pendente_pagamento"].includes(org.assinatura?.status) && user?.role !== "admin" ? (
            <div className="p-8 max-w-xl mx-auto text-center">
              <h2 className="text-xl font-bold mb-2" style={{ color: WORK.text }}>{org.assinatura.status === "pendente_pagamento" ? "Falta só o pagamento" : "Conclua a contratação do SmartSeg"}</h2>
              {org.titular ? (
                <>
                  <p className="text-sm mb-4" style={{ color: WORK.muted }}>{org.assinatura.status === "pendente_pagamento" ? "Assim que o gateway confirmar o pagamento, o acesso é liberado automaticamente (cartão: na hora; Pix: em minutos; boleto: até 3 dias úteis)." : "Sua conta foi criada, mas ainda não há uma assinatura ativa. Escolha o número de vidas e conclua o pagamento."}</p>
                  <a href={org.assinatura.link_pagamento || URL_CONTRATACAO} target="_blank" rel="noreferrer" className="inline-block px-5 py-3 rounded-lg text-white font-semibold" style={{ background: WORK.accent }}>{org.assinatura.status === "pendente_pagamento" && org.assinatura.link_pagamento ? "Ir para o pagamento" : "Ver planos e contratar"}</a>
                  <p className="text-xs mt-4" style={{ color: WORK.muted }}>Já pagou? Atualize esta página em alguns minutos.</p>
                </>
            ) : <p className="text-sm" style={{ color: WORK.muted }}>A assinatura da sua organização ainda não está ativa. Fale com o administrador da sua conta.</p>}
            </div>
        ) : org && !podeVer(org, moduloDaRota(location.pathname)) ? (
            <div className="p-8 max-w-xl mx-auto text-center">
              <h2 className="text-lg font-bold mb-2" style={{ color: WORK.text }}>Sem acesso a este módulo</h2>
              <p className="text-sm" style={{ color: WORK.muted }}>Seu perfil ({PERFIS_ORG[org.membro?.perfil] || "—"}) na organização {org.org?.nome} não tem permissão para esta área. Peça ao administrador para liberar em Perfil de acesso.</p>
            </div>
        ) : <Outlet />}
        </main>
      </div>

      {/* Mobile bottom bar */}
      <MobileBottomNav org={org} />
    </div>
);
}