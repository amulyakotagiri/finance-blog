/**
 * GET /api/cron/publish
 *
 * Called by Vercel Cron on every Tuesday and Friday at 06:00 UTC.
 * Publishes all DRAFT DB articles whose scheduledFor date <= today.
 *
 * Protected by CRON_SECRET env var (set in Vercel dashboard).
 */
import { NextResponse } from "next/server";
import { publishDueDbArticles } from "@/lib/articles-db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Verify Vercel cron secret so only Vercel can call this
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  let published = 0;
  try {
    published = await publishDueDbArticles(today);
  } catch (err) {
    return NextResponse.json(
      { error: "DB error", detail: String(err) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    published,
    date: today,
    message: `Published ${published} article(s) on ${today}.`,
  });
}
