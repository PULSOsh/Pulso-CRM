"use client";

import { ChevronDown, Eye, FileText, GripVertical, Plus, Save, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const initialBlocks = [
  { id: "context", label: "Contexto entendido", enabled: true },
  { id: "solution", label: "Solução recomendada", enabled: true },
  { id: "scope", label: "Escopo e entregáveis", enabled: true },
  { id: "timeline", label: "Cronograma", enabled: true },
  { id: "investment", label: "Investimento", enabled: true },
  { id: "terms", label: "Condições e validade", enabled: true },
];

export function ProposalBuilder() {
  const [source, setSource] = useState("briefing");
  const [discount, setDiscount] = useState(0);
  const [blocks, setBlocks] = useState(initialBlocks);
  const subtotal = 2500;
  const total = useMemo(() => subtotal - discount, [discount]);

  return (
    <div className="proposal-builder-layout">
      <section className="proposal-editor">
        <div className="builder-topline">
          <div>
            <p className="eyebrow">NOVO ORÇAMENTO</p>
            <h2>Transforme dados em uma proposta clara.</h2>
          </div>
          <div className="toolbar-group">
            <button type="button" className="secondary-button">
              <Save aria-hidden="true" /> Salvar rascunho
            </button>
            <Link className="secondary-button link-button" href="/proposta/demo-pulso">
              <Eye aria-hidden="true" /> Visualizar
            </Link>
            <button type="button" className="primary-button">
              <Send aria-hidden="true" /> Publicar
            </button>
          </div>
        </div>

        <article className="builder-card">
          <header>
            <span>1</span>
            <div>
              <strong>Origem dos dados</strong>
              <small>Comece por um briefing, oportunidade ou cadastro manual.</small>
            </div>
          </header>
          <div className="source-options">
            <button
              type="button"
              onClick={() => setSource("briefing")}
              className={source === "briefing" ? "selected" : ""}
            >
              <FileText aria-hidden="true" />
              <strong>Usar briefing</strong>
              <span>Importar respostas e anexos</span>
            </button>
            <button
              type="button"
              onClick={() => setSource("opportunity")}
              className={source === "opportunity" ? "selected" : ""}
            >
              <Sparkles aria-hidden="true" />
              <strong>Usar oportunidade</strong>
              <span>Importar dados do CRM</span>
            </button>
            <button
              type="button"
              onClick={() => setSource("manual")}
              className={source === "manual" ? "selected" : ""}
            >
              <Plus aria-hidden="true" />
              <strong>Preencher manualmente</strong>
              <span>Criar do zero</span>
            </button>
          </div>
          {source === "briefing" && (
            <label className="field">
              <span>Briefing selecionado</span>
              <select>
                <option>BRF-2026-0042 · Studio Aura · Site Essencial</option>
                <option>BRF-2026-0041 · Clínica Horizonte · Landing Page</option>
              </select>
            </label>
          )}
          {source === "opportunity" && (
            <label className="field">
              <span>Oportunidade selecionada</span>
              <select>
                <option>Site institucional · Nexo Consultoria</option>
                <option>Automação comercial · Horizonte Saúde</option>
              </select>
            </label>
          )}
          {source === "manual" && (
            <div className="field-grid">
              <label className="field">
                <span>Cliente</span>
                <input placeholder="Selecione ou cadastre" />
              </label>
              <label className="field">
                <span>Empresa</span>
                <input placeholder="Nome da empresa" />
              </label>
            </div>
          )}
        </article>

        <article className="builder-card">
          <header>
            <span>2</span>
            <div>
              <strong>Cliente e contexto</strong>
              <small>Os dados importados podem ser revisados antes da publicação.</small>
            </div>
          </header>
          <div className="field-grid">
            <label className="field">
              <span>Cliente</span>
              <input defaultValue="Marina Alves" />
            </label>
            <label className="field">
              <span>Empresa</span>
              <input defaultValue="Studio Aura" />
            </label>
          </div>
          <label className="field">
            <span>Contexto entendido</span>
            <textarea
              rows={5}
              defaultValue="O Studio Aura precisa substituir uma presença digital dependente apenas do Instagram por um site próprio, profissional e preparado para receber contatos."
            />
          </label>
          <div className="origin-note">Origem: briefing BRF-2026-0042 · editado manualmente</div>
        </article>

        <article className="builder-card">
          <header>
            <span>3</span>
            <div>
              <strong>Produtos e investimento</strong>
              <small>O servidor deverá recalcular todos os valores na implementação final.</small>
            </div>
          </header>
          <div className="proposal-item-row">
            <div>
              <strong>Site Institucional</strong>
              <small>Estrutura completa com até 6 páginas</small>
            </div>
            <span>1</span>
            <strong>R$ 2.500,00</strong>
            <button type="button">•••</button>
          </div>
          <button type="button" className="text-action">
            <Plus aria-hidden="true" /> Adicionar produto ou adicional
          </button>
          <div className="totals-box">
            <div>
              <span>Subtotal</span>
              <strong>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
            </div>
            <label>
              <span>Desconto</span>
              <input
                type="number"
                min={0}
                max={subtotal}
                value={discount}
                onChange={(event) => setDiscount(Number(event.target.value))}
              />
            </label>
            <div className="total-line">
              <span>Total</span>
              <strong>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </article>

        <article className="builder-card">
          <header>
            <span>4</span>
            <div>
              <strong>Blocos da proposta</strong>
              <small>Ative, desative e reordene as seções do site.</small>
            </div>
          </header>
          <div className="block-list">
            {blocks.map((block) => (
              <div className="block-row" key={block.id}>
                <GripVertical aria-hidden="true" />
                <input
                  type="checkbox"
                  checked={block.enabled}
                  onChange={() =>
                    setBlocks((current) =>
                      current.map((item) =>
                        item.id === block.id ? { ...item, enabled: !item.enabled } : item,
                      ),
                    )
                  }
                />
                <strong>{block.label}</strong>
                <button type="button" aria-label={`Editar ${block.label}`}>
                  <ChevronDown aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="text-action">
            <Plus aria-hidden="true" /> Adicionar bloco
          </button>
        </article>
      </section>

      <aside className="proposal-preview-card">
        <div className="preview-browser">
          <span />
          <span />
          <span />
          <small>proposta.pulso.cloud/p/demo</small>
        </div>
        <div className="mini-proposal">
          <p className="eyebrow">PROPOSTA COMERCIAL · 01/2026</p>
          <h3>Um site próprio para o Studio Aura crescer além do Instagram.</h3>
          <p>Estratégia, design e tecnologia reunidos em uma presença digital profissional.</p>
          <div className="mini-divider" />
          <small>INVESTIMENTO</small>
          <strong>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
          <button type="button">Aceitar proposta</button>
        </div>
        <div className="preview-meta">
          <span>6 blocos ativos</span>
          <span>Validade: 10 dias</span>
          <span>Versão: rascunho</span>
        </div>
      </aside>
    </div>
  );
}
