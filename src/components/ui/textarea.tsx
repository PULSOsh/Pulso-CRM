import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-control border border-pulso-border bg-white px-4 py-3 text-sm outline-none focus:border-pulso-signal focus:ring-2 focus:ring-pulso-signal-soft disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
