import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "ms_admin_session";

function getSecret() {
  return process.env.ADMIN_PASSWORD || process.env.NEXTAUTH_SECRET || "dev-only-change-me";
}

export function createSessionToken(): string {
  const secret = getSecret();
  const payload = `admin:${Date.now()}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`\( {payload}. \){sig}`).toString("base64url");
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [payload, sig] = raw.split(".");
    if (!payload || !sig) return false;
    const secret = getSecret();
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const ts = Number(payload.split(":")[1]);
    if (!ts || Date.now() - ts > 7 * 24 * 60 * 60 * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE_NAME)?.value);
}

export { COOKIE_NAME };

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return password === "admin123" && process.env.NODE_ENV !== "production";
  }
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
