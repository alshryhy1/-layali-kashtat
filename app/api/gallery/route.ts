import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || "50"), 100);

    // Ensure schema and columns even if table exists
    try {
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
      await db.query("ALTER TABLE gallery_posts ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0");
      await db.query("ALTER TABLE gallery_posts ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0");
      await db.query("ALTER TABLE gallery_posts ADD COLUMN IF NOT EXISTS user_id text");
      await db.query("ALTER TABLE gallery_posts ADD COLUMN IF NOT EXISTS caption text");
      await db.query("ALTER TABLE gallery_posts ADD COLUMN IF NOT EXISTS user_name text");
      await db.query("ALTER TABLE gallery_posts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()");
    } catch {}

    const res = await db.query(
      "SELECT id, image_url, caption, user_name, likes_count, comments_count, created_at, user_id FROM gallery_posts ORDER BY created_at DESC LIMIT $1",
      [limit]
    );
    const rows = Array.isArray(res.rows) ? res.rows : [];
    const signed = await Promise.all(
      rows.map(async (p) => {
        const key = String(p.image_url || "");
        if (key && !/^https?:\/\//i.test(key)) {
          try {
            const { data, error } = await supabaseServer.storage.from("images").createSignedUrl(key, 900);
            if (!error && data?.signedUrl) {
              return { ...p, image_url: data.signedUrl };
            }
          } catch {}
        }
        return p;
      })
    );
    return json(true, { posts: signed }, 200);
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const imageUrl = String(body?.image_url || "").trim();
    const caption = String(body?.caption || "").trim();
    const userName = String(body?.user_name || "").trim() || "Guest";
    const userId = String(body?.user_id || "").trim() || null;
    if (!imageUrl) return json(false, { error: "missing_image_url" }, 400);

    try {
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
    } catch {}

    const ins = await db.query(
      "INSERT INTO gallery_posts (image_url, caption, user_name, user_id) VALUES ($1,$2,$3,$4) RETURNING id",
      [imageUrl, caption, userName, userId]
    );
    const id = ins.rows?.[0]?.id;
    return json(true, { id }, 200);
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}
