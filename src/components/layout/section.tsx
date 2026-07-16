import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const tones = {
  paper: "bg-pulso-paper text-pulso-carbon",
  carbon: "bg-pulso-carbon text-white",
  white: "bg-white text-pulso-carbon",
};
export function Section({
  className,
  tone = "paper",
  ...props
}: HTMLAttributes<HTMLElement> & { tone?: keyof typeof tones }) {
  return <section className={cn("py-20 sm:py-24 lg:py-32", tones[tone], className)} {...props} />;
}
