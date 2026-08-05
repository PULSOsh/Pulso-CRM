"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPortalTicket } from "@/server/actions/tickets";

export default function TicketForm({ token }: { token: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createPortalTicket(token, { subject, description });
      if (!result.success) {
        setError(result.error || "Erro ao abrir chamado.");
        return;
      }
      setSubject("");
      setDescription("");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button type="button" className="secondary-button" onClick={() => setOpen(true)}>
        Abrir novo chamado
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Assunto"
        required
        style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        placeholder="Descreva o que está acontecendo (opcional)"
        style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
      />
      {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" className="primary-button" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar"}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setOpen(false)}
          disabled={isPending}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
