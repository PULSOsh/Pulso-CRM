"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Building2, GripVertical, User } from "lucide-react";
import Link from "next/link";

export type OpportunityCardType = {
  id: string;
  title: string;
  company: { tradeName: string | null } | null;
  primaryContact: { firstName: string; lastName: string | null } | null;
  estimatedValue: string;
  position: string;
  stageId: string;
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
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {/* TODO: Add days in stage */}
            Novo
          </span>
        </div>
      </Link>
    </div>
  );
}
