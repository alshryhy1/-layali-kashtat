import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-customer";
 
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("target_id");
  const targetTypeRaw = (searchParams.get("target_type") || "haraj").toLowerCase();
  if (!targetId) return NextResponse.json({ ok: false, error: "missing_target_id" }, { status: 400 });
  if (targetTypeRaw !== "haraj") return NextResponse.json({ ok: false, error: "invalid_target_type" }, { status: 400 });
  const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(targetId));
  if (!uuidOk) return NextResponse.json({ ok: false, error: "invalid_target_id" }, { status: 400 });
  try {
    try {
      await db.query("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE");
      await db.query("CREATE INDEX IF NOT EXISTS idx_reviews_target_approved ON reviews (target_id, is_approved)");
      await db.query("CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews (customer_id)");
    } catch {}
    const itemCheck = await db.query("SELECT 1 FROM haraj_items WHERE id = $1 LIMIT 1", [targetId]);
    if (itemCheck.rows.length === 0) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    const q = `
      SELECT r.id, r.rating, r.comment, r.created_at, c.name AS customer_name,
        CASE WHEN hi.customer_id IS NOT NULL AND r.customer_id = hi.customer_id THEN true ELSE false END AS is_owner
      FROM reviews r
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN haraj_items hi ON r.target_id = hi.id
      WHERE r.target_id = $1 AND r.target_type = 'haraj' AND COALESCE(r.is_approved, TRUE) = TRUE
      ORDER BY r.created_at DESC
    `;
    const res = await db.query(q, [targetId]);
    return NextResponse.json({ ok: true, reviews: res.rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
 
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({}));
    const target_id = String(body?.target_id || "").trim();
    const rating = Number(String(body?.rating ?? "").trim());
    const comment = String(body?.comment || "").trim();
    if ((comment || "").length < 3) return NextResponse.json({ ok: false, error: "comment_too_short" }, { status: 400 });
    if ((comment || "").length > 1000) return NextResponse.json({ ok: false, error: "comment_too_long" }, { status: 400 });
    if (/(https?:\/\/|www\.|[a-zA-Z0-9-]+\.(com|net|org|io|app|sa)(\/|$))/i.test(comment)) return NextResponse.json({ ok: false, error: "links_not_allowed" }, { status: 400 });
    if (!target_id || !Number.isFinite(rating) || rating <= 0 || rating > 5) {
      return NextResponse.json({ ok: false, error: "invalid_fields" }, { status: 400 });
    }
    const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(target_id));
    if (!uuidOk) return NextResponse.json({ ok: false, error: "invalid_target_id" }, { status: 400 });
    try { await db.query("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE"); } catch {}
    const itemCheck = await db.query("SELECT 1 FROM haraj_items WHERE id = $1 LIMIT 1", [target_id]);
    if (itemCheck.rows.length === 0) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    const last = await db.query(
      "SELECT id, created_at FROM reviews WHERE customer_id = $1 AND target_id = $2 AND target_type = 'haraj' ORDER BY created_at DESC LIMIT 1",
      [session.id, target_id]
    );
    if (last.rows.length > 0) {
      const prev = new Date(last.rows[0].created_at).getTime();
      if (Date.now() - prev < 30_000) {
        return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
      }
      await db.query("UPDATE reviews SET rating = $1, comment = $2, created_at = now(), is_approved = TRUE WHERE id = $3", [
        rating,
        comment,
        last.rows[0].id,
      ]);
    } else {
      await db.query(
        "INSERT INTO reviews (customer_id, target_id, target_type, rating, comment, is_approved) VALUES ($1, $2, 'haraj', $3, $4, TRUE)",
        [session.id, target_id, rating, comment]
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
