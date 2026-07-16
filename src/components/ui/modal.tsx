"use client";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { Button } from "./button";
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const tid = useId(),
    did = useId(),
    ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const old = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      old?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-pulso-carbon/70 p-5">
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tid}
        aria-describedby={description ? did : undefined}
        className="relative z-10 w-full max-w-lg rounded-panel bg-pulso-paper p-6 shadow-float"
      >
        <div className="flex justify-between gap-6">
          <div>
            <h2 id={tid} className="text-2xl font-semibold">
              {title}
            </h2>
            {description ? (
              <p id={did} className="mt-2 text-sm text-pulso-mineral">
                {description}
              </p>
            ) : null}
          </div>
          <Button ref={ref} variant="ghost" size="icon" aria-label="Fechar" onClick={onClose}>
            <X aria-hidden size={20} />
          </Button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
