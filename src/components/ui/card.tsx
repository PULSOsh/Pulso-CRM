import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-pulso-border bg-white p-6 shadow-card sm:p-8",
        className,
      )}
      {...props}
    />
  );
}
