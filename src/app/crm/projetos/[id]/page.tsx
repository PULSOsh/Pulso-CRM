import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { ProjectDetailsClient } from "@/components/crm/project-details-client";
import { getApprovalsForProject } from "@/server/actions/approvals";
import { getFilesForEntity } from "@/server/actions/files";
import { getOrganizationMembers } from "@/server/actions/members";
import { getMilestonesForProject } from "@/server/actions/milestones";
import { getProjectById, getProjectStages } from "@/server/actions/projects";
import { getScopeChangesForProject } from "@/server/actions/scope-changes";
import { getTimeEntriesForProject } from "@/server/actions/time-entries";
import { auth } from "@/server/auth";

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const [stages, approvals, members, milestones, timeEntries, scopeChanges, files] =
    await Promise.all([
      getProjectStages(),
      getApprovalsForProject(id),
      getOrganizationMembers(),
      getMilestonesForProject(id),
      getTimeEntriesForProject(id),
      getScopeChangesForProject(id),
      getFilesForEntity("project", id),
    ]);

  return (
    <AppShell active="projects" eyebrow="OPERAÇÃO" title={project.name}>
      <ProjectDetailsClient
        project={project}
        stages={stages}
        approvals={approvals}
        members={members}
        milestones={milestones}
        timeEntries={timeEntries}
        scopeChanges={scopeChanges}
        currentUserId={session.user.id}
        files={files}
      />
    </AppShell>
  );
}
