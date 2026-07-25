import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/auth-admin";

export const dynamic = "force-dynamic";

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS banner_announcements (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("kashtat_admin")?.value;
    if (!verifyAdminSession(adminToken)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    await ensureTable();
    const res = await db.query("SELECT id, text, active, created_at FROM banner_announcements ORDER BY created_at DESC");
    return NextResponse.json({ ok: true, items: res.rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("kashtat_admin")?.value;
    if (!verifyAdminSession(adminToken)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null) as { text?: string; active?: boolean } | null;
    const text = String(body?.text || "").trim();
    const active = body?.active !== false;
    if (!text) return NextResponse.json({ ok: false, error: "Missing text" }, { status: 400 });

    await ensureTable();
    const res = await db.query("INSERT INTO banner_announcements (text, active) VALUES ($1, $2) RETURNING id", [text, active]);
    return NextResponse.json({ ok: true, id: res.rows[0]?.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("kashtat_admin")?.value;
    if (!verifyAdminSession(adminToken)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id") || 0);
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    await ensureTable();
    await db.query("DELETE FROM banner_announcements WHERE id = $1", [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
