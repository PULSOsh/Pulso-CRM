import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
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
    <div className="p-8">
      <SubmissionDetails submission={submission} />
    </div>
  );
}
