"use client";

import { ArrowLeft, ArrowRight, Check, Paperclip, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const steps = ["Seu negócio", "Objetivo", "Conteúdo", "Prazo e investimento"];

export function PublicBriefingForm({ slug }: { slug: string }) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <main className="public-success">
        <Image
          src="/brand/pulso_horizontal_signal_carbon.svg"
          alt="PULSO"
          width={170}
          height={44}
        />
        <div className="success-mark">
          <Check aria-hidden="true" />
        </div>
        <p className="eyebrow">BRF-2026-0043</p>
        <h1>Recebemos o seu briefing.</h1>
        <p>
          Agora a PULSO vai revisar suas respostas e organizar o próximo passo. Você receberá um
          retorno pelo canal informado.
        </p>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setStep(0);
            setSubmitted(false);
          }}
        >
          Voltar ao início
        </button>
      </main>
    );
  }

  return (
    <main className="public-briefing-layout">
      <aside className="public-briefing-brand">
        <Image src="/brand/pulso_horizontal_signal_white.svg" alt="PULSO" width={170} height={44} />
        <div>
          <p className="eyebrow">BRIEFING · {slug.replaceAll("-", " ").toUpperCase()}</p>
          <h1>Vamos entender antes de construir.</h1>
          <p>
            Suas respostas ajudam a PULSO a recomendar o produto, o escopo e o investimento mais
            coerentes para o seu momento.
          </p>
        </div>
        <div className="privacy-note">
          <ShieldCheck aria-hidden="true" />
          <span>Seus dados são usados apenas para analisar e responder esta solicitação.</span>
        </div>
      </aside>

      <section className="public-form-panel">
        <header className="public-form-header">
          <div>
            <span>
              Etapa {step + 1} de {steps.length}
            </span>
            <strong>{steps[step]}</strong>
          </div>
          <div className="public-progress">
            <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </header>

        <form
          className="public-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (step === steps.length - 1) setSubmitted(true);
            else setStep(step + 1);
          }}
        >
          {step === 0 && (
            <>
              <div className="form-intro">
                <p className="eyebrow">COMEÇANDO PELO CONTEXTO</p>
                <h2>Conte um pouco sobre você e seu negócio.</h2>
              </div>
              <label className="field">
                <span>Seu nome *</span>
                <input required placeholder="Como podemos chamar você?" />
              </label>
              <div className="field-grid">
                <label className="field">
                  <span>WhatsApp *</span>
                  <input required placeholder="(00) 00000-0000" />
                </label>
                <label className="field">
                  <span>E-mail *</span>
                  <input required type="email" placeholder="voce@empresa.com" />
                </label>
              </div>
              <label className="field">
                <span>Nome do negócio ou projeto *</span>
                <input required placeholder="Nome da empresa, marca ou ideia" />
              </label>
              <label className="field">
                <span>O negócio já possui site?</span>
                <select defaultValue="">
                  <option value="" disabled>
                    Selecione
                  </option>
                  <option>Não possui</option>
                  <option>Possui, mas precisa melhorar</option>
                  <option>Possui e quer uma nova solução</option>
                </select>
              </label>
            </>
          )}

          {step === 1 && (
            <>
              <div className="form-intro">
                <p className="eyebrow">O QUE PRECISA MUDAR</p>
                <h2>Qual resultado você espera alcançar?</h2>
              </div>
              <label className="field">
                <span>Principal objetivo *</span>
                <textarea
                  required
                  rows={5}
                  placeholder="Ex.: apresentar a empresa, captar contatos, vender um serviço..."
                />
              </label>
              <fieldset className="choice-field">
                <legend>O que mais importa agora?</legend>
                <label>
                  <input type="radio" name="priority" /> Ter presença profissional
                </label>
                <label>
                  <input type="radio" name="priority" /> Gerar mais contatos
                </label>
                <label>
                  <input type="radio" name="priority" /> Vender online
                </label>
                <label>
                  <input type="radio" name="priority" /> Organizar um processo
                </label>
              </fieldset>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-intro">
                <p className="eyebrow">MATERIAIS E REFERÊNCIAS</p>
                <h2>O que já existe e pode ser aproveitado?</h2>
              </div>
              <label className="field">
                <span>Identidade visual</span>
                <select>
                  <option>Já temos identidade completa</option>
                  <option>Temos apenas logo e cores</option>
                  <option>Ainda não temos</option>
                </select>
              </label>
              <label className="field">
                <span>Links de referência</span>
                <textarea
                  rows={4}
                  placeholder="Sites, perfis ou projetos que representam o estilo desejado"
                />
              </label>
              <button type="button" className="upload-box">
                <Paperclip aria-hidden="true" />
                <span>
                  <strong>Anexar materiais</strong>
                  <small>Logo, textos, fotos ou documentos. Até 20 MB.</small>
                </span>
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-intro">
                <p className="eyebrow">ÚLTIMA ETAPA</p>
                <h2>Prazo, investimento e observações finais.</h2>
              </div>
              <div className="field-grid">
                <label className="field">
                  <span>Quando gostaria de iniciar?</span>
                  <select>
                    <option>O quanto antes</option>
                    <option>Nos próximos 30 dias</option>
                    <option>Nos próximos 3 meses</option>
                    <option>Ainda estou pesquisando</option>
                  </select>
                </label>
                <label className="field">
                  <span>Faixa de investimento</span>
                  <select>
                    <option>Até R$ 1.200</option>
                    <option>R$ 1.200 a R$ 2.500</option>
                    <option>R$ 2.500 a R$ 5.000</option>
                    <option>Acima de R$ 5.000</option>
                    <option>Preciso de orientação</option>
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Algo importante que ainda não perguntamos?</span>
                <textarea rows={5} placeholder="Conte qualquer detalhe que ajude na análise" />
              </label>
              <label className="consent">
                <input required type="checkbox" />
                <span>
                  Autorizo o uso destes dados para análise da solicitação e contato sobre este
                  projeto.
                </span>
              </label>
            </>
          )}

          <footer className="public-form-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={step === 0}
              onClick={() => setStep(Math.max(0, step - 1))}
            >
              <ArrowLeft aria-hidden="true" /> Voltar
            </button>
            <span>Rascunho salvo automaticamente</span>
            <button type="submit" className="primary-button">
              {step === steps.length - 1 ? "Enviar briefing" : "Continuar"}
              <ArrowRight aria-hidden="true" />
            </button>
          </footer>
        </form>
      </section>
    </main>
  );
}
