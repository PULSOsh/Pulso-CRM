import { AppShell } from "@/components/crm/app-shell";
import { ProposalBuilder } from "@/components/proposals/proposal-builder";

export default function NewProposalPage() {
  return (
    <AppShell active="budgets" eyebrow="COMERCIAL" title="Gerador de orçamento">
      <section className="page">
        <ProposalBuilder />
      </section>
    </AppShell>
  );
}
