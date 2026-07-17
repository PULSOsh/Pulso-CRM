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
import { useMemo, useState } from "react";
import { moveOpportunity } from "@/server/actions/pipeline";
import { KanbanCard, type OpportunityCardType } from "./kanban-card";
import { KanbanColumn, type PipelineStageColumnType } from "./kanban-column";

export function KanbanBoard({
  initialStages,
  userId,
  orgId,
}: {
  initialStages: PipelineStageColumnType[];
  userId: string;
  orgId: string;
}) {
  const [stages, setStages] = useState<PipelineStageColumnType[]>(initialStages);
  const [activeCard, setActiveCard] = useState<OpportunityCardType | null>(null);

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
      await moveOpportunity(activeId, targetStage.id, newPosition, userId, orgId);
    } catch (err) {
      console.error("Failed to move opportunity", err);
      // In a real app, we might want to revert the optimistic update here or show a toast
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-8 h-[calc(100vh-180px)]">
        {/* We use SortableContext here so columns themselves could be sortable if we wanted, 
            but for now we just map through them. */}
        {stages.map((stage) => (
          <KanbanColumn key={stage.id} column={stage} />
        ))}
      </div>

      <DragOverlay>{activeCard ? <KanbanCard opportunity={activeCard} /> : null}</DragOverlay>
    </DndContext>
  );
}
