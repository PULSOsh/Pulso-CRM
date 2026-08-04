import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { ProjectsClient } from "@/components/crm/projects-client";
import { getProjectTemplates } from "@/server/actions/project-templates";
import { getProjects, getSignedContractsWithoutProject } from "@/server/actions/projects";
import { auth } from "@/server/auth";

export default async function ProjectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const [projects, availableContracts, templates] = await Promise.all([
    getProjects(),
    getSignedContractsWithoutProject(),
    getProjectTemplates(),
  ]);

  return (
    <AppShell active="projects" eyebrow="OPERAÇÃO" title="Projetos">
      <ProjectsClient
        initialProjects={projects}
        availableContracts={availableContracts}
        templates={templates.map((t) => ({ id: t.id, name: t.name }))}
      />
    </AppShell>
  );
}
