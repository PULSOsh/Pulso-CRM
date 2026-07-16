"use client";

import { useMemo, useState } from "react";
import { initialOpportunities, type Opportunity, type StageId, stages } from "@/data/opportunities";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function KanbanBoard() {
  const [items, setItems] = useState<Opportunity[]>(initialOpportunities);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.value, 0), [items]);

  function move(stage: StageId) {
    if (!draggedId) return;
    setItems((current) =>
      current.map((item) => (item.id === draggedId ? { ...item, stage } : item)),
    );
    setDraggedId(null);
  }

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-group">
          <button type="button" className="secondary-button">
            Comercial
          </button>
          <button type="button" className="secondary-button">
            Parcerias
          </button>
        </div>
        <div className="toolbar-group">
          <button type="button" className="secondary-button">
            Filtros
          </button>
          <button type="button" className="secondary-button">
            Ordenar
          </button>
          <button type="button" className="primary-button">
            + Nova oportunidade
          </button>
        </div>
      </div>
      <div className="summary">
        <span>
          <strong>{items.length}</strong> oportunidades
        </span>
        <span>
          Valor do funil <strong>{money.format(total)}</strong>
        </span>
        <span>
          Previsão ponderada <strong>R$ 15.380</strong>
        </span>
      </div>
      <div className="board">
        {stages.map((stage) => {
          const stageItems = items.filter((item) => item.stage === stage.id);
          const stageTotal = stageItems.reduce((sum, item) => sum + item.value, 0);
          return (
            <fieldset
              key={stage.id}
              className="column"
              onDragOver={(event) => {
                event.preventDefault();
                event.currentTarget.classList.add("drag-over");
              }}
              onDragLeave={(event) => event.currentTarget.classList.remove("drag-over")}
              onDrop={(event) => {
                event.currentTarget.classList.remove("drag-over");
                move(stage.id);
              }}
            >
              <legend className="sr-only">Etapa {stage.name}</legend>
              <header
                className="column-header"
                style={{ "--stage-color": stage.color } as React.CSSProperties}
              >
                <span className="column-dot" />
                <h2>{stage.name}</h2>
                <span className="column-count">{stageItems.length}</span>
                <span className="column-total">{money.format(stageTotal)}</span>
              </header>
              <div className="cards">
                {stageItems.map((item) => (
                  <OpportunityCard
                    key={item.id}
                    item={item}
                    onDragStart={() => setDraggedId(item.id)}
                  />
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>
    </>
  );
}

function OpportunityCard({ item, onDragStart }: { item: Opportunity; onDragStart: () => void }) {
  return (
    <article
      className="opportunity"
      draggable
      onDragStart={(event) => {
        onDragStart();
        event.currentTarget.classList.add("dragging");
      }}
      onDragEnd={(event) => event.currentTarget.classList.remove("dragging")}
    >
      <div className="opportunity-top">
        <span className="tag">{item.product}</span>
        <span className="temperature">{item.temperature}</span>
      </div>
      <div>
        <h3>{item.title}</h3>
        <p className="client">{item.client}</p>
      </div>
      <strong className="value">{money.format(item.value)}</strong>
      <div className="next-action">↗ {item.nextAction}</div>
      <footer>
        <span className="owner">
          <span>{item.owner[0]}</span>
          {item.owner}
        </span>
        <span>◌ 2&nbsp;&nbsp;□ 1</span>
      </footer>
    </article>
  );
}
