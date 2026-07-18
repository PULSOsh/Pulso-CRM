"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createOpportunity, moveOpportunity } from "@/server/actions/pipeline";
import { KanbanCard, type OpportunityCardType } from "./kanban-card";
import { KanbanColumn, type PipelineStageColumnType } from "./kanban-column";

type SortOption = "position" | "value_desc" | "next_action";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function KanbanBoard({
  initialStages,
  pipelineId,
  companies,
  contacts,
  summary,
}: {
  initialStages: PipelineStageColumnType[];
  pipelineId: string;
  companies: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
  summary: { openCount: number; pipelineValue: number; weightedForecast: number };
}) {
  const [stages, setStages] = useState<PipelineStageColumnType[]>(initialStages);
  const [activeCard, setActiveCard] = useState<OpportunityCardType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [temperatureFilter, setTemperatureFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("position");

  const owners = useMemo(() => {
    const names = new Set<string>();
    for (const stage of stages) {
      for (const opp of stage.opportunities) {
        if (opp.owner?.name) names.add(opp.owner.name);
      }
    }
    return Array.from(names).sort();
  }, [stages]);

  const visibleStages = useMemo(() => {
    const sortOpportunities = (opps: OpportunityCardType[]) => {
      if (sortBy === "value_desc") {
        return [...opps].sort((a, b) => Number(b.estimatedValue) - Number(a.estimatedValue));
      }
      if (sortBy === "next_action") {
        return [...opps].sort((a, b) => {
          if (!a.nextActionAt) return 1;
          if (!b.nextActionAt) return -1;
          return new Date(a.nextActionAt).getTime() - new Date(b.nextActionAt).getTime();
        });
      }
      return opps;
    };

    return stages.map((stage) => {
      const filtered = stage.opportunities.filter((opp) => {
        if (temperatureFilter !== "all" && opp.temperature !== temperatureFilter) return false;
        if (ownerFilter !== "all" && opp.owner?.name !== ownerFilter) return false;
        return true;
      });
      return { ...stage, opportunities: sortOpportunities(filtered) };
    });
  }, [stages, temperatureFilter, ownerFilter, sortBy]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const _stageIds = useMemo(() => stages.map((s) => s.id), [stages]);

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Opportunity") {
      setActiveCard(event.active.data.current.opportunity);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Opportunity";
    const isOverTask = over.data.current?.type === "Opportunity";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    // Dropping a Task over another Task
    if (isActiveTask && isOverTask) {
      setStages((prev) => {
        const activeStageIndex = prev.findIndex((s) =>
          s.opportunities.some((opp) => opp.id === activeId),
        );
        const overStageIndex = prev.findIndex((s) =>
          s.opportunities.some((opp) => opp.id === overId),
        );

        if (activeStageIndex === -1 || overStageIndex === -1) return prev;

        const newStages = [...prev];
        const activeStage = newStages[activeStageIndex];
        const overStage = newStages[overStageIndex];

        const activeOppIndex = activeStage.opportunities.findIndex((opp) => opp.id === activeId);
        const overOppIndex = overStage.opportunities.findIndex((opp) => opp.id === overId);

        if (activeStageIndex === overStageIndex) {
          // Same column reorder
          activeStage.opportunities = arrayMove(
            activeStage.opportunities,
            activeOppIndex,
            overOppIndex,
          );
        } else {
          // Move to different column
          const [movedOpp] = activeStage.opportunities.splice(activeOppIndex, 1);
          movedOpp.stageId = overStage.id;
          overStage.opportunities.splice(overOppIndex, 0, movedOpp);
        }

        return newStages;
      });
    }

    // Dropping a Task over an empty Column
    if (isActiveTask && isOverColumn) {
      setStages((prev) => {
        const activeStageIndex = prev.findIndex((s) =>
          s.opportunities.some((opp) => opp.id === activeId),
        );
        const overStageIndex = prev.findIndex((s) => s.id === overId);

        if (activeStageIndex === -1 || overStageIndex === -1) return prev;

        const newStages = [...prev];
        const activeStage = newStages[activeStageIndex];
        const overStage = newStages[overStageIndex];

        const activeOppIndex = activeStage.opportunities.findIndex((opp) => opp.id === activeId);
        const [movedOpp] = activeStage.opportunities.splice(activeOppIndex, 1);
        movedOpp.stageId = overStage.id;
        overStage.opportunities.push(movedOpp);

        return newStages;
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    // The state is already optimistically updated in onDragOver
    // Now we need to calculate the new fractional position and save to DB
    const activeId = active.id as string;

    let targetStage: PipelineStageColumnType | undefined;
    let targetIndex = -1;

    for (const stage of stages) {
      const index = stage.opportunities.findIndex((o) => o.id === activeId);
      if (index !== -1) {
        targetStage = stage;
        targetIndex = index;
        break;
      }
    }

    if (!targetStage) return;

    // Calculate fractional position
    const opps = targetStage.opportunities;
    let newPosition = 1000;

    if (opps.length === 1) {
      newPosition = 1000; // First item in column
    } else if (targetIndex === 0) {
      // Moved to very top
      newPosition = Number(opps[1].position) - 1000;
    } else if (targetIndex === opps.length - 1) {
      // Moved to very bottom
      newPosition = Number(opps[targetIndex - 1].position) + 1000;
    } else {
      // Moved between two items
      const prevPos = Number(opps[targetIndex - 1].position);
      const nextPos = Number(opps[targetIndex + 1].position);
      newPosition = (prevPos + nextPos) / 2;
    }

    // Server Action
    try {
      await moveOpportunity(activeId, targetStage.id, newPosition);
    } catch (err) {
      console.error("Failed to move opportunity", err);
      // In a real app, we might want to revert the optimistic update here or show a toast
    }
  };

  async function handleCreateOpportunity(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const companyId = formData.get("companyId") as string;
    const contactId = formData.get("contactId") as string;
    const stageId = formData.get("stageId") as string;
    const estimatedValueStr = formData.get("estimatedValue") as string;
    const temperature = formData.get("temperature") as string;

    try {
      const newOpp = await createOpportunity({
        pipelineId,
        title,
        companyId: companyId || undefined,
        primaryContactId: contactId || undefined,
        stageId,
        estimatedValue: estimatedValueStr ? estimatedValueStr : undefined,
        temperature: temperature || undefined,
      });

      // Optimistically add to UI
      setStages((prev) => {
        const newStages = [...prev];
        const stageIndex = newStages.findIndex((s) => s.id === stageId);
        if (stageIndex !== -1) {
          // We mock the full structure for UI
          const selectedCompanyName = companies.find((c) => c.id === companyId)?.name;
          const selectedContactName = contacts.find((c) => c.id === contactId)?.name;
          const [contactFirstName, ...contactLastNameParts] = selectedContactName?.split(" ") ?? [];

          newStages[stageIndex].opportunities.push({
            id: newOpp.id,
            title: newOpp.title,
            company: selectedCompanyName ? { tradeName: selectedCompanyName } : null,
            primaryContact: contactFirstName
              ? {
                  firstName: contactFirstName,
                  lastName: contactLastNameParts.length ? contactLastNameParts.join(" ") : null,
                }
              : null,
            estimatedValue: newOpp.estimatedValue,
            position: newOpp.position.toString(),
            stageId: newOpp.stageId,
            nextActionAt: null,
            nextActionDescription: null,
            temperature: newOpp.temperature,
            owner: null,
            productName: null,
            activitiesCount: 0,
            openTasksCount: 0,
          });
          newStages[stageIndex].valueTotal += Number(newOpp.estimatedValue);
        }
        return newStages;
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao criar oportunidade.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="mb-4 flex items-center gap-1 border-b border-slate-200 shrink-0">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium border-b-2 border-orange-600 text-orange-600"
        >
          Comercial
        </button>
        <button
          type="button"
          disabled
          title="Em breve"
          className="px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
        >
          Parcerias
        </button>
        <button
          type="button"
          disabled
          title="Novo funil (em breve)"
          className="px-3 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
        >
          +
        </button>
      </div>

      <div className="mb-4 flex items-center gap-6 text-sm text-slate-600 shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {summary.openCount} oportunidades
        </span>
        <span>
          Valor do funil{" "}
          <strong className="text-slate-900">{formatCurrency(summary.pipelineValue)}</strong>
        </span>
        <span>
          Previsão ponderada{" "}
          <strong className="text-slate-900">{formatCurrency(summary.weightedForecast)}</strong>
        </span>
      </div>

      <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <select
            value={temperatureFilter}
            onChange={(e) => setTemperatureFilter(e.target.value)}
            className="text-sm px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-700"
          >
            <option value="all">Todas temperaturas</option>
            <option value="hot">Quente</option>
            <option value="warm">Morna</option>
            <option value="cold">Fria</option>
          </select>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="text-sm px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-700"
          >
            <option value="all">Todos responsáveis</option>
            {owners.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-700"
          >
            <option value="position">Ordem do funil</option>
            <option value="value_desc">Maior valor</option>
            <option value="next_action">Próxima ação</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Nova Oportunidade
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 h-[calc(100vh-300px)]">
        {/* We use SortableContext here so columns themselves could be sortable if we wanted,
            but for now we just map through them. */}
        {visibleStages.map((stage) => (
          <KanbanColumn key={stage.id} column={stage} />
        ))}
      </div>

      <DragOverlay>{activeCard ? <KanbanCard opportunity={activeCard} /> : null}</DragOverlay>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Nova Oportunidade</h2>
                <p className="text-slate-500 text-sm mt-1">Adicione um novo negócio ao funil.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="oppForm" onSubmit={handleCreateOpportunity} className="space-y-4">
                <div>
                  <label
                    htmlFor="opp-title"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Título do Negócio *
                  </label>
                  <input
                    id="opp-title"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    placeholder="Ex: Consultoria - Empresa XYZ"
                  />
                </div>

                <div>
                  <label
                    htmlFor="opp-companyId"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Empresa
                  </label>
                  <select
                    id="opp-companyId"
                    name="companyId"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:border-orange-500 outline-none"
                  >
                    <option value="">-- Selecione uma empresa --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="opp-contactId"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Contato Principal
                  </label>
                  <select
                    id="opp-contactId"
                    name="contactId"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:border-orange-500 outline-none"
                  >
                    <option value="">-- Selecione um contato --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="opp-stageId"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Etapa Inicial *
                  </label>
                  <select
                    id="opp-stageId"
                    name="stageId"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:border-orange-500 outline-none"
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="opp-estimatedValue"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Valor Estimado (R$)
                  </label>
                  <input
                    id="opp-estimatedValue"
                    name="estimatedValue"
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label
                    htmlFor="opp-temperature"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Temperatura
                  </label>
                  <select
                    id="opp-temperature"
                    name="temperature"
                    defaultValue="warm"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:border-orange-500 outline-none"
                  >
                    <option value="hot">Quente</option>
                    <option value="warm">Morno</option>
                    <option value="cold">Frio</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="oppForm"
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}
