import { NextResponse } from "next/server";
import {
  checkPassword,
  createSessionToken,
  COOKIE_NAME,
} from "@/lib/admin-auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String(body.password || "");

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
