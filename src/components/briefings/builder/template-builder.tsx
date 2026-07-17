"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Save } from "lucide-react";
import { useState } from "react";
import { QuestionEditor } from "./question-editor";

type Question = {
  id: string;
  title: string;
  type: string;
  isRequired: boolean;
};

// Sortable Wrapper Component
function SortableQuestion({
  question,
  onUpdate,
  onDelete,
}: {
  question: Question;
  onUpdate: (id: string, updates: Partial<Question>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Drag handle can be added here if needed, passing listeners to it. For simplicity we make the whole card draggable or just a handler on the side */}
      <div style={{ display: "flex", gap: "8px" }}>
        <div {...listeners} style={{ cursor: "grab", padding: "16px 0", color: "#94a3b8" }}>
          ⋮⋮
        </div>
        <div style={{ flex: 1 }}>
          <QuestionEditor
            id={question.id}
            title={question.title}
            type={question.type}
            isRequired={question.isRequired}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}

export function TemplateBuilder({ initialQuestions = [] }: { initialQuestions?: Question[] }) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q_${Date.now()}`,
        title: "",
        type: "text",
        isRequired: false,
      },
    ]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h2>Construtor de Perguntas</h2>
        <button
          type="button"
          className="primary-button"
          style={{ display: "flex", gap: "8px", alignItems: "center" }}
        >
          <Save size={16} /> Salvar Alterações
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions} strategy={verticalListSortingStrategy}>
          {questions.map((question) => (
            <SortableQuestion
              key={question.id}
              question={question}
              onUpdate={updateQuestion}
              onDelete={deleteQuestion}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={addQuestion}
        style={{
          width: "100%",
          padding: "16px",
          marginTop: "16px",
          border: "2px dashed #cbd5e1",
          borderRadius: "8px",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          color: "#64748b",
          fontWeight: "bold",
        }}
      >
        <Plus size={20} /> Adicionar Pergunta
      </button>
    </div>
  );
}
