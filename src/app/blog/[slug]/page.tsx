import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishedArticle,
  getPublishedSlugs,
} from "@/lib/articles";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getPublishedSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getPublishedArticle(slug);
  if (!article) return { title: "Article not found" };

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt,
      type: "article",
      publishedTime: article.date,
      modifiedTime: article.updated || article.date,
      authors: [article.author],
    },
  };
}

function renderContent(content: string) {
  return content
    .trim()
    .split("\n\n")
    .map((block, i) => {
      if (block.startsWith("## ")) {
        const text = block.slice(3);
        const id = text
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "");
        return (
          <h2
            key={i}
            id={id}
            className="text-xl font-semibold mt-10 mb-3 tracking-tight"
          >
            {text}
          </h2>
        );
      }
      if (block.startsWith("### ")) {
        const text = block.slice(4);
        return (
          <h3 key={i} className="text-lg font-semibold mt-8 mb-2 tracking-tight">
            {text}
          </h3>
        );
      }
      if (block.includes("\n- ") || block.startsWith("- ")) {
        const items = block.split("\n").filter((l) => l.startsWith("- "));
        return (
          <ul key={i} className="list-disc pl-5 my-4 space-y-1">
            {items.map((item, j) => (
              <li key={j}>{item.replace(/^-\s*/, "")}</li>
            ))}
          </ul>
        );
      }
      // simple bold support
      const parts = block.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="mb-5 leading-relaxed">
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : (
              part
            )
          )}
        </p>
      );
    });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getPublishedArticle(slug);
  if (!article) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <nav className="text-sm text-muted mb-6" aria-label="Breadcrumb">
        <Link href="/blog" className="hover:text-foreground">
          Articles
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{article.category}</span>
      </nav>

      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted mb-3">
          <span className="font-medium text-accent">{article.category}</span>
          <span aria-hidden>·</span>
          <time dateTime={article.date}>
            {new Date(article.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          {article.updated && (
            <>
              <span aria-hidden>·</span>
              <span>
                Updated{" "}
                {new Date(article.updated).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </>
          )}
          <span aria-hidden>·</span>
          <span>{article.readingTime} min read</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
          {article.title}
        </h1>
        <p className="mt-4 text-muted">By {article.author}</p>
      </header>

      <div className="prose max-w-none font-serif text-[1.125rem] leading-[1.75]">
        {renderContent(article.content)}
      </div>

      {article.sources && article.sources.length > 0 && (
        <section className="mt-12 pt-8 border-t border-border">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
            Sources & references
          </h2>
          <ul className="space-y-1 text-sm">
            {article.sources.map((s) => (
              <li key={s.title}>
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <aside className="mt-12 p-5 bg-accent-soft/50 border border-border rounded-md text-sm text-muted leading-relaxed">
        <strong className="text-foreground">Educational content only.</strong>{" "}
        This article does not constitute personalized financial advice. Consider
        your own circumstances and consult a qualified professional when making
        financial decisions.
      </aside>
    </article>
  );
}
