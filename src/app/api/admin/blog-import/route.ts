/**
 * POST /api/admin/blog-import
 *
 * Accepts multiple PDF or DOCX files, converts each to clean markdown matching
 * the Money Sense format, assigns the next available Tuesday/Friday slot (1 post/day),
 * and saves as a scheduled draft.
 */
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAllArticles, saveArticleFile } from "@/lib/articles";
import { getNextPublishSlots } from "@/lib/schedule";
import crypto from "crypto";

// Allowed MIME / extensions
const ALLOWED_EXTS = [".pdf", ".doc", ".docx"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 70);
}

/** Derive a human-readable title from raw text or fallback to filename. */
function extractTitle(text: string, filename: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim().replace(/^#+\s*/, ""))
    .filter(Boolean);
  const first = lines[0];
  if (first && first.length > 3 && first.length < 120) return first;
  // Fallback: use filename without extension
  return filename
    .replace(/\.(pdf|docx|doc)$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

/** First substantial paragraph after the title line. */
function extractExcerpt(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  const para = lines.slice(1).find((l) => l.length > 40) ?? lines[1] ?? "";
  return para.replace(/[*_#]/g, "").slice(0, 220).trim();
}

/** Convert raw text to clean markdown matching the blog formatting */
function textToMarkdown(rawText: string, title: string): string {
  // Normalise line endings
  let text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Remove the title line if it appears at the top
  const lines = text.split("\n");
  const firstNonEmptyIdx = lines.findIndex((l) => l.trim().length > 0);
  if (firstNonEmptyIdx !== -1) {
    const firstLineText = lines[firstNonEmptyIdx].trim().replace(/^#+\s*/, "").toLowerCase();
    if (firstLineText === title.toLowerCase()) {
      lines.splice(firstNonEmptyIdx, 1);
      text = lines.join("\n");
    }
  }

  // Process text line-by-line into clean paragraphs and headers
  const outputBlocks: string[] = [];
  const rawParagraphs = text.split(/\n\s*\n+/);

  for (const block of rawParagraphs) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Check if block is a heading
    const firstLine = trimmed.split("\n")[0].trim();
    if (/^(#{1,6}\s+|[A-Z0-9\s]{3,}:?$)/.test(firstLine) && firstLine.length < 80 && !firstLine.includes(". ")) {
      const headingText = firstLine.replace(/^#+\s*/, "").replace(/:$/, "").trim();
      outputBlocks.push(`## ${headingText}`);
      const remaining = trimmed.split("\n").slice(1).join("\n").trim();
      if (remaining) {
        outputBlocks.push(remaining);
      }
      continue;
    }

    // Check for lists
    if (trimmed.includes("\n- ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const listLines = trimmed
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => (l.startsWith("- ") || l.startsWith("* ") ? `- ${l.replace(/^[-*]\s*/, "")}` : l));
      outputBlocks.push(listLines.join("\n"));
      continue;
    }

    // Standard paragraph: collapse internal single newlines
    const cleanedPara = trimmed.split("\n").map((l) => l.trim()).join(" ");
    outputBlocks.push(cleanedPara);
  }

  return outputBlocks.join("\n\n");
}

/** Extract text and preserve basic structure from DOCX */
async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/** Extract text from a PDF buffer using pdf-parse */
async function extractPdf(buffer: Buffer): Promise<string> {
  const pdfParseModule = (await import("pdf-parse")) as any;
  if (typeof pdfParseModule.default === "function") {
    const res = await pdfParseModule.default(buffer);
    return res.text || "";
  }
  if (typeof pdfParseModule === "function") {
    const res = await pdfParseModule(buffer);
    return res.text || "";
  }
  if (pdfParseModule.PDFParse) {
    const parser = new pdfParseModule.PDFParse({ data: buffer });
    const res = await parser.getText();
    return res.text || "";
  }
  throw new Error("Unable to parse PDF with available pdf-parse interface");
}


export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = form.getAll("files") as File[];
  const validFiles = files.filter((f) => {
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    return ALLOWED_EXTS.includes(ext);
  });

  if (!validFiles.length) {
    return NextResponse.json(
      { error: "No valid PDF or DOCX files found." },
      { status: 400 }
    );
  }

  // Collect already occupied slots to guarantee 1 blog per day
  const existingArticles = getAllArticles();
  const occupiedSlots = existingArticles
    .map((a) => a.publishOn || (a.status === "published" ? a.date : null))
    .filter((d): d is string => !!d);

  // Assign one unique Tue/Fri slot per file
  const slots = getNextPublishSlots(validFiles.length, undefined, occupiedSlots);
  const results: {
    filename: string;
    title?: string;
    slug?: string;
    scheduledFor?: string;
    error?: string;
  }[] = [];

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const slot = slots[i];

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

      let rawText: string;
      if (ext === ".pdf") {
        rawText = await extractPdf(buffer);
      } else {
        rawText = await extractDocx(buffer);
      }

      const title = extractTitle(rawText, file.name);
      const baseSlug = slugify(title);
      const slug = `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;
      const content = textToMarkdown(rawText, title);
      const excerpt = extractExcerpt(rawText);

      // Save as file-based article in content/articles
      saveArticleFile({
        title,
        slug,
        content,
        excerpt,
        category: "General",
        author: "Amulya Kotagiri",
        status: "draft",
        publishOn: slot,
      });

      // Also save to DB if DATABASE_URL is configured
      try {
        const { createScheduledArticle } = await import("@/lib/articles-db");
        await createScheduledArticle({
          title,
          slug,
          content,
          excerpt,
          category: "General",
          scheduledFor: new Date(slot + "T06:00:00Z"),
        });
      } catch {
        // DB optional; file is primary
      }

      results.push({ filename: file.name, title, slug, scheduledFor: slot });
    } catch (err) {
      results.push({
        filename: file.name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ ok: true, results });
}

