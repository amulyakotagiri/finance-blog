"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ResourceItem } from "@/lib/resources";

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminDashboard({
  initialResources,
}: {
  initialResources: ResourceItem[];
}) {
  const router = useRouter();
  const [resources, setResources] = useState(initialResources);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!file) {
      setError("Choose a file");
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.set("file", file);
    form.set("title", title);
    form.set("description", description);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }
      setResources((prev) => [data.item, ...prev]);
      setTitle("");
      setDescription("");
      setFile(null);
      setStatus("Uploaded successfully");
      setUploading(false);
      router.refresh();
    } catch {
      setError("Upload failed");
      setUploading(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this file?")) return;
    const res = await fetch("/api/admin/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setResources((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    }
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted mt-1">
            Upload PDFs and files. Public visitors can only download them — they
            cannot edit articles or upload anything.
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="text-sm text-muted hover:text-foreground shrink-0"
        >
          Log out
        </button>
      </div>

      <section className="border border-border rounded-md bg-card p-6 mb-10">
        <h2 className="font-semibold mb-4">Upload file</h2>
        <form onSubmit={onUpload} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              required
              placeholder="e.g. Budget worksheet"
            />
          </div>
          <div>
            <label htmlFor="desc" className="block text-sm font-medium mb-1">
              Description (optional)
            </label>
            <input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Short note for readers"
            />
          </div>
          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-1">
              File
            </label>
            <input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.doc,.docx,.xls,.xlsx,.zip"
              className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
              required
            />
            <p className="text-xs text-muted mt-1">
              PDF, images, Word, Excel, text, or zip. Max 15 MB.
            </p>
          </div>
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          {status && <p className="text-sm text-accent">{status}</p>}
          <button
            type="submit"
            disabled={uploading}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold mb-4">Uploaded files</h2>
        {resources.length === 0 ? (
          <p className="text-sm text-muted">No files yet.</p>
        ) : (
          <ul className="space-y-3">
            {resources.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-border rounded-md p-4 bg-card"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.title}</p>
                  {r.description && (
                    <p className="text-sm text-muted">{r.description}</p>
                  )}
                  <p className="text-xs text-muted mt-1">
                    {r.filename}
                    {r.sizeBytes ? ` · ${formatSize(r.sizeBytes)}` : ""}
                  </p>
                </div>
                <div className="flex gap-3 text-sm shrink-0">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    onClick={() => onDelete(r.id)}
                    className="text-danger hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-xs text-muted leading-relaxed max-w-xl">
        Note: On Vercel, files written to disk may not persist across deploys.
        For production, prefer adding files under public/resources/ via GitHub,
        or connect blob storage later. Locally, uploads work immediately.
      </p>
    </div>
  );
         }
