import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";
export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 text-sm font-semibold transition duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulso-signal disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-pulso-signal text-white hover:bg-pulso-signal-strong",
        secondary: "bg-pulso-carbon text-white hover:bg-pulso-carbon-soft",
        outline: "border border-pulso-border bg-transparent text-pulso-carbon hover:bg-white",
        ghost: "bg-transparent text-current hover:bg-pulso-neutral-soft",
        destructive: "bg-pulso-error text-white",
      },
      size: {
        sm: "min-h-10 px-4 text-xs",
        md: "min-h-11 px-5",
        lg: "min-h-13 px-6 text-base",
        icon: "size-11 px-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
