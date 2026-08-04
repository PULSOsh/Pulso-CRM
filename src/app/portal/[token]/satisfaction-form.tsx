"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitSatisfaction } from "@/server/actions/client-portal";

export default function SatisfactionForm({ token }: { token: string }) {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (score === 0) {
      setError("Escolha uma nota de 1 a 5.");
      return;
    }
    startTransition(async () => {
      const result = await submitSatisfaction(token, { score, comment });
      if (!result.success) {
        setError(result.error || "Erro ao enviar avaliação.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setScore(value)}
            aria-label={`Nota ${value}`}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
          >
            <Star
              size={28}
              fill={value <= score ? "var(--signal)" : "none"}
              color="var(--signal)"
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Comentário (opcional)"
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid var(--border)",
        }}
      />
      {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}
      <button
        type="submit"
        className="primary-button"
        disabled={isPending}
        style={{ justifySelf: "start" }}
      >
        {isPending ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
