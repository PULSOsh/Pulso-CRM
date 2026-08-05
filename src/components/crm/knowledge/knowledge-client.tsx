"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { getKnowledgeArticles } from "@/server/actions/knowledge";
import {
  createKnowledgeArticle,
  publishKnowledgeArticle,
  unpublishKnowledgeArticle,
} from "@/server/actions/knowledge";

type Article = Awaited<ReturnType<typeof getKnowledgeArticles>>[number];

export function KnowledgeClient({ articles }: { articles: Article[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createKnowledgeArticle({ title, category, body });
        setTitle("");
        setCategory("");
        setBody("");
        setCreating(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar artigo.");
      }
    });
  }

  function handleTogglePublish(article: Article) {
    startTransition(async () => {
      if (article.status === "published") {
        await unpublishKnowledgeArticle(article.id);
      } else {
        await publishKnowledgeArticle(article.id);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Base de conhecimento</h2>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          Novo artigo
        </Button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
        >
          <Input
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            placeholder="Categoria (opcional)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Textarea
            placeholder="Conteúdo"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="sm" disabled={isPending}>
            Salvar como rascunho
          </Button>
        </form>
      )}

      {articles.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum artigo criado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {articles.map((article) => (
            <li
              key={article.id}
              className="flex items-center justify-between rounded-control border border-pulso-border p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{article.title}</p>
                <p className="text-xs text-slate-500">
                  {article.category || "Sem categoria"} ·{" "}
                  {article.status === "published" ? "Publicado" : "Rascunho"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTogglePublish(article)}
                disabled={isPending}
              >
                {article.status === "published" ? "Despublicar" : "Publicar"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
