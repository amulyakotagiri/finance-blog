import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedArticles } from "@/lib/articles";
import { getDbPublishedArticles } from "@/lib/articles-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Practical personal finance articles on budgeting, saving, investing and money habits.",
};

export default async function BlogPage() {
  // File-based articles
  let fileArticles: ReturnType<typeof getPublishedArticles> = [];
  try {
    fileArticles = getPublishedArticles();
  } catch {
    /* unavailable in some edge environments */
  }

  // DB articles (scheduled articles that have been published)
  type DbArticle = {
    slug: string;
    title: string;
    excerpt: string | null;
    category: { name: string } | null;
    publishedAt: Date | null;
    readingTime: number | null;
  };
  let dbArticles: DbArticle[] = [];
  try {
    dbArticles = await getDbPublishedArticles();
  } catch {
    /* DB not configured */
  }

  // Merge and de-duplicate (prefer file articles)
  const fileSlugs = new Set(fileArticles.map((a) => a.slug));
  const mergedDb = dbArticles.filter((a) => !fileSlugs.has(a.slug));

  type DisplayArticle = {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    date: string;
    readingTime: number;
  };

  const articles: DisplayArticle[] = [
    ...fileArticles.map((a) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      date: a.date,
      readingTime: a.readingTime,
    })),
    ...mergedDb.map((a) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt ?? "",
      category: a.category?.name ?? "General",
      date: a.publishedAt?.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      readingTime: a.readingTime ?? 3,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight">Articles</h1>
        <p className="mt-2 text-muted max-w-xl">
          Practical explanations of money topics. Written for people who want
          clarity, not hype.
        </p>
      </header>

      {articles.length === 0 ? (
        <div className="border border-border rounded-md bg-card p-8 text-center">
          <p className="text-muted">
            No published articles yet. New posts will appear here once they are
            published.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="border-b border-border pb-10 last:border-0"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted mb-2">
                <span className="font-medium text-accent">{article.category}</span>
                <span aria-hidden>·</span>
                <time dateTime={article.date}>
                  {new Date(article.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span aria-hidden>·</span>
                <span>{article.readingTime} min read</span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                <Link
                  href={`/blog/${article.slug}`}
                  className="hover:text-accent transition-colors"
                >
                  {article.title}
                </Link>
              </h2>
              <p className="mt-2 text-muted leading-relaxed max-w-2xl">
                {article.excerpt}
              </p>
              <Link
                href={`/blog/${article.slug}`}
                className="inline-block mt-3 text-sm font-medium text-accent hover:underline underline-offset-2"
              >
                Read article →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
