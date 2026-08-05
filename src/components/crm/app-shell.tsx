"use client";

import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CheckSquare,
  ClipboardList,
  Contact,
  FileSignature,
  FileText,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  WalletCards,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { getNavBadgeCounts, getOverdueAlerts } from "@/server/actions/nav";
import { getMyNotifications, markNotificationRead } from "@/server/actions/notifications";

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
  { href: "/crm/tarefas", label: "Tarefas", key: "tasks", icon: CheckSquare },
  { href: "/crm/financeiro", label: "Financeiro", key: "finance", icon: WalletCards },
  { href: "/crm/relatorios", label: "Relatórios", key: "reports", icon: BarChart3 },
  { href: "#", label: "Configurações", key: "settings", icon: Settings },
];

type NavBadgeCounts = {
  openOpportunities: number;
  awaitingProposals: number;
  myPendingTasks: number;
};

const BADGE_BY_KEY: Record<string, keyof NavBadgeCounts> = {
  crm: "openOpportunities",
  budgets: "awaitingProposals",
  tasks: "myPendingTasks",
};

type OverdueAlerts = {
  overdueNextActions: { id: string; title: string; nextActionDescription: string | null }[];
  overdueTasks: { id: string; title: string }[];
  total: number;
};

type Notifications = Awaited<ReturnType<typeof getMyNotifications>>;

type ActiveKey =
  | "dashboard"
  | "crm"
  | "briefings"
  | "budgets"
  | "contacts"
  | "companies"
  | "contracts"
  | "projects"
  | "tasks"
  | "finance"
  | "reports"
  | "profitability"
  | "personal"
  | "products";

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
  const [badgeCounts, setBadgeCounts] = useState<NavBadgeCounts | null>(null);
  const [overdueAlerts, setOverdueAlerts] = useState<OverdueAlerts | null>(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notifications | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!session) return;
    getNavBadgeCounts()
      .then(setBadgeCounts)
      .catch(() => setBadgeCounts(null));
    getOverdueAlerts()
      .then(setOverdueAlerts)
      .catch(() => setOverdueAlerts(null));
    getMyNotifications()
      .then(setNotifications)
      .catch(() => setNotifications(null));
  }, [session]);

  const unreadNotifications = notifications?.filter((n) => !n.readAt) ?? [];

  async function handleOpenNotification(id: string) {
    setNotifications(
      (prev) =>
        prev?.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date() } : n)) ?? null,
    );
    setIsNotificationsOpen(false);
    await markNotificationRead(id);
  }

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const group = (items: typeof primary) =>
    items
      .filter((item) => item.href !== "#")
      .map(({ href, label, key, icon: Icon }) => {
        const badgeField = BADGE_BY_KEY[key];
        const count = badgeField && badgeCounts ? badgeCounts[badgeField] : null;
        return (
          <Link key={label} href={href} className={`nav-link ${key === active ? "active" : ""}`}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
            {!!count && (
              <span className="ml-auto bg-white/15 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </Link>
        );
      });

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
          <div className="topbar-actions flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                className="search"
                style={{ paddingLeft: 36, paddingRight: 56 }}
                placeholder="Buscar clientes, briefings, propostas..."
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 pointer-events-none">
                ⌘ K
              </kbd>
            </div>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-slate-500 hover:bg-slate-100"
                onClick={() => setIsAlertsOpen((v) => !v)}
                title="Alertas"
              >
                <Bell size={20} />
                {!!overdueAlerts?.total && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                    {overdueAlerts.total}
                  </span>
                )}
              </Button>

              {isAlertsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
                    Pendências vencidas
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {!overdueAlerts?.total && (
                      <p className="p-4 text-sm text-slate-400">Nada vencido. Tudo em dia.</p>
                    )}
                    {overdueAlerts?.overdueNextActions.map((opp) => (
                      <Link
                        key={opp.id}
                        href={`/crm/opportunities/${opp.id}`}
                        className="flex items-start gap-2 p-3 hover:bg-slate-50 border-b border-slate-50 text-sm"
                        onClick={() => setIsAlertsOpen(false)}
                      >
                        <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <span>
                          <strong className="text-slate-800">{opp.title}</strong>
                          <br />
                          <span className="text-slate-500 text-xs">
                            {opp.nextActionDescription || "Próxima ação vencida"}
                          </span>
                        </span>
                      </Link>
                    ))}
                    {overdueAlerts?.overdueTasks.map((task) => (
                      <Link
                        key={task.id}
                        href="/crm/tarefas"
                        className="flex items-start gap-2 p-3 hover:bg-slate-50 border-b border-slate-50 text-sm"
                        onClick={() => setIsAlertsOpen(false)}
                      >
                        <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <span className="text-slate-800">{task.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-slate-500 hover:bg-slate-100"
                onClick={() => setIsNotificationsOpen((v) => !v)}
                title="Notificações"
              >
                <Inbox size={20} />
                {!!unreadNotifications.length && (
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </Button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
                    Notificações
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {!notifications?.length && (
                      <p className="p-4 text-sm text-slate-400">Nenhuma notificação ainda.</p>
                    )}
                    {notifications?.map((n) => (
                      <Link
                        key={n.id}
                        href={n.actionUrl || "#"}
                        className={`flex items-start gap-2 p-3 hover:bg-slate-50 border-b border-slate-50 text-sm ${
                          n.readAt ? "opacity-60" : ""
                        }`}
                        onClick={() => handleOpenNotification(n.id)}
                      >
                        <span>
                          <strong className="text-slate-800">{n.title}</strong>
                          {n.body && (
                            <>
                              <br />
                              <span className="text-slate-500 text-xs">{n.body}</span>
                            </>
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
