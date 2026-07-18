"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Building2, Clock, GripVertical, User } from "lucide-react";
import Link from "next/link";

export type OpportunityCardType = {
  id: string;
  title: string;
  company: { tradeName: string | null } | null;
  primaryContact: { firstName: string; lastName: string | null } | null;
  estimatedValue: string;
  position: string;
  stageId: string;
  nextActionAt: string | null;
  nextActionDescription: string | null;
  temperature: string | null;
  owner: { name: string } | null;
};

const TEMPERATURE_STYLES: Record<string, string> = {
  hot: "bg-red-100 text-red-700",
  warm: "bg-amber-100 text-amber-700",
  cold: "bg-blue-100 text-blue-700",
};

const TEMPERATURE_LABELS: Record<string, string> = {
  hot: "Quente",
  warm: "Morno",
  cold: "Frio",
};

export function KanbanCard({ opportunity }: { opportunity: OpportunityCardType }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opportunity.id,
    data: {
      type: "Opportunity",
      opportunity,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayName =
    opportunity.company?.tradeName ||
    (opportunity.primaryContact
      ? `${opportunity.primaryContact.firstName} ${opportunity.primaryContact.lastName || ""}`
      : "Desconhecido");

  const isCompany = !!opportunity.company?.tradeName;

  const nextActionDate = opportunity.nextActionAt ? new Date(opportunity.nextActionAt) : null;
  const isOverdue = !!nextActionDate && nextActionDate.getTime() < Date.now();

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white border-2 border-orange-500 rounded-lg p-4 mb-3 opacity-50 h-32"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-slate-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow group relative"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={16} />
      </div>

      <Link href={`/crm/opportunities/${opportunity.id}`} className="block pr-6">
        <h4 className="font-medium text-slate-900 truncate mb-1">{opportunity.title}</h4>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          {isCompany ? <Building2 size={12} /> : <User size={12} />}
          <span className="truncate">{displayName}</span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm font-semibold text-slate-900">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(Number(opportunity.estimatedValue))}
          </span>
          <div className="flex items-center gap-2">
            {opportunity.temperature && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  TEMPERATURE_STYLES[opportunity.temperature] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {TEMPERATURE_LABELS[opportunity.temperature] ?? opportunity.temperature}
              </span>
            )}
            {opportunity.owner?.name && (
              <span
                title={opportunity.owner.name}
                className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0"
              >
                {opportunity.owner.name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {opportunity.nextActionDescription && (
          <div
            className={`flex items-center gap-1.5 text-[11px] mt-3 pt-3 border-t border-slate-100 ${
              isOverdue ? "text-red-600 font-medium" : "text-slate-500"
            }`}
          >
            <Clock size={12} />
            <span className="truncate">{opportunity.nextActionDescription}</span>
            {nextActionDate && (
              <span className="ml-auto shrink-0">
                {nextActionDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              </span>
            )}
          </div>
        )}
      </Link>
    </div>
  );
}
