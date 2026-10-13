"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

type ArticleStatus = "published" | "scheduled" | "draft";

interface UnifiedArticle {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  publishedAt: string | null;
  scheduledFor: string | null;
  category: string;
  source: "file" | "db";
  readingTime: number | null;
}

interface QueuedFile {
  file: File;
  slot: string; // YYYY-MM-DD
}

interface ImportResult {
  filename: string;
  title?: string;
  slug?: string;
  scheduledFor?: string;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Next N Tue/Fri dates starting from tomorrow */
function getNextSlots(count: number): string[] {
  const slots: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  while (slots.length < count) {
    const day = d.getDay();
    if (day === 2 || day === 5) slots.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return slots;
}

function formatSlot(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  return `${day === 2 ? "Tue" : "Fri"}, ${d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })}`;
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ArticleStatus }) {
  const styles: Record<ArticleStatus, string> = {
    published: "bg-emerald-100 text-emerald-800 border-emerald-200",
    scheduled: "bg-blue-100 text-blue-800 border-blue-200",
    draft: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const dot: Record<ArticleStatus, string> = {
    published: "bg-emerald-500",
    scheduled: "bg-blue-500",
    draft: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function AdminDashboard() {
  const router = useRouter();

  // ── Tab state
  const [tab, setTab] = useState<"posts" | "import">("posts");

  // ── Articles table state
  const [articles, setArticles] = useState<UnifiedArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // ── Import state
  const [queued, setQueued] = useState<QueuedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load articles ──────────────────────────────────────────────────────────

  const loadArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch("/api/admin/articles");
      const data = await res.json();
      if (res.ok) setArticles(data.articles ?? []);
    } finally {
      setLoadingArticles(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const stats = {
    total: articles.length,
    published: articles.filter((a) => a.status === "published").length,
    scheduled: articles.filter((a) => a.status === "scheduled").length,
    draft: articles.filter((a) => a.status === "draft").length,
  };

  // ─── Filtered articles ────────────────────────────────────────────────────

  const filtered = articles.filter(
    (a) =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Delete article ───────────────────────────────────────────────────────

  async function handleDelete(article: UnifiedArticle) {
    if (!confirm(`Delete "${article.title}"?`)) return;
    setDeleteLoading(article.id);
    setDeleteError("");
    try {
      const res = await fetch("/api/admin/articles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, source: article.source }),
      });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== article.id));
      } else {
        const d = await res.json();
        setDeleteError(d.error ?? "Delete failed.");
      }
    } catch {
      setDeleteError("Delete failed.");
    } finally {
      setDeleteLoading(null);
    }
  }

  // ─── File drop / pick ─────────────────────────────────────────────────────

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) =>
      /\.(pdf|docx|doc)$/i.test(f.name)
    );
    if (!valid.length) return;
    setQueued((prev) => {
      const combined = [...prev, ...valid.map((f) => ({ file: f, slot: "" }))];
      const occupied = articles
        .map((a) => a.scheduledFor || a.publishedAt)
        .filter((d): d is string => !!d);
      // Generate slots skipping occupied dates
      const occupiedSet = new Set(occupied);
      const slots: string[] = [];
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      let safety = 365;
      while (slots.length < combined.length && safety-- > 0) {
        const day = d.getDay();
        if (day === 2 || day === 5) {
          const dateStr = d.toISOString().slice(0, 10);
          if (!occupiedSet.has(dateStr)) {
            slots.push(dateStr);
          }
        }
        d.setDate(d.getDate() + 1);
      }
      return combined.map((q, i) => ({ ...q, slot: slots[i] || "" }));
    });
  }

  function removeQueued(idx: number) {
    setQueued((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      const occupied = articles
        .map((a) => a.scheduledFor || a.publishedAt)
        .filter((d): d is string => !!d);
      const occupiedSet = new Set(occupied);
      const slots: string[] = [];
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      let safety = 365;
      while (slots.length < next.length && safety-- > 0) {
        const day = d.getDay();
        if (day === 2 || day === 5) {
          const dateStr = d.toISOString().slice(0, 10);
          if (!occupiedSet.has(dateStr)) {
            slots.push(dateStr);
          }
        }
        d.setDate(d.getDate() + 1);
      }
      return next.map((q, i) => ({ ...q, slot: slots[i] || "" }));
    });
  }


  // ─── Import submit ────────────────────────────────────────────────────────

  async function handleImport() {
    if (!queued.length) return;
    setImporting(true);
    setImportError("");
    setImportResults([]);

    const form = new FormData();
    for (const q of queued) form.append("files", q.file);

    try {
      const res = await fetch("/api/admin/blog-import", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? "Import failed.");
      } else {
        setImportResults(data.results ?? []);
        setQueued([]);
        // Refresh articles table
        await loadArticles();
      }
    } catch {
      setImportError("Import failed. Check your DB connection.");
    } finally {
      setImporting(false);
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#e5e2dc] shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1e4d3a] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-semibold text-[#1a1a1a] text-base">Admin Panel</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-[#1a1a1a]" },
            { label: "Published", value: stats.published, color: "text-emerald-700" },
            { label: "Scheduled", value: stats.scheduled, color: "text-blue-700" },
            { label: "Draft", value: stats.draft, color: "text-gray-500" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-[#e5e2dc] p-4 shadow-sm">
              <p className="text-xs text-[#6b6b6b] mb-0.5">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-[#e5e2dc] gap-1">
          {(["posts", "import"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                tab === t
                  ? "bg-white border border-b-white border-[#e5e2dc] text-[#1e4d3a] -mb-px"
                  : "text-[#6b6b6b] hover:text-[#1a1a1a]"
              }`}
            >
              {t === "posts" ? "📋 Posts" : "📁 Import Articles"}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: POSTS
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === "posts" && (
          <div className="bg-white rounded-xl border border-[#e5e2dc] shadow-sm overflow-hidden">
            {/* Table header + search */}
            <div className="px-4 py-3 border-b border-[#e5e2dc] flex flex-wrap gap-3 items-center justify-between">
              <h2 className="font-semibold text-[#1a1a1a]">
                All Posts{" "}
                <span className="text-sm font-normal text-[#6b6b6b]">({filtered.length})</span>
              </h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or category…"
                className="w-full sm:w-64 rounded-lg border border-[#e5e2dc] bg-[#f8f7f5] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4d3a]/40"
              />
            </div>

            {deleteError && (
              <p className="mx-4 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {deleteError}
              </p>
            )}

            {loadingArticles ? (
              <div className="p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-[#1e4d3a] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#6b6b6b] mt-2">Loading posts…</p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-8 text-center text-sm text-[#6b6b6b]">
                {search ? "No posts match your search." : "No posts yet. Import your first article →"}
              </p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#e5e2dc] bg-[#f8f7f5]">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">Title</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">Scheduled</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">Published</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e2dc]">
                      {filtered.map((a) => (
                        <tr key={a.id} className="hover:bg-[#f8f7f5] transition-colors">
                          <td className="px-4 py-3 max-w-xs">
                            <p className="font-medium text-[#1a1a1a] truncate" title={a.title}>
                              {a.title}
                            </p>
                            <p className="text-xs text-[#6b6b6b] mt-0.5">
                              {a.category}
                              {a.source === "file" && (
                                <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-500 rounded px-1 py-0.5">file</span>
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={a.status} />
                          </td>
                          <td className="px-4 py-3 text-[#6b6b6b]">
                            {fmtDate(a.scheduledFor)}
                          </td>
                          <td className="px-4 py-3 text-[#6b6b6b]">
                            {fmtDate(a.publishedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <a
                                href={`/blog/${a.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#1e4d3a] hover:underline underline-offset-2 text-xs font-medium"
                              >
                                View
                              </a>
                              <button
                                onClick={() => handleDelete(a)}
                                disabled={deleteLoading === a.id}
                                className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50 transition-colors"
                              >
                                {deleteLoading === a.id ? "…" : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="sm:hidden divide-y divide-[#e5e2dc]">
                  {filtered.map((a) => (
                    <div key={a.id} className="px-4 py-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-[#1a1a1a] text-sm leading-snug flex-1">
                          {a.title}
                        </p>
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6b6b6b]">
                        <span>{a.category}</span>
                        {a.scheduledFor && <span>Scheduled: {fmtDate(a.scheduledFor)}</span>}
                        {a.publishedAt && <span>Published: {fmtDate(a.publishedAt)}</span>}
                      </div>
                      <div className="flex gap-4 text-xs font-medium">
                        <a
                          href={`/blog/${a.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1e4d3a] hover:underline"
                        >
                          View →
                        </a>
                        <button
                          onClick={() => handleDelete(a)}
                          disabled={deleteLoading === a.id}
                          className="text-red-500 disabled:opacity-50"
                        >
                          {deleteLoading === a.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: IMPORT
        ═══════════════════════════════════════════════════════════════════ */}
        {tab === "import" && (
          <div className="space-y-5">
            {/* Drop zone */}
            <div className="bg-white rounded-xl border border-[#e5e2dc] shadow-sm p-5">
              <h2 className="font-semibold text-[#1a1a1a] mb-1">Import Articles</h2>
              <p className="text-sm text-[#6b6b6b] mb-4">
                Upload PDF or Word (.docx) files. Each file will be converted into a blog post
                and scheduled to publish on the next available <strong>Tuesday or Friday</strong>,
                one article per day.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 py-10 ${
                  dragOver
                    ? "border-[#1e4d3a] bg-[#e8f0ec]"
                    : "border-[#e5e2dc] bg-[#f8f7f5] hover:border-[#1e4d3a]/50 hover:bg-[#f0f5f2]"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#e8f0ec] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1e4d3a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-medium text-[#1a1a1a] text-sm">
                    Drop PDF or Word files here
                  </p>
                  <p className="text-xs text-[#6b6b6b] mt-0.5">
                    or <span className="text-[#1e4d3a] font-medium">click to browse</span>
                  </p>
                </div>
                <p className="text-xs text-[#6b6b6b]">.pdf · .docx · .doc</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                className="sr-only"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {/* File queue */}
            {queued.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e5e2dc] shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-[#e5e2dc] flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-[#1a1a1a]">
                    {queued.length} file{queued.length !== 1 ? "s" : ""} queued
                  </h3>
                  <button
                    onClick={() => setQueued([])}
                    className="text-xs text-[#6b6b6b] hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                </div>

                <ul className="divide-y divide-[#e5e2dc]">
                  {queued.map((q, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#e8f0ec] flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-[#1e4d3a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1a1a1a] truncate">{q.file.name}</p>
                          <p className="text-xs text-blue-600 font-medium mt-0.5">
                            → {formatSlot(q.slot)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeQueued(i)}
                        className="text-[#6b6b6b] hover:text-red-500 transition-colors shrink-0 p-1"
                        aria-label="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>

                {importError && (
                  <p className="mx-4 mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {importError}
                  </p>
                )}

                <div className="px-4 py-3 border-t border-[#e5e2dc] flex gap-3">
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="flex-1 sm:flex-none rounded-lg bg-[#1e4d3a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#163829] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    {importing ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Importing…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Schedule {queued.length} article{queued.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Import results */}
            {importResults.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e5e2dc] shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-[#e5e2dc]">
                  <h3 className="font-semibold text-sm text-[#1a1a1a]">Import Results</h3>
                </div>
                <ul className="divide-y divide-[#e5e2dc]">
                  {importResults.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 px-4 py-3">
                      <span className="mt-0.5 text-base">{r.error ? "❌" : "✅"}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">
                          {r.error ? r.filename : r.title}
                        </p>
                        {r.error ? (
                          <p className="text-xs text-red-600 mt-0.5">{r.error}</p>
                        ) : (
                          <p className="text-xs text-[#6b6b6b] mt-0.5">
                            Scheduled for{" "}
                            <span className="text-blue-600 font-medium">
                              {r.scheduledFor ? formatSlot(r.scheduledFor) : "—"}
                            </span>
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-3 border-t border-[#e5e2dc]">
                  <button
                    onClick={() => { setImportResults([]); setTab("posts"); }}
                    className="text-sm font-medium text-[#1e4d3a] hover:underline"
                  >
                    View in Posts →
                  </button>
                </div>
              </div>
            )}

            {/* Info note */}
            <p className="text-xs text-[#6b6b6b] leading-relaxed">
              <strong>Note:</strong> Articles are stored in the database and auto-published by a Vercel Cron job
              at 06:00 UTC every Tuesday and Friday. Make sure <code className="bg-gray-100 px-1 rounded">DATABASE_URL</code> and{" "}
              <code className="bg-gray-100 px-1 rounded">CRON_SECRET</code> are set in your Vercel environment variables.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
