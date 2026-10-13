/**
 * Prisma-based DB article CRUD helpers.
 * Used by the admin API routes for scheduled article management.
 */
import { prisma } from "./prisma";
import readingTime from "reading-time";

const SYSTEM_AUTHOR_EMAIL = "admin@finance-blog.local";
const SYSTEM_AUTHOR_NAME = "Amulya Kotagiri";

/** Get (or create) the system author used for all admin-imported articles. */
export async function getSystemAuthorId(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: SYSTEM_AUTHOR_EMAIL },
    create: {
      email: SYSTEM_AUTHOR_EMAIL,
      name: SYSTEM_AUTHOR_NAME,
      passwordHash: "system-nologin",
      role: "ADMIN",
    },
    update: {},
  });
  return user.id;
}

/** Get (or create) a category by name. */
export async function getOrCreateCategoryId(name: string): Promise<string> {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  const cat = await prisma.category.upsert({
    where: { slug },
    create: { name, slug },
    update: {},
  });
  return cat.id;
}

export interface DbArticleInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category?: string;
  scheduledFor: Date;
}

/** Save a new article as DRAFT with a scheduled publish date. */
export async function createScheduledArticle(input: DbArticleInput) {
  const authorId = await getSystemAuthorId();
  const categoryId = await getOrCreateCategoryId(input.category || "General");
  const stats = readingTime(input.content || "");

  return prisma.article.create({
    data: {
      title: input.title,
      slug: input.slug,
      content: input.content,
      excerpt: input.excerpt || "",
      status: "DRAFT",
      scheduledFor: input.scheduledFor,
      authorId,
      categoryId,
      readingTime: Math.max(1, Math.ceil(stats.minutes)),
    },
  });
}

/** All DB articles (admin view). */
export async function getDbAllArticles() {
  return prisma.article.findMany({
    include: { category: true, author: true },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
  });
}

/** Only PUBLISHED DB articles (public view). */
export async function getDbPublishedArticles() {
  return prisma.article.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true, author: true },
    orderBy: { publishedAt: "desc" },
  });
}

/** Single DB article by slug (any status). */
export async function getDbArticleBySlug(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: { category: true, author: true, sources: true },
  });
}

/**
 * Publish all DRAFT DB articles whose scheduledFor date is <= today.
 * Called by the Vercel cron endpoint on Tue & Fri.
 */
export async function publishDueDbArticles(todayISO: string): Promise<number> {
  const cutoff = new Date(todayISO + "T23:59:59Z");
  const result = await prisma.article.updateMany({
    where: {
      status: "DRAFT",
      scheduledFor: { not: null, lte: cutoff },
    },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
  return result.count;
}

/** Delete a DB article by ID. */
export async function deleteDbArticle(id: string) {
  return prisma.article.delete({ where: { id } });
}
