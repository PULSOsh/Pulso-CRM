"use client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
export function Accordion({ items }: { items: { id: string; title: string; content: string }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="divide-y divide-pulso-border border-y border-pulso-border">
      {items.map((i) => {
        const yes = open === i.id;
        return (
          <div key={i.id}>
            <button
              type="button"
              aria-expanded={yes}
              onClick={() => setOpen(yes ? null : i.id)}
              className="flex min-h-14 w-full items-center justify-between py-4 text-left font-semibold"
            >
              {i.title}
              <ChevronDown
                aria-hidden
                size={20}
                className={cn("transition", yes && "rotate-180")}
              />
            </button>
            {yes ? (
              <div className="pb-5 pr-10 text-sm leading-7 text-pulso-mineral">{i.content}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
