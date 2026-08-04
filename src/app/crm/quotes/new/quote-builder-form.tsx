"use client";

import { FileText, Loader2, Plus, Save, Send, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type CSSProperties, useMemo, useState, useTransition } from "react";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getBriefingSummaryForOpportunity } from "@/server/actions/briefing-submissions";
import type { getProducts } from "@/server/actions/products";
import type { getOpenOpportunities } from "@/server/actions/quotes";
import { createQuote, publishQuote, type QuoteItemInput } from "@/server/actions/quotes";

function defaultValidUntil() {
  const d = new Date();
  d.setDate(d.getDate() + 10);
  return d.toISOString().slice(0, 10);
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const itemInputStyle: CSSProperties = {
  width: "100%",
  height: "34px",
  padding: "0 8px",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: "11px",
};

export default function QuoteBuilderForm({
  opportunities,
  products,
}: {
  opportunities: Awaited<ReturnType<typeof getOpenOpportunities>>;
  products: Awaited<ReturnType<typeof getProducts>>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [opportunityId, setOpportunityId] = useState("");
  const [title, setTitle] = useState("Proposta Comercial");
  const [scope, setScope] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<QuoteItemInput[]>([]);
  const [validUntil, setValidUntil] = useState(defaultValidUntil);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [paymentDescription, setPaymentDescription] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [installmentCount, setInstallmentCount] = useState("1");
  const [notIncludedEnabled, setNotIncludedEnabled] = useState(false);
  const [notIncludedText, setNotIncludedText] = useState("");
  const [responsibilitiesEnabled, setResponsibilitiesEnabled] = useState(false);
  const [responsibilitiesText, setResponsibilitiesText] = useState("");
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [briefingNotice, setBriefingNotice] = useState<string | null>(null);

  const selectedOpportunity = useMemo(
    () => opportunities.find((opp) => opp.id === opportunityId) ?? null,
    [opportunities, opportunityId],
  );

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const totalDiscount = items.reduce((acc, item) => acc + Number(item.discount), 0);
  const total = subtotal - totalDiscount;

  const entryAmountNumber = Number(entryAmount || 0);
  const installmentCountNumber = Number(installmentCount || 0);
  const remainingAfterEntry = Math.max(total - entryAmountNumber, 0);
  const installmentAmountComputed =
    installmentCountNumber > 0 ? remainingAfterEntry / installmentCountNumber : 0;

  function handleAddProduct(productId: string) {
    if (!productId) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setItems([
      ...items,
      {
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: Number(product.basePrice),
        discount: 0,
      },
    ]);

    if (!scope && product.scopeDefault) setScope(product.scopeDefault);
    if (!terms && product.termsDefault) setTerms(product.termsDefault);
  }

  async function handleGenerateScopeFromBriefing() {
    if (!opportunityId) return;
    setLoadingBriefing(true);
    setBriefingNotice(null);
    try {
      const result = await getBriefingSummaryForOpportunity(opportunityId);
      if (!result?.summary) {
        setBriefingNotice("Esta oportunidade não tem briefing vinculado com respostas.");
        return;
      }
      setScope(result.summary);
      setBriefingNotice(`Escopo preenchido a partir do briefing ${result.protocol}.`);
    } catch (err) {
      setBriefingNotice(err instanceof Error ? err.message : "Erro ao buscar briefing.");
    } finally {
      setLoadingBriefing(false);
    }
  }

  function handleRemoveItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function handleItemChange(index: number, field: keyof QuoteItemInput, value: string | number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  function validate() {
    if (!opportunityId) {
      setError("Selecione uma oportunidade para vincular o orçamento.");
      return false;
    }
    if (items.length === 0) {
      setError("Adicione pelo menos um item ao orçamento.");
      return false;
    }
    setError(null);
    return true;
  }

  function buildPayload() {
    return {
      opportunityId,
      title,
      scope,
      terms,
      items,
      validUntil,
      blocks: [
        {
          stableKey: "not_included" as const,
          title: "O que não está incluso",
          body: notIncludedText,
          isEnabled: notIncludedEnabled,
        },
        {
          stableKey: "responsibilities" as const,
          title: "Responsabilidades do cliente",
          body: responsibilitiesText,
          isEnabled: responsibilitiesEnabled,
        },
      ],
      paymentPlan: paymentEnabled
        ? {
            name: "Condição de pagamento",
            description: paymentDescription,
            entryAmount: entryAmountNumber,
            installmentCount: installmentCountNumber,
            installmentAmount: installmentAmountComputed,
          }
        : null,
    };
  }

  function handleSaveDraft() {
    if (!validate()) return;
    startTransition(async () => {
      const result = await createQuote(buildPayload());
      router.push(`/crm/quotes/${result.proposalId}`);
    });
  }

  function handlePublish() {
    if (!validate()) return;
    startTransition(async () => {
      const result = await createQuote(buildPayload());
      await publishQuote(result.proposalId);
      router.push(`/crm/quotes/${result.proposalId}`);
    });
  }

  return (
    <div className="proposal-builder-layout">
      <div className="proposal-editor">
        <div className="page-heading">
          <div>
            <p className="eyebrow">NOVO ORÇAMENTO</p>
            <h2>Transforme dados em uma proposta clara.</h2>
          </div>
          <div className="toolbar-group" style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="secondary-button"
              disabled={isPending}
              onClick={handleSaveDraft}
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar rascunho
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled
              title="Salve o rascunho para visualizar os detalhes completos."
            >
              Visualizar
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={isPending}
              onClick={handlePublish}
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Publicar
            </button>
          </div>
        </div>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: "13px", fontWeight: 600 }}>{error}</p>
        )}

        <div className="builder-card">
          <header>
            <span>1</span>
            <div>
              <strong>Origem dos dados</strong>
              <small>Comece por uma oportunidade em aberto.</small>
            </div>
          </header>

          <div className="source-options">
            <button type="button" className="selected">
              <Sparkles />
              <strong>Usar oportunidade</strong>
              <span>Importar dados do CRM</span>
            </button>
            <button type="button" disabled title="Em breve">
              <FileText />
              <strong>Usar briefing</strong>
              <span>Em breve</span>
            </button>
            <button type="button" disabled title="Em breve">
              <Plus />
              <strong>Preencher manualmente</strong>
              <span>Em breve</span>
            </button>
          </div>

          <label className="field" htmlFor="opportunityId">
            <span>Oportunidade</span>
            <Select
              id="opportunityId"
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
              required
            >
              <option value="">Selecione uma oportunidade...</option>
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.company?.tradeName || opp.contact?.firstName || "Cliente"} — {opp.title}
                </option>
              ))}
            </Select>
          </label>

          {selectedOpportunity && (
            <p className="origin-note">Origem: oportunidade {selectedOpportunity.title}</p>
          )}
        </div>

        <div className="builder-card">
          <header>
            <span>2</span>
            <div>
              <strong>Cliente e contexto</strong>
              <small>Os dados importados podem ser revisados antes da publicação.</small>
            </div>
          </header>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <label className="field">
              <span>Cliente</span>
              <input
                type="text"
                readOnly
                value={selectedOpportunity?.contact?.firstName ?? ""}
                placeholder="Selecione uma oportunidade"
              />
            </label>
            <label className="field">
              <span>Empresa</span>
              <input
                type="text"
                readOnly
                value={selectedOpportunity?.company?.tradeName ?? ""}
                placeholder="Selecione uma oportunidade"
              />
            </label>
          </div>

          <label className="field" style={{ marginTop: "14px" }}>
            <span>Título da proposta</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>

          <label className="field" htmlFor="scope" style={{ marginTop: "14px" }}>
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Contexto entendido / Escopo
              <button
                type="button"
                onClick={handleGenerateScopeFromBriefing}
                disabled={!opportunityId || loadingBriefing}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--signal)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {loadingBriefing ? "Buscando..." : "Gerar do briefing"}
              </button>
            </span>
            <Textarea
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              rows={6}
              placeholder="Descreva o que o cliente precisa e o que está incluso no projeto."
            />
            {briefingNotice && (
              <small style={{ color: "var(--mineral)" }}>{briefingNotice}</small>
            )}
          </label>
        </div>

        <div className="builder-card">
          <header>
            <span>3</span>
            <div>
              <strong>Produtos e investimento</strong>
              <small>O cliente deverá reconhecer todos os valores na proposta final.</small>
            </div>
          </header>

          <div className="block-list">
            {items.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--mineral)" }}>
                Nenhum item adicionado. Use o catálogo abaixo para puxar os valores.
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={index.toString() + item.description}
                  className="proposal-item-row"
                  style={{
                    gridTemplateColumns: "1fr 60px 110px 90px 110px 30px",
                    padding: "0 4px",
                  }}
                >
                  <div>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      style={itemInputStyle}
                    />
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                    style={itemInputStyle}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, "unitPrice", Number(e.target.value))}
                    style={itemInputStyle}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.discount}
                    onChange={(e) => handleItemChange(index, "discount", Number(e.target.value))}
                    style={{ ...itemInputStyle, color: "var(--danger)" }}
                  />
                  <strong>{currency.format(item.quantity * item.unitPrice - item.discount)}</strong>
                  <button type="button" onClick={() => handleRemoveItem(index)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "14px" }}>
            <Select
              onChange={(e) => {
                handleAddProduct(e.target.value);
                e.target.value = "";
              }}
              style={{ maxWidth: "320px" }}
            >
              <option value="">+ Adicionar do catálogo...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({currency.format(Number(p.basePrice))})
                </option>
              ))}
            </Select>
            <button
              type="button"
              className="text-action"
              style={{ marginTop: 0 }}
              onClick={() =>
                setItems([
                  ...items,
                  { description: "Item personalizado", quantity: 1, unitPrice: 0, discount: 0 },
                ])
              }
            >
              <Plus /> Item manual
            </button>
          </div>

          <div className="totals-box">
            <div>
              <span>Subtotal</span>
              <span>{currency.format(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div>
                <span>Descontos</span>
                <span>-{currency.format(totalDiscount)}</span>
              </div>
            )}
            <div className="total-line">
              <span>Total Estimado</span>
              <strong>{currency.format(total)}</strong>
            </div>
          </div>
        </div>

        <div className="builder-card">
          <header>
            <span>4</span>
            <div>
              <strong>Termos e condições</strong>
              <small>Garantia, prazos de entrega e observações gerais.</small>
            </div>
          </header>
          <Textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={5}
            placeholder="15 dias de garantia para correções relacionadas ao escopo aprovado..."
          />
        </div>

        <div className="builder-card">
          <header>
            <span>5</span>
            <div>
              <strong>Validade e pagamento</strong>
              <small>Por quanto tempo a proposta vale e como o cliente paga.</small>
            </div>
          </header>

          <label className="field" htmlFor="validUntil">
            <span>Válida até</span>
            <input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              fontSize: 13,
              fontWeight: 750,
            }}
          >
            <input
              type="checkbox"
              checked={paymentEnabled}
              onChange={(e) => setPaymentEnabled(e.target.checked)}
              style={{ accentColor: "var(--signal)" }}
            />
            Definir condição de pagamento estruturada
          </label>

          {paymentEnabled && (
            <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <label className="field">
                  <span>Entrada (R$)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    placeholder="0,00"
                  />
                </label>
                <label className="field">
                  <span>Parcelas restantes</span>
                  <input
                    type="number"
                    min="1"
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(e.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span>Descrição da condição</span>
                <input
                  type="text"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="Ex: 50% na aprovação, 50% na entrega"
                />
              </label>
              {entryAmountNumber > 0 || installmentCountNumber > 0 ? (
                <p className="origin-note">
                  Entrada de {currency.format(entryAmountNumber)} + {installmentCountNumber}
                  {installmentCountNumber === 1 ? " parcela" : " parcelas"} de{" "}
                  {currency.format(installmentAmountComputed)}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="builder-card">
          <header>
            <span>6</span>
            <div>
              <strong>O que não está incluso</strong>
              <small>Deixe claro o limite do escopo pra evitar mal-entendido depois.</small>
            </div>
          </header>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              fontSize: 13,
              fontWeight: 750,
            }}
          >
            <input
              type="checkbox"
              checked={notIncludedEnabled}
              onChange={(e) => setNotIncludedEnabled(e.target.checked)}
              style={{ accentColor: "var(--signal)" }}
            />
            Incluir esta seção na proposta
          </label>
          {notIncludedEnabled && (
            <Textarea
              value={notIncludedText}
              onChange={(e) => setNotIncludedText(e.target.value)}
              rows={4}
              placeholder={
                "Integrações automáticas não previstas no escopo\nAplicativos nativos para Android e iOS\nMigração de bases antigas"
              }
            />
          )}
        </div>

        <div className="builder-card">
          <header>
            <span>7</span>
            <div>
              <strong>Responsabilidades do cliente</strong>
              <small>O que o cliente precisa fornecer ou aprovar.</small>
            </div>
          </header>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              fontSize: 13,
              fontWeight: 750,
            }}
          >
            <input
              type="checkbox"
              checked={responsibilitiesEnabled}
              onChange={(e) => setResponsibilitiesEnabled(e.target.checked)}
              style={{ accentColor: "var(--signal)" }}
            />
            Incluir esta seção na proposta
          </label>
          {responsibilitiesEnabled && (
            <Textarea
              value={responsibilitiesText}
              onChange={(e) => setResponsibilitiesText(e.target.value)}
              rows={4}
              placeholder={
                "Fornecimento de logo, cores, textos e informações do negócio\nAprovação das etapas dentro do cronograma"
              }
            />
          )}
        </div>
      </div>

      <aside className="proposal-preview-card">
        <div className="preview-browser">
          <span />
          <span />
          <span />
          <small>proposta.pulso.cloud/p/rascunho</small>
        </div>
        <div className="mini-proposal">
          <p className="eyebrow">
            PROPOSTA COMERCIAL ·{" "}
            {new Intl.DateTimeFormat("pt-BR", { month: "2-digit", year: "numeric" }).format(
              new Date(),
            )}
          </p>
          <h3>{title || "Título da proposta"}</h3>
          <p>
            {scope
              ? scope.slice(0, 160)
              : "Descreva o contexto do cliente para gerar a prévia da proposta."}
          </p>
          <div className="mini-divider" />
          <small>INVESTIMENTO</small>
          <strong>{currency.format(total)}</strong>
          <button type="button" disabled>
            Aceitar proposta
          </button>
        </div>
        <div className="preview-meta">
          <span>
            {items.length} {items.length === 1 ? "bloco ativo" : "blocos ativos"}
          </span>
          <span>Válida até {new Date(`${validUntil}T00:00:00`).toLocaleDateString("pt-BR")}</span>
          <span>Versão: rascunho</span>
        </div>
      </aside>
    </div>
  );
}
