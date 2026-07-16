import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-control border border-pulso-border bg-white px-4 text-sm outline-none focus:border-pulso-signal focus:ring-2 focus:ring-pulso-signal-soft",
        className,
      )}
      {...props}
    />
  );
}
