import { BookOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedKnowledgeArticleBySlug } from "@/server/actions/knowledge";

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedKnowledgeArticleBySlug(slug);

  if (!article) notFound();

  return (
    <div className="public-proposal">
      <header className="proposal-public-header">
        <BookOpen size={22} color="var(--signal)" />
        <nav>
          <Link href="/ajuda" className="mono muted" style={{ fontSize: 10 }}>
            ← CENTRAL DE AJUDA
          </Link>
        </nav>
        <span />
      </header>

      <section className="proposal-hero">
        <div>
          {article.category && <p className="eyebrow">{article.category.toUpperCase()}</p>}
          <h1>{article.title}</h1>
        </div>
      </section>

      <section className="proposal-section">
        <p
          style={{
            maxWidth: 720,
            color: "var(--mineral)",
            fontSize: 16,
            lineHeight: 1.75,
            whiteSpace: "pre-wrap",
          }}
        >
          {article.body}
        </p>
      </section>
    </div>
  );
}
