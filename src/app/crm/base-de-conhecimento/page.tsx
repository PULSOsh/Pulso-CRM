import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/crm/app-shell";
import { KnowledgeClient } from "@/components/crm/knowledge/knowledge-client";
import { getKnowledgeArticles } from "@/server/actions/knowledge";
import { auth } from "@/server/auth";

export default async function KnowledgeBasePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const articles = await getKnowledgeArticles();

  return (
    <AppShell active="knowledge" eyebrow="OPERAÇÃO" title="Base de conhecimento">
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
        <KnowledgeClient articles={articles} />
      </div>
    </AppShell>
  );
}
