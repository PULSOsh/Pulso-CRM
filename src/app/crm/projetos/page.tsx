import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { ProjectsClient } from "@/components/crm/projects-client";
import { getProjects, getSignedContractsWithoutProject } from "@/server/actions/projects";
import { auth } from "@/server/auth";

export default async function ProjectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const [projects, availableContracts] = await Promise.all([
    getProjects(),
    getSignedContractsWithoutProject(),
  ]);

  return (
    <AppShell active="projects" eyebrow="OPERAÇÃO" title="Projetos">
      <ProjectsClient initialProjects={projects} availableContracts={availableContracts} />
    </AppShell>
  );
}
