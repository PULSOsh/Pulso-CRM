import { BookOpen } from "lucide-react";
import Link from "next/link";
import { getPublishedKnowledgeArticles } from "@/server/actions/knowledge";

// Sem params/searchParams para o Next tratar como dinâmica sozinho (diferente
// de /portal/[token], que já é dinâmica por causa do segmento) - sem isso o
// build tenta pré-renderizar estaticamente e bate no banco em build time.
export const dynamic = "force-dynamic";

export default async function HelpCenterPage() {
  const articles = await getPublishedKnowledgeArticles();

  const byCategory = new Map<string, typeof articles>();
  for (const article of articles) {
    const key = article.category || "Geral";
    byCategory.set(key, [...(byCategory.get(key) ?? []), article]);
  }

  return (
    <div className="public-proposal">
      <header className="proposal-public-header">
        <BookOpen size={22} color="var(--signal)" />
        <nav>
          <span className="mono muted" style={{ fontSize: 10 }}>
            CENTRAL DE AJUDA
          </span>
        </nav>
        <span />
      </header>

      <section className="proposal-hero">
        <div>
          <p className="eyebrow">AJUDA</p>
          <h1>Como podemos ajudar?</h1>
        </div>
      </section>

      {articles.length === 0 ? (
        <section className="proposal-section">
          <p>Nenhum artigo publicado ainda.</p>
        </section>
      ) : (
        Array.from(byCategory.entries()).map(([category, items]) => (
          <section className="proposal-section" key={category}>
            <p className="eyebrow">{category.toUpperCase()}</p>
            <ul style={{ marginTop: 16 }}>
              {items.map((article) => (
                <li key={article.id} style={{ marginBottom: 8 }}>
                  <Link href={`/ajuda/${article.slug}`}>{article.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
