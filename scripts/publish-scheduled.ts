/**
 * Auto-publish scheduled drafts.
 *
 * Modes (env PUBLISH_MODE):
 *   - scheduled (default): publish drafts where publishOn <= today
 *   - queue: also publish the next N unscheduled drafts (PUBLISH_LIMIT, default 1)
 *
 * Usage:
 *   npx tsx scripts/publish-scheduled.ts
 *   PUBLISH_MODE=queue PUBLISH_LIMIT=1 npx tsx scripts/publish-scheduled.ts
 *
 * Exit code 0 always if no errors (so CI can commit only when files change).
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getDraftsReadyToPublish } from "../src/lib/articles";

const mode = (process.env.PUBLISH_MODE || "scheduled").toLowerCase();
const limit = Math.max(0, parseInt(process.env.PUBLISH_LIMIT || "1", 10) || 1);
const today = new Date().toISOString().slice(0, 10);

const includeUnscheduled = mode === "queue";
let candidates = getDraftsReadyToPublish(today, { includeUnscheduled });

if (mode === "queue") {
  // Scheduled-due first, then unscheduled, capped by limit
  candidates = candidates.slice(0, limit);
} else {
  // Only those with publishOn due; no artificial limit (all due ones publish)
  candidates = candidates.filter((a) => !!a.publishOn);
}

if (candidates.length === 0) {
  console.log(`[publish] ${today} — nothing to publish (mode=${mode}).`);
  process.exit(0);
}

const published: string[] = [];

for (const article of candidates) {
  if (!article.filePath) continue;

  const raw = fs.readFileSync(article.filePath, "utf8");
  const parsed = matter(raw);

  parsed.data.status = "published";
  // Keep original date if set; otherwise set to today
  if (!parsed.data.date) {
    parsed.data.date = today;
  }
  // Record when it went live
  parsed.data.updated = today;
  // Clear schedule field so it is not re-processed
  delete parsed.data.publishOn;

  const next = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(article.filePath, next, "utf8");
  published.push(article.slug);
  console.log(`[publish] published: ${article.slug} (${path.basename(article.filePath)})`);
}

console.log(`[publish] done — ${published.length} article(s): ${published.join(", ")}`);
process.exit(0);
