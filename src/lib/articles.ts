import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

export type ArticleStatus = "draft" | "published";

export interface ArticleMeta {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string; // YYYY-MM-DD
  updated?: string;
  status: ArticleStatus;
  /** Optional: auto-publish on/after this date (YYYY-MM-DD) when the scheduler runs */
  publishOn?: string;
  readingTime: number;
  sources?: { title: string; url?: string }[];
  metaTitle?: string;
  metaDescription?: string;
  /** Absolute path to the source file (internal use) */
  filePath?: string;
}

export interface Article extends ArticleMeta {
  content: string;
}

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

function ensureDir() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  }
}

function parseFile(filename: string): Article | null {
  const fullPath = path.join(ARTICLES_DIR, filename);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  const slug = (data.slug as string) || filename.replace(/\.mdx?$/, "");
  const status: ArticleStatus =
    data.status === "published" ? "published" : "draft";

  // Normalise Windows CRLF to LF and trim lines
  const normalizedContent = (content || "")

    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .trim();

  const stats = readingTime(normalizedContent || "");

  return {
    slug,
    title: (data.title as string) || "Untitled",
    excerpt: (data.excerpt as string) || "",
    category: (data.category as string) || "General",
    author: (data.author as string) || "Editorial Team",
    date: (data.date as string) || new Date().toISOString().slice(0, 10),
    updated: data.updated as string | undefined,
    status,
    publishOn: data.publishOn as string | undefined,
    readingTime: data.readingTime
      ? Number(data.readingTime)
      : Math.max(1, Math.ceil(stats.minutes)),
    sources: Array.isArray(data.sources) ? data.sources : undefined,
    metaTitle: data.metaTitle as string | undefined,
    metaDescription: data.metaDescription as string | undefined,
    filePath: fullPath,
    content: normalizedContent,
  };
}

/** All articles on disk (draft + published). */
export function getAllArticles(): Article[] {
  ensureDir();
  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .filter((f) => !f.startsWith("_")); // ignore _example-draft.md style templates

  return files
    .map(parseFile)
    .filter((a): a is Article => a !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Public site: only published articles. */
export function getPublishedArticles(): Article[] {
  return getAllArticles().filter((a) => a.status === "published");
}

/** Public site: one published article by slug, or null. */
export function getPublishedArticle(slug: string): Article | null {
  const article = getAllArticles().find((a) => a.slug === slug);
  if (!article || article.status !== "published") return null;
  return article;
}

/** Any article by slug (including drafts). */
export function getArticleBySlug(slug: string): Article | null {
  return getAllArticles().find((a) => a.slug === slug) ?? null;
}

export function getPublishedSlugs(): string[] {
  return getPublishedArticles().map((a) => a.slug);
}

/**
 * Drafts ready to auto-publish.
 * - status is draft
 * - publishOn is set and <= today (UTC), OR
 * - publishOn is missing and includeUnscheduled is true (queue mode)
 */
export function getDraftsReadyToPublish(
  todayISO: string,
  options: { includeUnscheduled?: boolean } = {}
): Article[] {
  const today = todayISO.slice(0, 10);
  return getAllArticles()
    .filter((a) => a.status === "draft")
    .filter((a) => {
      if (a.publishOn) {
        return a.publishOn.slice(0, 10) <= today;
      }
      return options.includeUnscheduled === true;
    })
    .sort((a, b) => {
      // Prefer earlier publishOn, then earlier date
      const pa = a.publishOn || a.date;
      const pb = b.publishOn || b.date;
      return pa < pb ? -1 : 1;
    });
}

/** Save or update a file-based article in content/articles/ */
export function saveArticleFile(article: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category?: string;
  author?: string;
  date?: string;
  status?: ArticleStatus;
  publishOn?: string;
  sources?: { title: string; url?: string }[];
}): string {
  ensureDir();
  const filePath = path.join(ARTICLES_DIR, `${article.slug}.md`);
  const frontmatter: Record<string, unknown> = {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || "",
    category: article.category || "General",
    author: article.author || "Amulya Kotagiri",
    date: article.date || new Date().toISOString().slice(0, 10),
    status: article.status || "draft",
  };

  if (article.publishOn) {
    frontmatter.publishOn = article.publishOn;
  }
  if (article.sources && article.sources.length > 0) {
    frontmatter.sources = article.sources;
  }

  const fileContent = matter.stringify(article.content.trim(), frontmatter);
  fs.writeFileSync(filePath, fileContent, "utf8");
  return filePath;
}

/** Delete a file-based article */
export function deleteArticleFile(slug: string): boolean {
  ensureDir();
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  const mdxPath = path.join(ARTICLES_DIR, `${slug}.mdx`);
  if (fs.existsSync(mdxPath)) {
    fs.unlinkSync(mdxPath);
    return true;
  }
  return false;
}

