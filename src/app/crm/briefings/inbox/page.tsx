import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { InboxList } from "@/components/crm/briefings/inbox-list";
import { getBriefingSubmissions } from "@/server/actions/briefing-submissions";
import { auth } from "@/server/auth";

export default async function InboxPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const submissions = await getBriefingSubmissions();

  return (
    <AppShell active="briefings" eyebrow="CAPTAÇÃO" title="Briefings">
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <p className="muted">
            Respostas públicas recebidas pelo site, prontas para virar oportunidade.
          </p>
        </div>

        <InboxList submissions={submissions} />
      </div>
    </AppShell>
  );
}
