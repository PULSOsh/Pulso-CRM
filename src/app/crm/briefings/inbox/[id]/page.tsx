import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { SubmissionDetails } from "@/components/crm/briefings/submission-details";
import { getBriefingSubmissionById } from "@/server/actions/briefing-submissions";
import { auth } from "@/server/auth";

export default async function InboxDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const submission = await getBriefingSubmissionById(id);

  if (!submission) {
    notFound();
  }

  return (
    <AppShell active="briefings" eyebrow="CAPTAÇÃO" title={submission.protocol}>
      <div className="p-4 md:p-8">
        <SubmissionDetails submission={submission} />
      </div>
    </AppShell>
  );
}
