import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const v = cva(
  "inline-flex rounded-pill border px-3 py-1 font-mono text-xs uppercase tracking-label",
  {
    variants: {
      variant: {
        signal: "border-pulso-signal bg-pulso-signal-soft text-pulso-signal-strong",
        neutral: "border-pulso-border bg-white text-pulso-mineral",
        dark: "border-white/20 bg-white/10 text-white",
        success: "border-pulso-success/30 bg-pulso-success/10 text-pulso-success",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);
export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof v>) {
  return <span className={cn(v({ variant }), className)} {...props} />;
}
