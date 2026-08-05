"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  acceptAiSuggestion,
  getAiSuggestionsForTicket,
  rejectAiSuggestion,
  requestTicketSummarySuggestion,
} from "@/server/actions/ai-suggestions";
import type { getTicket, getTickets } from "@/server/actions/tickets";
import {
  addTicketComment,
  assignTicket,
  createTicket,
  getTicket as getTicketDetail,
  updateTicketStatus,
} from "@/server/actions/tickets";

type Ticket = Awaited<ReturnType<typeof getTickets>>[number];
type TicketDetail = Awaited<ReturnType<typeof getTicket>>;
type Suggestion = Awaited<ReturnType<typeof getAiSuggestionsForTicket>>[number];
type Member = { userId: string; name: string | null; email: string };

const STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em atendimento",
  waiting_customer: "Aguardando cliente",
  resolved: "Resolvido",
  closed: "Encerrado",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-800",
  waiting_customer: "bg-amber-100 text-amber-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-200 text-slate-500",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

function formatDate(value: string | Date) {
  return new Date(value).toLocaleString("pt-BR");
}

function TicketDetailPanel({ ticketId, members }: { ticketId: string; members: Member[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    startTransition(async () => {
      const [d, s] = await Promise.all([
        getTicketDetail(ticketId),
        getAiSuggestionsForTicket(ticketId),
      ]);
      setDetail(d);
      setSuggestions(s);
    });
  }

  function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateTicketStatus(ticketId, { status });
      router.refresh();
      load();
    });
  }

  function handleAssign(userId: string) {
    startTransition(async () => {
      await assignTicket(ticketId, userId || null);
      router.refresh();
      load();
    });
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addTicketComment(ticketId, { body: commentBody, isInternal });
        setCommentBody("");
        load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao comentar.");
      }
    });
  }

  function handleRequestSuggestion() {
    setError(null);
    startTransition(async () => {
      try {
        await requestTicketSummarySuggestion(ticketId);
        load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao pedir sugestão de IA.");
      }
    });
  }

  function handleDecideSuggestion(id: string, accept: boolean) {
    startTransition(async () => {
      try {
        await (accept ? acceptAiSuggestion(id) : rejectAiSuggestion(id));
        load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao decidir sugestão.");
      }
    });
  }

  if (!detail) {
    return (
      <div className="p-4">
        <Button size="sm" variant="outline" onClick={load} disabled={isPending}>
          Ver detalhes
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-slate-50 border-t border-slate-200">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={detail.ticket.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-48"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={detail.ticket.assignedTo ?? ""}
          onChange={(e) => handleAssign(e.target.value)}
          className="w-56"
        >
          <option value="">Sem responsável</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name || m.email}
            </option>
          ))}
        </Select>
        <Button size="sm" variant="outline" onClick={handleRequestSuggestion} disabled={isPending}>
          Sugestão de IA
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">Sugestões de IA</p>
          {suggestions.map((s) => {
            const data = s.suggestion as { summary?: string; category?: string };
            return (
              <div key={s.id} className="bg-white border border-slate-200 rounded-lg p-3 text-sm">
                <p className="text-slate-900">{data.summary}</p>
                {data.category && (
                  <p className="text-xs text-slate-500">Categoria sugerida: {data.category}</p>
                )}
                {s.status === "pending" ? (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDecideSuggestion(s.id, true)}
                      disabled={isPending}
                    >
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDecideSuggestion(s.id, false)}
                      disabled={isPending}
                    >
                      Rejeitar
                    </Button>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    {s.status === "accepted" ? "Aceita" : "Rejeitada"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500">Comentários</p>
        {detail.comments.length === 0 && (
          <p className="text-sm text-slate-500">Nenhum comentário ainda.</p>
        )}
        {detail.comments.map((c) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-lg p-3 text-sm">
            <p className="text-slate-900">{c.body}</p>
            <p className="text-xs text-slate-500">
              {c.isInternal ? "Nota interna" : "Visível ao cliente"} · {formatDate(c.createdAt)}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddComment} className="space-y-2">
        <Input
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          placeholder="Escrever comentário"
          required
        />
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
          />
          Nota interna (não visível ao cliente)
        </label>
        <Button type="submit" size="sm" disabled={isPending}>
          Comentar
        </Button>
      </form>
    </div>
  );
}

export function TicketsClient({ tickets, members }: { tickets: Ticket[]; members: Member[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createTicket({ subject, priority });
        setSubject("");
        setCreating(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar chamado.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Chamados</h2>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          Novo chamado
        </Button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-end"
        >
          <Input
            placeholder="Assunto"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 min-w-[200px]"
            required
          />
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "low" | "normal" | "high" | "urgent")}
            className="w-40"
          >
            <option value="low">Baixa</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </Select>
          <Button type="submit" size="sm" disabled={isPending}>
            Salvar
          </Button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {tickets.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum chamado ainda.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const overdue =
              new Date(t.slaDueAt) < new Date() && !["resolved", "closed"].includes(t.status);
            return (
              <div
                key={t.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full text-left p-4 flex items-center justify-between gap-3"
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t.subject}</p>
                    <p className="text-xs text-slate-500">
                      {t.company?.tradeName ? `${t.company.tradeName} · ` : ""}
                      {PRIORITY_LABELS[t.priority]} · SLA {formatDate(t.slaDueAt)}
                      {overdue && <span className="text-red-600 font-medium"> · Vencido</span>}
                      {t.assignee && ` · ${t.assignee.name || t.assignee.email}`}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[t.status] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {STATUS_LABELS[t.status] ?? t.status}
                  </span>
                </button>
                {expandedId === t.id && <TicketDetailPanel ticketId={t.id} members={members} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
