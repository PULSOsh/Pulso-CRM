"use client";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/cn";
export function Tabs({ items }: { items: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const cur = items.find((i) => i.id === active);
  return (
    <div>
      <div role="tablist" aria-label="Seções" className="flex gap-2 border-b border-pulso-border">
        {items.map((i) => (
          <button
            key={i.id}
            type="button"
            role="tab"
            aria-selected={active === i.id}
            onClick={() => setActive(i.id)}
            className={cn(
              "min-h-11 border-b-2 px-4 text-sm font-semibold",
              active === i.id ? "border-pulso-signal" : "border-transparent text-pulso-mineral",
            )}
          >
            {i.label}
          </button>
        ))}
      </div>
      {cur ? (
        <div role="tabpanel" className="py-6">
          {cur.content}
        </div>
      ) : null}
    </div>
  );
}
