import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-control border border-pulso-border bg-white px-4 py-3 text-sm outline-none focus:border-pulso-signal focus:ring-2 focus:ring-pulso-signal-soft disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
