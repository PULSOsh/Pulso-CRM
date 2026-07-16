"use client";

import { Check, ChevronRight, Clock3, Download, MessageCircle, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function PublicProposal({ token }: { token: string }) {
  const [response, setResponse] = useState<"accepted" | "changes" | null>(null);

  if (response) {
    return (
      <main className="proposal-response-page">
        <Image
          src="/brand/pulso_horizontal_signal_carbon.svg"
          alt="PULSO"
          width={170}
          height={44}
        />
        <div className="success-mark">
          <Check aria-hidden="true" />
        </div>
        <p className="eyebrow">PROPOSTA 01/2026</p>
        <h1>{response === "accepted" ? "Proposta aceita." : "Solicitação enviada."}</h1>
        <p>
          {response === "accepted"
            ? "A PULSO recebeu sua confirmação e organizará contrato, pagamento e início do projeto."
            : "A PULSO recebeu seus comentários e retornará com os próximos passos ou uma nova versão."}
        </p>
      </main>
    );
  }

  return (
    <main className="public-proposal">
      <header className="proposal-public-header">
        <Image
          src="/brand/pulso_horizontal_signal_carbon.svg"
          alt="PULSO"
          width={155}
          height={38}
        />
        <nav>
          <a href="#contexto">Contexto</a>
          <a href="#escopo">Escopo</a>
          <a href="#investimento">Investimento</a>
        </nav>
        <button type="button" className="secondary-button">
          <Download aria-hidden="true" /> PDF
        </button>
      </header>

      <section className="proposal-hero">
        <div>
          <p className="eyebrow">
            PROPOSTA COMERCIAL · 01/2026 · {token.slice(0, 8).toUpperCase()}
          </p>
          <h1>Um site próprio para o Studio Aura crescer além do Instagram.</h1>
          <p>
            Uma presença digital profissional, simples de usar e preparada para transformar visitas
            em conversas.
          </p>
          <div className="proposal-validity">
            <Clock3 aria-hidden="true" /> Válida até 26 de julho de 2026
          </div>
        </div>
        <aside>
          <span>PREPARADA PARA</span>
          <strong>Studio Aura</strong>
          <small>Marina Alves</small>
        </aside>
      </section>

      <section className="proposal-section" id="contexto">
        <p className="eyebrow">01 · CONTEXTO ENTENDIDO</p>
        <div className="proposal-two-columns">
          <h2>Hoje, o Instagram concentra toda a presença digital do negócio.</h2>
          <p>
            Isso limita a apresentação dos serviços, dispersa informações e dificulta que novos
            clientes encontrem uma experiência organizada. O novo site será a base própria do Studio
            Aura na internet.
          </p>
        </div>
      </section>

      <section className="proposal-dark-section" id="escopo">
        <div>
          <p className="eyebrow">02 · SOLUÇÃO RECOMENDADA</p>
          <h2>Site institucional completo</h2>
          <p>
            Estratégia, conteúdo, design responsivo e desenvolvimento reunidos em uma entrega única.
          </p>
        </div>
        <ul>
          <li>
            <Check aria-hidden="true" /> Página inicial estratégica
          </li>
          <li>
            <Check aria-hidden="true" /> Apresentação dos serviços
          </li>
          <li>
            <Check aria-hidden="true" /> Sobre a marca e diferenciais
          </li>
          <li>
            <Check aria-hidden="true" /> Contato integrado ao WhatsApp
          </li>
          <li>
            <Check aria-hidden="true" /> Configuração técnica e publicação
          </li>
        </ul>
      </section>

      <section className="proposal-section timeline-section">
        <p className="eyebrow">03 · CRONOGRAMA</p>
        <h2>Uma construção em quatro etapas.</h2>
        <div className="timeline-grid">
          <article>
            <span>01</span>
            <strong>Diagnóstico e conteúdo</strong>
            <small>Organização de materiais e estrutura.</small>
          </article>
          <article>
            <span>02</span>
            <strong>Design</strong>
            <small>Direção visual e experiência.</small>
          </article>
          <article>
            <span>03</span>
            <strong>Desenvolvimento</strong>
            <small>Implementação responsiva.</small>
          </article>
          <article>
            <span>04</span>
            <strong>Publicação</strong>
            <small>Revisão, domínio e entrega.</small>
          </article>
        </div>
      </section>

      <section className="investment-section" id="investimento">
        <div>
          <p className="eyebrow">04 · INVESTIMENTO</p>
          <h2>R$ 2.500</h2>
          <p>50% para iniciar e 50% antes da publicação.</p>
        </div>
        <div className="investment-actions">
          <button type="button" className="accept-button" onClick={() => setResponse("accepted")}>
            Aceitar proposta <ChevronRight aria-hidden="true" />
          </button>
          <button type="button" className="change-button" onClick={() => setResponse("changes")}>
            <MessageCircle aria-hidden="true" /> Solicitar alteração
          </button>
          <small>
            <ShieldCheck aria-hidden="true" /> Sua resposta será registrada com a versão desta
            proposta.
          </small>
        </div>
      </section>

      <footer className="proposal-footer">
        <Image src="/brand/pulso_horizontal_signal_white.svg" alt="PULSO" width={145} height={36} />
        <span>Tecnologia para novas possibilidades.</span>
      </footer>
    </main>
  );
}
