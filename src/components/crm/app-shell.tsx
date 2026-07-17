"use client";

import {
  BarChart3,
  Building2,
  CheckSquare,
  ClipboardList,
  Contact,
  FileSignature,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  WalletCards,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const primary = [
  { href: "/dashboard", label: "Visão geral", key: "dashboard", icon: LayoutDashboard },
  { href: "/crm/pipeline", label: "Funil (Kanban)", key: "crm", icon: KanbanSquare },
  { href: "/crm/briefings/inbox", label: "Briefings", key: "briefings", icon: ClipboardList },
  { href: "/crm/contatos", label: "Contatos", key: "contacts", icon: Contact },
  { href: "/crm/empresas", label: "Empresas", key: "companies", icon: Building2 },
];

const commercial = [
  { href: "/crm/quotes", label: "Orçamentos", key: "budgets", icon: FileText },
  { href: "/crm/contratos", label: "Contratos", key: "contracts", icon: FileSignature },
];

const operation = [
  { href: "/crm/projetos", label: "Projetos", key: "projects", icon: KanbanSquare },
  { href: "#", label: "Tarefas", key: "tasks", icon: CheckSquare },
  { href: "#", label: "Financeiro", key: "finance", icon: WalletCards },
  { href: "#", label: "Relatórios", key: "reports", icon: BarChart3 },
  { href: "#", label: "Configurações", key: "settings", icon: Settings },
];

type ActiveKey =
  | "dashboard"
  | "crm"
  | "briefings"
  | "budgets"
  | "contacts"
  | "companies"
  | "contracts"
  | "projects";

type AppShellProps = {
  active: ActiveKey;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
};

export function AppShell({ active, eyebrow, title, children }: AppShellProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const group = (items: typeof primary) =>
    items
      .filter((item) => item.href !== "#")
      .map(({ href, label, key, icon: Icon }) => (
        <Link key={label} href={href} className={`nav-link ${key === active ? "active" : ""}`}>
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ));

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="mobile-overlay fixed inset-0 z-40 cursor-pointer border-none bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand flex w-full justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/brand/pulso_horizontal_signal_white.svg"
              alt="PULSO"
              width={120}
              height={30}
            />
            <span className="text-[14px] font-bold">CRM</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="mobile-close-btn text-white hover:bg-white/10"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </Button>
        </div>
        <nav>
          {group(primary)}
          <div className="nav-label">COMERCIAL</div>
          {group(commercial)}
          <div className="nav-label">OPERAÇÃO</div>
          {group(operation)}
        </nav>
        <div className="sidebar-user flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="avatar">
              {session?.user?.name?.substring(0, 2).toUpperCase() || "..."}
            </div>
            <div>
              <strong>{session?.user?.name || "Carregando..."}</strong>
              <span>Administrador</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sair"
            className="text-white hover:bg-white/10"
          >
            <LogOut size={20} />
          </Button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} className="text-slate-700" />
            </Button>
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <input className="search" placeholder="Buscar clientes, briefings, propostas..." />
            <div className="avatar">
              {session?.user?.name?.substring(0, 2).toUpperCase() || "..."}
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
