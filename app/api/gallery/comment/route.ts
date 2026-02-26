import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const postId = Number(String(url.searchParams.get("post_id") || "").trim());
    if (!Number.isFinite(postId) || postId <= 0) return json(false, { error: "invalid_post_id" }, 400);

    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS gallery_comments (
          id bigserial primary key,
          post_id bigint not null,
          user_name text,
          content text not null,
          user_id text,
          created_at timestamptz default now()
        )
      `);
      await db.query("ALTER TABLE gallery_comments ADD COLUMN IF NOT EXISTS user_name text");
      await db.query("ALTER TABLE gallery_comments ADD COLUMN IF NOT EXISTS content text");
      await db.query("ALTER TABLE gallery_comments ADD COLUMN IF NOT EXISTS user_id text");
      await db.query("ALTER TABLE gallery_comments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()");
    } catch {}

    const res = await db.query(
      "SELECT id, user_name, content, created_at, user_id FROM gallery_comments WHERE post_id = $1 ORDER BY created_at DESC",
      [postId]
    );
    return json(true, { comments: res.rows || [] }, 200);
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const postId = Number(String(body?.post_id || "").trim());
    const content = String(body?.content || "").trim();
    const userName = String(body?.user_name || "Guest").trim();
    const userId = String(body?.user_id || "").trim() || null;
    if (!Number.isFinite(postId) || postId <= 0) return json(false, { error: "invalid_post_id" }, 400);
    if (!content) return json(false, { error: "missing_content" }, 400);

    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS gallery_comments (
          id bigserial primary key,
          post_id bigint not null,
          user_name text,
          content text not null,
          user_id text,
          created_at timestamptz default now()
        )
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS gallery_posts (
          id bigserial primary key,
          image_url text not null,
          caption text,
          user_name text,
          likes_count integer default 0,
          comments_count integer default 0,
          user_id text,
          created_at timestamptz default now()
        )
      `);
      await db.query("ALTER TABLE gallery_posts ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0");
    } catch {}

    const ins = await db.query(
      "INSERT INTO gallery_comments (post_id, user_name, content, user_id) VALUES ($1,$2,$3,$4) RETURNING id",
      [postId, userName, content, userId]
    );
    const id = ins.rows?.[0]?.id;
    try {
      await db.query("UPDATE gallery_posts SET comments_count = COALESCE(comments_count,0) + 1 WHERE id = $1", [postId]);
    } catch {}
    return json(true, { comment: { id, user_name: userName, content } }, 200);
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}
