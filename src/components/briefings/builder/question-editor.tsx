"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type QuestionProps = {
  id: string;
  title: string;
  type: string;
  isRequired: boolean;
  onUpdate: (
    id: string,
    updates: Partial<Omit<QuestionProps, "id" | "onUpdate" | "onDelete">>,
  ) => void;
  onDelete: (id: string) => void;
};

export function QuestionEditor({ id, title, type, isRequired, onUpdate, onDelete }: QuestionProps) {
  return (
    <div className="p-4 mb-3 border border-slate-200 rounded-lg bg-white">
      <div className="flex items-center justify-between gap-3 mb-3">
        <Input
          type="text"
          value={title}
          onChange={(e) => onUpdate(id, { title: e.target.value })}
          placeholder="Título da pergunta..."
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDelete(id)}
          className="text-red-500 hover:bg-red-50 shrink-0"
        >
          <Trash2 size={20} />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={type}
          onChange={(e) => onUpdate(id, { type: e.target.value })}
          className="w-auto"
        >
          <option value="text">Texto Curto</option>
          <option value="textarea">Texto Longo</option>
          <option value="email">E-mail</option>
          <option value="phone">Telefone</option>
          <option value="select">Lista de Seleção</option>
          <option value="radio">Escolha Única (Radio)</option>
          <option value="checkbox">Múltipla Escolha</option>
          <option value="file">Upload de Arquivo</option>
        </Select>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => onUpdate(id, { isRequired: e.target.checked })}
          />
          Obrigatório
        </label>
      </div>
    </div>
  );
}
