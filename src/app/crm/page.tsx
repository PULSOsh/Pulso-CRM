import { AppShell } from "@/components/crm/app-shell";
import { KanbanBoard } from "@/components/crm/kanban-board";

export default function CrmPage() {
  return (
    <AppShell active="crm" eyebrow="COMERCIAL" title="CRM">
      <section className="page">
        <KanbanBoard />
      </section>
    </AppShell>
  );
}
