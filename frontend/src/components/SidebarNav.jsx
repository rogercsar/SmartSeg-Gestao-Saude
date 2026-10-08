import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { moduloDaRota, podeVer } from "@/lib/organizacao";
import {
  ChevronDown, Home as HomeIcon, CalendarClock, Building2, UserRound, FileUp, Users,
  ClipboardCheck, Brain, ClipboardList, Stethoscope, Hospital, HardHat, UsersRound,
  AlertTriangle, ShieldX, GraduationCap, Sparkles, FileText, Scale, BookOpen, FileCheck2,
  FileBarChart, Receipt, Wallet, LifeBuoy, Headset, Heart, Library, FolderCheck, TrendingUp, CreditCard } from "lucide-react";

const WORK = { accent: "#0B6FA8", text: "#1F2328", muted: "#5F6368", border: "#E3E8EE", surface: "#FFFFFF" };

const TOP = [
  { to: "/", label: "Início", icon: HomeIcon },
  { to: "/assistente-ia", label: "Assistente IA", icon: Sparkles },
  { to: "/vencimentos", label: "Pendências e vencimentos", icon: CalendarClock },
];

const GROUPS = [
  { key: "clientes", label: "Clientes", items: [
    { to: "/empresas", label: "Empresas", icon: Building2 },
    { to: "/funcionarios", label: "Colaboradores", icon: UserRound },
    { to: "/terceiros", label: "Terceiros", icon: Users },
    { to: "/importacao", label: "Importar planilha", icon: FileUp },
  ]},
  { key: "documentos", label: "Documentos técnicos", items: [
    { to: "/programas", label: "PGR, PCMSO e laudos", icon: ClipboardCheck },
    { to: "/psicossocial", label: "Riscos psicossociais", icon: Brain },
    { to: "/documentos", label: "Documentos operacionais", icon: FileText },
    { to: "/catalogos-sst", label: "Catálogos técnicos", icon: Library },
    { to: "/autos", label: "Autos de infração", icon: Scale },
  ]},
  { key: "saude", label: "Saúde ocupacional", items: [
    { to: "/clinica", label: "Clínica: agenda e ASO", icon: Hospital },
    { to: "/atestados", label: "Atestados e FAP", icon: Stethoscope },
    { to: "/espaco-zela", label: "Canal de escuta", icon: Heart },
  ]},
  { key: "seguranca", label: "Segurança do trabalho", items: [
    { to: "/epi", label: "EPI", icon: HardHat },
    { to: "/treinamentos", label: "Treinamentos", icon: GraduationCap },
    { to: "/inspecoes", label: "Inspeções e planos de ação", icon: ClipboardList },
    { to: "/cipa", label: "CIPA", icon: UsersRound },
    { to: "/acidentes", label: "Acidentes e CAT", icon: AlertTriangle },
    { to: "/recusas", label: "Direito de recusa", icon: ShieldX },
  ]},
  { key: "relatorios", label: "Relatórios e conformidade", items: [
    { to: "/relatorios", label: "Relatórios", icon: FileBarChart },
    { to: "/dossie", label: "Dossiê da fiscalização", icon: FolderCheck },
    { to: "/esocial", label: "eSocial", icon: FileCheck2 },
  ]},
  { key: "gestao", label: "Gestão da empresa", items: [
    { to: "/painel-negocio", label: "Painel do negócio", icon: TrendingUp },
    { to: "/financeiro", label: "Financeiro", icon: Wallet },
    { to: "/organizacao", label: "Equipe e permissões", icon: UsersRound },
    { to: "/consumo", label: "Plano e consumo", icon: Receipt },
    { to: "/assinaturas", label: "Assinaturas (SmartSeg)", icon: CreditCard, adminOnly: true },
  ]},
  { key: "ajuda", label: "Ajuda", items: [
    { to: "/suporte", label: "Suporte", icon: LifeBuoy },
    { to: "/suporte-n2", label: "Suporte (analista)", icon: Headset, adminOnly: true },
    { to: "/manual", label: "Manual do sistema", icon: BookOpen },
  ]},
];

function ItemLink({ item, active }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
      style={{ background: active ? WORK.accent : "transparent", color: active ? "#FFFFFF" : WORK.text, fontWeight: active ? 600 : 400 }}
    >
      <Icon size={18} style={{ color: active ? "#FFFFFF" : WORK.accent }} />
      {item.label}
    </Link>
);
}

export default function SidebarNav({ org, user }) {
  const { pathname } = useLocation();
  const isActive = (to) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const visible = (items) =>
    items.filter((it) => podeVer(org, moduloDaRota(it.to)) && (!it.adminOnly || user?.role === "admin") && (it.to !== "/espaco-zela" || org?.org?.canal_escuta));

  const [open, setOpen] = useState(() => {
    const o = {};
    GROUPS.forEach((g) => { o[g.key] = g.items.some((it) => isActive(it.to)); });
    return o;
  });

  useEffect(() => {
    const match = GROUPS.find((g) => g.items.some((it) => isActive(it.to)));
    if (match) setOpen((o) => (o[match.key] ? o : { ...o, [match.key]: true }));
     
  }, [pathname]);

  return (
    <nav className="flex flex-col gap-1 mt-2">
      {TOP.filter((it) => podeVer(org, moduloDaRota(it.to))).map((it) => (
        <ItemLink key={it.to} item={it} active={isActive(it.to)} />
    ))}
      {GROUPS.map((g) => {
        const vis = visible(g.items);
        if (!vis.length) return null;
        const isOpen = open[g.key];
        const anyActive = vis.some((it) => isActive(it.to));
        return (
          <div key={g.key} className="mt-1">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [g.key]: !isOpen }))}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: anyActive ? WORK.accent : WORK.muted }}
            >
              <span>{g.label}</span>
              <ChevronDown size={14} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
            {isOpen && vis.map((it) => (
              <ItemLink key={it.to} item={it} active={isActive(it.to)} />
          ))}
          </div>
      );
      })}
    </nav>
);
}

export function MobileBottomNav({ org }) {
  const { pathname } = useLocation();
  const isActive = (to) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const items = [
    { to: "/", label: "Início", icon: HomeIcon },
    { to: "/vencimentos", label: "Vencimentos", icon: CalendarClock },
    { to: "/clinica", label: "Clínica", icon: Hospital },
    { to: "/empresas", label: "Empresas", icon: Building2 },
  ].filter((it) => podeVer(org, moduloDaRota(it.to)));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t flex items-center" style={{ background: WORK.surface, borderColor: WORK.border }}>
      {items.map((it) => {
        const Icon = it.icon;
        const active = isActive(it.to);
        return (
          <Link key={it.to} to={it.to} className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px]" style={{ color: active ? WORK.accent : WORK.muted }}>
            <Icon size={20} />
            {it.label}
          </Link>
      );
      })}
      <Link to="/assistente-ia" className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px]" style={{ color: isActive("/assistente-ia") ? WORK.accent : WORK.muted }}>
        <Sparkles size={20} />
        Assistente
      </Link>
    </nav>
);
}