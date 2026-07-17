"use client";

import { useState } from "react";

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
  X,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const primary = [
  { href: "/dashboard", label: "Visão geral", key: "dashboard", icon: LayoutDashboard },
  { href: "/crm/pipeline", label: "Funil (Kanban)", key: "crm", icon: KanbanSquare },
  { href: "/briefings", label: "Briefings", key: "briefings", icon: ClipboardList },
  { href: "/crm/contatos", label: "Contatos", key: "contacts", icon: Contact },
  { href: "/crm/empresas", label: "Empresas", key: "companies", icon: Building2 },
];

const commercial = [
  { href: "/orcamentos/novo", label: "Orçamentos", key: "budgets", icon: FileText },
  { href: "#", label: "Contratos", key: "contracts", icon: FileSignature },
];

const operation = [
  { href: "#", label: "Projetos", key: "projects", icon: KanbanSquare },
  { href: "#", label: "Tarefas", key: "tasks", icon: CheckSquare },
  { href: "#", label: "Financeiro", key: "finance", icon: WalletCards },
  { href: "#", label: "Relatórios", key: "reports", icon: BarChart3 },
  { href: "#", label: "Configurações", key: "settings", icon: Settings },
];

type ActiveKey = "dashboard" | "crm" | "briefings" | "budgets" | "contacts" | "companies";

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
    items.map(({ href, label, key, icon: Icon }) => (
      <Link key={label} href={href} className={`nav-link ${key === active ? "active" : ""}`}>
        <Icon aria-hidden="true" />
        <span>{label}</span>
      </Link>
    ));

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
        />
      )}
      
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image
              src="/brand/pulso_horizontal_signal_white.svg"
              alt="PULSO"
              width={120}
              height={30}
            />
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>CRM</span>
          </div>
          <button 
            className="mobile-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>
        <nav>
          {group(primary)}
          <div className="nav-label">COMERCIAL</div>
          {group(commercial)}
          {/* <div className="nav-label">OPERAÇÃO</div> */}
          {/* {group(operation)} */}
        </nav>
        <div
          className="sidebar-user"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div className="avatar">
              {session?.user?.name?.substring(0, 2).toUpperCase() || "..."}
            </div>
            <div>
              <strong>{session?.user?.name || "Carregando..."}</strong>
              <span>Administrador</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sair"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <Menu size={24} className="text-slate-700" />
            </button>
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
