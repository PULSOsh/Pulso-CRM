"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { processPendingAutomations } from "@/server/actions/automation-engine";
import { createAutomationRule, setAutomationRuleActive } from "@/server/actions/automation-rules";
import {
  createWebhookIntegration,
  setIntegrationConnectionStatus,
} from "@/server/actions/integrations";

type Rule = {
  id: string;
  name: string;
  triggerType: string;
  isActive: boolean;
  actions: { type: string; params: Record<string, unknown> }[];
};
type QueueStatus = {
  pending: number;
  deadLetter: number;
  recentRuns: {
    id: string;
    status: string;
    ruleId: string;
    lastError: string | null;
    startedAt: string | Date;
  }[];
};
type Integration = { id: string; name: string; status: string; settings: unknown };

const TRIGGER_LABELS: Record<string, string> = {
  opportunity_won: "Oportunidade ganha",
  opportunity_lost: "Oportunidade perdida",
  ticket_created: "Chamado criado",
  ticket_sla_breached: "SLA de chamado vencido",
  manual: "Manual",
};

function RulesSection({
  rules,
  members,
}: {
  rules: Rule[];
  members: { userId: string; name: string | null; email: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("ticket_created");
  const [actionType, setActionType] = useState<
    "create_notification" | "create_task" | "send_webhook"
  >("create_notification");
  const [notifyUserId, setNotifyUserId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const params: Record<string, string> =
      actionType === "create_notification"
        ? { userId: notifyUserId, title: `Automação: ${name}` }
        : actionType === "create_task"
          ? { title: taskTitle || `Tarefa: ${name}` }
          : {};

    startTransition(async () => {
      try {
        await createAutomationRule({
          name,
          triggerType,
          conditions: [],
          actions: [{ type: actionType, params }],
        });
        setName("");
        setCreating(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar regra.");
      }
    });
  }

  function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      await setAutomationRuleActive(id, !isActive);
      router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Regras de automação</h2>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          Nova regra
        </Button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
        >
          <Input
            placeholder="Nome da regra"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>
              {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as typeof actionType)}
            >
              <option value="create_notification">Notificar usuário</option>
              <option value="create_task">Criar tarefa</option>
              <option value="send_webhook">Enviar webhook</option>
            </Select>
          </div>
          {actionType === "create_notification" && (
            <Select value={notifyUserId} onChange={(e) => setNotifyUserId(e.target.value)} required>
              <option value="">Notificar quem?</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name || m.email}
                </option>
              ))}
            </Select>
          )}
          {actionType === "create_task" && (
            <Input
              placeholder="Título da tarefa"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="sm" disabled={isPending}>
            Salvar
          </Button>
        </form>
      )}

      {rules.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma regra cadastrada ainda.</p>
      ) : (
        <ul className="space-y-2">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between rounded-control border border-pulso-border p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{rule.name}</p>
                <p className="text-xs text-slate-500">
                  {TRIGGER_LABELS[rule.triggerType] ?? rule.triggerType} ·{" "}
                  {rule.actions.map((a) => a.type).join(", ")}
                  {!rule.isActive && " · Desativada"}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleToggle(rule.id, rule.isActive)}
                disabled={isPending}
              >
                {rule.isActive ? "Desativar" : "Ativar"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function QueueSection({ queue }: { queue: QueueStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleProcess() {
    startTransition(async () => {
      const r = await processPendingAutomations();
      setResult(`${r.processed} evento(s) processado(s), ${r.remaining} restante(s) neste lote.`);
      router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      <h2 className="font-medium text-slate-900">Fila de eventos</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">Pendentes</p>
          <p className="text-xl font-bold text-slate-900">{queue.pending}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">Dead-letter (5+ tentativas)</p>
          <p className="text-xl font-bold text-red-600">{queue.deadLetter}</p>
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={handleProcess} disabled={isPending}>
        Processar pendentes agora
      </Button>
      {result && <p className="text-sm text-slate-600">{result}</p>}

      {queue.recentRuns.length > 0 && (
        <ul className="space-y-1">
          {queue.recentRuns.map((run) => (
            <li key={run.id} className="text-xs text-slate-600 flex justify-between">
              <span>{new Date(run.startedAt).toLocaleString("pt-BR")}</span>
              <span className={run.status === "success" ? "text-emerald-600" : "text-red-600"}>
                {run.status}
                {run.lastError ? ` — ${run.lastError}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function IntegrationsSection({ integrations }: { integrations: Integration[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createWebhookIntegration({ name, url });
        setName("");
        setUrl("");
        setCreating(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar integração.");
      }
    });
  }

  function handleToggle(id: string, status: string) {
    startTransition(async () => {
      await setIntegrationConnectionStatus(id, status === "active" ? "inactive" : "active");
      router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Integrações (webhook)</h2>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          Nova integração
        </Button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
        >
          <Input
            placeholder="Nome (ex.: Slack)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            placeholder="URL do webhook"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="sm" disabled={isPending}>
            Salvar
          </Button>
        </form>
      )}

      {integrations.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma integração cadastrada ainda.</p>
      ) : (
        <ul className="space-y-2">
          {integrations.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between rounded-control border border-pulso-border p-3"
            >
              <p className="text-sm text-slate-900">{i.name}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleToggle(i.id, i.status)}
                disabled={isPending}
              >
                {i.status === "active" ? "Desativar" : "Ativar"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AutomationClient({
  rules,
  queue,
  integrations,
  members,
}: {
  rules: Rule[];
  queue: QueueStatus;
  integrations: Integration[];
  members: { userId: string; name: string | null; email: string }[];
}) {
  return (
    <div className="space-y-8">
      <RulesSection rules={rules} members={members} />
      <QueueSection queue={queue} />
      <IntegrationsSection integrations={integrations} />
    </div>
  );
}
