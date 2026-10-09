import fs from "fs";
import path from "path";

export interface ResourceItem {
  id: string;
  title: string;
  description?: string;
  filename: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedAt: string;
}

const MANIFEST = path.join(process.cwd(), "content", "resources.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "resources");

export function ensureResourcesDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!fs.existsSync(MANIFEST)) {
    fs.writeFileSync(MANIFEST, "[]", "utf8");
  }
}

export function getResources(): ResourceItem[] {
  ensureResourcesDir();
  try {
    const raw = fs.readFileSync(MANIFEST, "utf8");
    const list = JSON.parse(raw) as ResourceItem[];
    return Array.isArray(list)
      ? list.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
      : [];
  } catch {
    return [];
  }
}

export function saveResources(list: ResourceItem[]) {
  ensureResourcesDir();
  fs.writeFileSync(MANIFEST, JSON.stringify(list, null, 2), "utf8");
}

export function getUploadDir() {
  ensureResourcesDir();
  return UPLOAD_DIR;
}

export function safeFilename(original: string): string {
  const base = path.basename(original).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base || `file-${Date.now()}`;
    }
