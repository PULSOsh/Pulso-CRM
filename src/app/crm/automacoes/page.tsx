import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { AutomationClient } from "@/components/crm/automation/automation-client";
import { getAutomationQueueStatus } from "@/server/actions/automation-engine";
import { getAutomationRules } from "@/server/actions/automation-rules";
import { getIntegrationConnections } from "@/server/actions/integrations";
import { getOrganizationMembers } from "@/server/actions/members";
import { auth } from "@/server/auth";

export default async function AutomationPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [rules, queue, integrations, members] = await Promise.all([
    getAutomationRules(),
    getAutomationQueueStatus(),
    getIntegrationConnections(),
    getOrganizationMembers(),
  ]);

  return (
    <AppShell active="automation" eyebrow="OPERAÇÃO" title="Automações">
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
        <AutomationClient
          rules={rules}
          queue={queue}
          integrations={integrations}
          members={members}
        />
      </div>
    </AppShell>
  );
}
