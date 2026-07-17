import { Inbox } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Inbox size={24} className="text-orange-600" />
            Caixa de Entrada de Briefings
          </h1>
          <p className="text-slate-500 mt-1">Gerencie os envios públicos recebidos pelo site</p>
        </div>
      </div>

      <InboxList submissions={submissions} />
    </div>
  );
}
