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

    // Delete comments first
    try {
      await db.query("DELETE FROM gallery_comments WHERE post_id = $1", [id]);
    } catch {}
    // Delete post
    await db.query("DELETE FROM gallery_posts WHERE id = $1", [id]);

    return json(true, { deleted: true }, 200);
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}
