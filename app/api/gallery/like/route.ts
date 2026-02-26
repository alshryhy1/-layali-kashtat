import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const postId = Number(String(body?.post_id || "").trim());
    if (!Number.isFinite(postId) || postId <= 0) return json(false, { error: "invalid_post_id" }, 400);

    // Ensure column exists
    try {
      await db.query("ALTER TABLE gallery_posts ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0");
    } catch {}

    try {
      await db.query("UPDATE gallery_posts SET likes_count = COALESCE(likes_count,0) + 1 WHERE id = $1", [postId]);
    } catch {}

    return json(true, { liked: true }, 200);
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}
