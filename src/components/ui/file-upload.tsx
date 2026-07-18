import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const FileUpload = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="file"
    className={cn(
      "block w-full text-sm text-pulso-carbon file:mr-4 file:rounded-control file:border-0 file:bg-pulso-signal file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-pulso-signal-strong disabled:opacity-60",
      className,
    )}
    {...props}
  />
));
FileUpload.displayName = "FileUpload";
