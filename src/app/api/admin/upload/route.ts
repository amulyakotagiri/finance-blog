import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getResources,
  saveResources,
  getUploadDir,
  safeFilename,
  type ResourceItem,
} from "@/lib/resources";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);

const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 15 MB)" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  const ext = path.extname(file.name).toLowerCase();
  const allowedExt = [
    ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif",
    ".txt", ".md", ".doc", ".docx", ".xls", ".xlsx", ".zip",
  ];
  if (!ALLOWED.has(mime) && !allowedExt.includes(ext)) {
    return NextResponse.json(
      { error: "File type not allowed. Use PDF, images, Office, text, or zip." },
      { status: 400 }
    );
  }

  const dir = getUploadDir();
  const unique = `\( {Date.now()}- \){crypto.randomBytes(4).toString("hex")}-`;
  const filename = unique + safeFilename(file.name);
  const dest = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buffer);

  const item: ResourceItem = {
    id: crypto.randomBytes(8).toString("hex"),
    title,
    description: description || undefined,
    filename,
    url: `/resources/${filename}`,
    mimeType: mime,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
  };

  const list = getResources();
  list.unshift(item);
  saveResources(list);

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const list = getResources();
  const item = list.find((r) => r.id === id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.join(getUploadDir(), item.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  saveResources(list.filter((r) => r.id !== id));
  return NextResponse.json({ ok: true });
}
