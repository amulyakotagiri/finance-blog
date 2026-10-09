import type { Metadata } from "next";
import { getResources } from "@/lib/resources";

export const metadata: Metadata = {
  title: "Resources",
  description: "Downloadable worksheets and PDFs from Money Sense.",
};

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResourcesPage() {
  const resources = getResources();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Resources</h1>
        <p className="mt-2 text-muted max-w-xl">
          Downloadable files shared for education. You can view or download —
          editing the site is not available to visitors.
        </p>
      </header>

      {resources.length === 0 ? (
        <div className="border border-border rounded-md bg-card p-8 text-center">
          <p className="text-muted">No resources published yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {resources.map((r) => (
            <li
              key={r.id}
              className="border border-border rounded-md bg-card p-5 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <h2 className="font-semibold tracking-tight">{r.title}</h2>
                {r.description && (
                  <p className="text-sm text-muted mt-1">{r.description}</p>
                )}
                <p className="text-xs text-muted mt-2">
                  {r.sizeBytes ? formatSize(r.sizeBytes) : ""}
                  {r.mimeType?.includes("pdf") ? " · PDF" : ""}
                </p>
              </div>
              <a
                href={r.url}
                download
                className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 shrink-0"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
            }
