import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(String(params.id || "").trim());
    if (!Number.isFinite(id) || id <= 0) return json(false, { error: "invalid_id" }, 400);

    // Find post_id to decrement comments_count
    let postId: number | null = null;
    try {
      const res = await db.query("SELECT post_id FROM gallery_comments WHERE id = $1 LIMIT 1", [id]);
      postId = Number(res.rows?.[0]?.post_id || 0) || null;
    } catch {}

    await db.query("DELETE FROM gallery_comments WHERE id = $1", [id]);
    if (postId) {
      try {
        await db.query("UPDATE gallery_posts SET comments_count = GREATEST(COALESCE(comments_count,0) - 1, 0) WHERE id = $1", [postId]);
      } catch {}
    }

    return json(true, { deleted: true }, 200);
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}
