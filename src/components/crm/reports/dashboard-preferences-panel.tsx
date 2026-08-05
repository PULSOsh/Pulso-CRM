"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setDashboardWidgetVisibility } from "@/server/actions/dashboard-preferences";

type Preference = { key: string; label: string; isVisible: boolean };

export function DashboardPreferencesPanel({ preferences }: { preferences: Preference[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle(key: string, isVisible: boolean) {
    startTransition(async () => {
      await setDashboardWidgetVisibility(key, !isVisible);
      router.refresh();
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-4">
      <span className="text-xs font-semibold text-slate-500">Mostrar seções:</span>
      {preferences.map((p) => (
        <label key={p.key} className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={p.isVisible}
            disabled={isPending}
            onChange={() => handleToggle(p.key, p.isVisible)}
          />
          {p.label}
        </label>
      ))}
    </div>
  );
}
