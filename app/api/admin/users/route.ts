import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/auth-admin";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
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
    const res = await db.query("SELECT id, username, created_at FROM admins ORDER BY created_at DESC");
    return NextResponse.json({ ok: true, admins: res.rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("kashtat_admin")?.value;
    if (!verifyAdminSession(adminToken)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null) as { username?: string; password?: string } | null;
    const username = String(body?.username || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();
    if (!username || !password) return NextResponse.json({ ok: false, error: "Missing username/password" }, { status: 400 });

    await ensureTable();
    const hash = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO admins (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING", [username, hash]);
    return NextResponse.json({ ok: true });
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
    const username = String(searchParams.get("username") || "").trim().toLowerCase();
    if (!username) return NextResponse.json({ ok: false, error: "Missing username" }, { status: 400 });

    await ensureTable();
    await db.query("DELETE FROM admins WHERE username = $1", [username]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
