"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QuestionRenderer, type SectionDef } from "./question-renderer";

type BriefingWizardProps = {
  templateSlug: string;
  templateId: string;
  sections: SectionDef[];
};

export function BriefingWizard({ templateSlug, templateId, sections }: BriefingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from local storage for MVP draft saving
  useEffect(() => {
    const saved = localStorage.getItem(`draft_${templateId}`);
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, [templateId]);

  // Save to local storage on change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`draft_${templateId}`, JSON.stringify(answers));
    }
  }, [answers, templateId]);

  const handleNext = () => {
    if (currentStep < sections.length - 1) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/briefing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, templateSlug, answers }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar briefing");
      }

      localStorage.removeItem(`draft_${templateId}`);
      router.push(`/solicitar/${templateSlug}/sucesso`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setIsSubmitting(false);
    }
  };

  const currentSection = sections[currentStep];
  const progress = ((currentStep + 1) / sections.length) * 100;

  return (
    <div className="public-form-panel">
      <div className="public-form-header">
        <div>
          <span>
            Etapa {currentStep + 1} de {sections.length}
          </span>
          <strong>{currentSection?.title}</strong>
        </div>
        <div className="public-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="public-form">
        <div className="form-intro">
          <p className="eyebrow">{currentSection?.title.toUpperCase()}</p>
          <h2>{currentSection?.description || currentSection?.title}</h2>
        </div>

        {error && (
          <div
            style={{
              padding: 14,
              borderRadius: 8,
              background: "#f8dddd",
              color: "var(--danger)",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {currentSection?.questions.map((q) => (
          <div className="field" key={q.id}>
            <span>
              {q.title} {q.isRequired && <span style={{ color: "var(--danger)" }}>*</span>}
            </span>
            <QuestionRenderer
              question={q}
              value={answers[q.id]}
              onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
            />
          </div>
        ))}

        <div className="public-form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handlePrev}
            disabled={currentStep === 0 || isSubmitting}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <ArrowLeft size={18} /> Voltar
          </button>

          <span>Rascunho salvo automaticamente</span>

          {currentStep === sections.length - 1 ? (
            <button
              type="button"
              className="primary-button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              Finalizar envio
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={handleNext}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              Continuar <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
