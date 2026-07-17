import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { ProjectDetailsClient } from "@/components/crm/project-details-client";
import { getProjectById, getProjectStages } from "@/server/actions/projects";
import { auth } from "@/server/auth";

export default async function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const project = await getProjectById(params.id);

  if (!project) {
    notFound();
  }

  const stages = await getProjectStages();

  return (
    <AppShell active="projects" eyebrow="OPERAÇÃO" title={project.name}>
      <ProjectDetailsClient project={project} stages={stages} />
    </AppShell>
  );
}
