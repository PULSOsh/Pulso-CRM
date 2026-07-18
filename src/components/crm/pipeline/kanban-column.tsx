"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard, type OpportunityCardType } from "./kanban-card";

export type PipelineStageColumnType = {
  id: string;
  name: string;
  color: string | null;
  opportunities: OpportunityCardType[];
  valueTotal: number;
};

export function KanbanColumn({ column }: { column: PipelineStageColumnType }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const opportunityIds = column.opportunities.map((opp) => opp.id);

  return (
    <div className="flex flex-col w-80 shrink-0 bg-slate-50/50 rounded-xl border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color || "#cbd5e1" }}
            />
            <h3 className="font-semibold text-slate-700 text-sm">{column.name}</h3>
          </div>
          <span className="bg-slate-200 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
            {column.opportunities.length}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
            column.valueTotal,
          )}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-3 min-h-[150px] transition-colors ${isOver ? "bg-slate-100/80" : ""}`}
      >
        <SortableContext items={opportunityIds} strategy={verticalListSortingStrategy}>
          {column.opportunities.map((opp) => (
            <KanbanCard key={opp.id} opportunity={opp} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
