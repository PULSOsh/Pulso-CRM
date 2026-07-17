"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type QuestionDef, QuestionRenderer } from "./question-renderer";

type SectionDef = {
  id: string;
  title: string;
  description?: string;
  questions: QuestionDef[];
};

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
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2">
        <div
          className="bg-orange-600 h-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-8">
        <div className="mb-8">
          <span className="text-sm font-semibold text-orange-600 mb-2 block">
            Etapa {currentStep + 1} de {sections.length}
          </span>
          <h2 className="text-2xl font-bold text-slate-900">{currentSection?.title}</h2>
          {currentSection?.description && (
            <p className="text-slate-500 mt-2">{currentSection.description}</p>
          )}
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {currentSection?.questions.map((q) => (
            <div key={q.id}>
              <label htmlFor={q.id} className="block text-sm font-semibold text-slate-900 mb-1">
                {q.title} {q.isRequired && <span className="text-red-500">*</span>}
              </label>
              <QuestionRenderer
                question={q}
                value={answers[q.id]}
                onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
              />
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0 || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
              currentStep === 0
                ? "text-slate-400 cursor-not-allowed"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <ArrowLeft size={18} /> Voltar
          </button>

          {currentStep === sections.length - 1 ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              Finalizar Envio
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 transition-colors"
            >
              Avançar <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
