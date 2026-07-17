import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SubmissionDetails } from "@/components/crm/briefings/submission-details";
import { getBriefingSubmissionById } from "@/server/actions/briefing-submissions";
import { auth } from "@/server/auth";

export default async function InboxDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // TODO: Get active org ID from session/context
  const orgId = "00000000-0000-0000-0000-000000000000";

  const submission = await getBriefingSubmissionById(params.id, orgId);

  if (!submission) {
    notFound();
  }

  return (
    <div className="p-8">
      <SubmissionDetails submission={submission} orgId={orgId} userId={session.user.id} />
    </div>
  );
}
