/**
 * GET  /api/admin/articles  — list all articles (file + DB) for the admin table
 * DELETE /api/admin/articles — delete a DB article by id
 */
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAllArticles } from "@/lib/articles";
import { getDbAllArticles, deleteDbArticle } from "@/lib/articles-db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── File-based articles ──────────────────────────────────────────────────
  type UnifiedArticle = {
    id: string;
    title: string;
    slug: string;
    status: "published" | "scheduled" | "draft";
    publishedAt: string | null;
    scheduledFor: string | null;
    category: string;
    source: "file" | "db";
    readingTime: number | null;
  };

  const unified: UnifiedArticle[] = [];

  try {
    const fileArticles = getAllArticles();
    for (const a of fileArticles) {
      unified.push({
        id: `file:${a.slug}`,
        title: a.title,
        slug: a.slug,
        status:
          a.status === "published"
            ? "published"
            : a.publishOn
            ? "scheduled"
            : "draft",
        publishedAt: a.status === "published" ? a.date : null,
        scheduledFor: a.publishOn || null,
        category: a.category,
        source: "file",
        readingTime: a.readingTime,
      });
    }
  } catch {
    // filesystem unavailable (edge runtime etc.) — skip
  }

  // ── DB articles ──────────────────────────────────────────────────────────
  try {
    const dbArticles = await getDbAllArticles();
    for (const item of dbArticles) {
      const a = item as any;
      unified.push({
        id: a.id,
        title: a.title,
        slug: a.slug,
        status:
          a.status === "PUBLISHED"
            ? "published"
            : a.scheduledFor
            ? "scheduled"
            : "draft",
        publishedAt: a.publishedAt
          ? (a.publishedAt instanceof Date ? a.publishedAt.toISOString().slice(0, 10) : String(a.publishedAt).slice(0, 10))
          : null,
        scheduledFor: a.scheduledFor
          ? (a.scheduledFor instanceof Date ? a.scheduledFor.toISOString().slice(0, 10) : String(a.scheduledFor).slice(0, 10))
          : null,
        category: a.category?.name || "General",
        source: "db",
        readingTime: a.readingTime,
      });
    }
  } catch {
    // DB not configured — skip
  }


  // Sort: scheduled ascending → published descending → draft last
  unified.sort((a, b) => {
    const rank = (x: UnifiedArticle) =>
      x.status === "scheduled" ? 0 : x.status === "published" ? 1 : 2;
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    const da = a.scheduledFor || a.publishedAt || "";
    const db2 = b.scheduledFor || b.publishedAt || "";
    return da < db2 ? -1 : da > db2 ? 1 : 0;
  });

  return NextResponse.json({ articles: unified });
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, source } = body as { id: string; source: string };

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (source === "file" || id.startsWith("file:")) {
    const slug = id.replace(/^file:/, "");
    try {
      const { deleteArticleFile } = await import("@/lib/articles");
      const ok = deleteArticleFile(slug);
      if (ok) return NextResponse.json({ ok: true });
      return NextResponse.json({ error: "File article not found" }, { status: 404 });
    } catch (err) {
      return NextResponse.json({ error: "Delete failed", detail: String(err) }, { status: 500 });
    }
  }

  try {
    await deleteDbArticle(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

