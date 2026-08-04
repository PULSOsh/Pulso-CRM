"use client";

import { KanbanSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Select } from "@/components/ui/select";
import { createProjectTemplate } from "@/server/actions/project-templates";
import { createProjectFromContract } from "@/server/actions/projects";

type Project = {
  id: string;
  name: string;
  status: string;
  progress: number;
  stageName: string;
  stageColor: string;
  createdAt: Date;
};

type AvailableContract = {
  id: string;
  code: string;
  title: string;
};

const statusLabels: Record<string, string> = {
  planned: "Planejado",
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export function ProjectsClient({
  initialProjects,
  availableContracts,
  templates: initialTemplates,
}: {
  initialProjects: Project[];
  availableContracts: AvailableContract[];
  templates: { id: string; name: string }[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState(initialTemplates);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateChecklist, setNewTemplateChecklist] = useState("");

  async function handleCreateTemplate() {
    setLoading(true);
    setError(null);
    try {
      const template = await createProjectTemplate({
        name: newTemplateName,
        checklistTitles: newTemplateChecklist
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      });
      setTemplates([...templates, { id: template.id, name: template.name }]);
      setSelectedTemplateId(template.id);
      setIsCreatingTemplate(false);
      setNewTemplateName("");
      setNewTemplateChecklist("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar template.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!selectedContractId) return;
    setLoading(true);
    setError(null);
    try {
      const project = await createProjectFromContract(
        selectedContractId,
        selectedTemplateId || undefined,
      );
      setProjects([
        {
          id: project.id,
          name: project.name,
          status: project.status,
          progress: project.progress,
          stageName: "Aguardando pagamento",
          stageColor: "#64748b",
          createdAt: project.createdAt,
        },
        ...projects,
      ]);
      setIsModalOpen(false);
      setSelectedContractId("");
      setSelectedTemplateId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar projeto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 flex flex-col h-full max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <KanbanSquare size={24} className="text-orange-600" />
            Projetos
          </h1>
          <p className="text-slate-500 mt-1">Acompanhe a execução dos contratos assinados.</p>
        </div>
        <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={availableContracts.length === 0}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            Gerar Projeto
          </button>
          {availableContracts.length === 0 && (
            <p className="text-xs text-slate-500 text-right">
              Nenhum contrato assinado sem projeto.{" "}
              <Link href="/crm/contratos" className="text-orange-600 hover:underline">
                Ver contratos
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium">Nome</th>
                <th className="p-4 font-medium">Etapa</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Progresso</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Nenhum projeto gerado ainda.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-semibold text-slate-900">{project.name}</td>
                    <td className="p-4">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: project.stageColor }}
                      >
                        {project.stageName}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {statusLabels[project.status] ?? project.status}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{project.progress}%</td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/crm/projetos/${project.id}`}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Gerar Projeto</h2>
              <p className="text-slate-500 text-sm mt-1">
                Selecione um contrato assinado para iniciar o projeto.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <Select
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
              >
                <option value="">Selecione um contrato assinado...</option>
                {availableContracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </Select>
              <Select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                <option value="">Checklist padrão (sem template)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>

              {!isCreatingTemplate ? (
                <button
                  type="button"
                  onClick={() => setIsCreatingTemplate(true)}
                  className="text-sm text-orange-600 hover:underline text-left"
                >
                  + Criar novo template
                </button>
              ) : (
                <div className="space-y-2 border border-slate-200 rounded-md p-3">
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Nome do template"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  />
                  <textarea
                    value={newTemplateChecklist}
                    onChange={(e) => setNewTemplateChecklist(e.target.value)}
                    placeholder={"Um item de checklist por linha"}
                    rows={4}
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingTemplate(false)}
                      className="flex-1 px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-md"
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateTemplate}
                      disabled={loading || !newTemplateName.trim()}
                      className="flex-1 px-3 py-1.5 text-sm bg-orange-600 text-white rounded-md disabled:opacity-50"
                    >
                      Salvar template
                    </button>
                  </div>
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !selectedContractId}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
              >
                {loading ? "Gerando..." : "Gerar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
