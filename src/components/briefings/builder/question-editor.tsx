"use client";

import { Trash2 } from "lucide-react";

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
    <div
      className="card"
      style={{ padding: "16px", marginBottom: "12px", border: "1px solid #e2e8f0" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => onUpdate(id, { title: e.target.value })}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #cbd5e1",
            borderRadius: "4px",
          }}
          placeholder="Título da pergunta..."
        />
        <button
          type="button"
          onClick={() => onDelete(id)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#ef4444",
            marginLeft: "12px",
          }}
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <select
          value={type}
          onChange={(e) => onUpdate(id, { type: e.target.value })}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
        >
          <option value="text">Texto Curto</option>
          <option value="textarea">Texto Longo</option>
          <option value="email">E-mail</option>
          <option value="phone">Telefone</option>
          <option value="select">Lista de Seleção</option>
          <option value="radio">Escolha Única (Radio)</option>
          <option value="checkbox">Múltipla Escolha</option>
          <option value="file">Upload de Arquivo</option>
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
