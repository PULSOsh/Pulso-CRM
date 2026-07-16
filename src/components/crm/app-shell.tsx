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
  Settings,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const primary = [
  { href: "/dashboard", label: "Visão geral", key: "dashboard", icon: LayoutDashboard },
  { href: "/crm", label: "CRM", key: "crm", icon: KanbanSquare },
  { href: "/briefings", label: "Briefings", key: "briefings", icon: ClipboardList },
  { href: "#", label: "Contatos", key: "contacts", icon: Contact },
  { href: "#", label: "Empresas", key: "companies", icon: Building2 },
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

type ActiveKey = "dashboard" | "crm" | "briefings" | "budgets";

type AppShellProps = {
  active: ActiveKey;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
};

export function AppShell({ active, eyebrow, title, children }: AppShellProps) {
  const group = (items: typeof primary) =>
    items.map(({ href, label, key, icon: Icon }) => (
      <Link key={label} href={href} className={`nav-link ${key === active ? "active" : ""}`}>
        <Icon aria-hidden="true" />
        <span>{label}</span>
      </Link>
    ));

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Image
            src="/brand/pulso_horizontal_signal_white.svg"
            alt="PULSO"
            width={150}
            height={38}
          />
          <span>CRM</span>
        </div>
        <nav>
          {group(primary)}
          <div className="nav-label">COMERCIAL</div>
          {group(commercial)}
          <div className="nav-label">OPERAÇÃO</div>
          {group(operation)}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">GC</div>
          <div>
            <strong>Gustavo Costa</strong>
            <span>Administrador</span>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
          </div>
          <div className="topbar-actions">
            <input className="search" placeholder="Buscar clientes, briefings, propostas..." />
            <div className="avatar">GC</div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
