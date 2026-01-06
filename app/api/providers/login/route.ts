import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "missing_credentials" }, { status: 400 });
    }

    // Check provider_requests table
    // Note: status check? Maybe only approved providers can login?
    // For now allow all, but dashboard might restrict view.
    // User asked for "dashboard shows requests", implies approved.
    const r = await db.query("SELECT id, name, email, password_hash, city, service_type, status FROM provider_requests WHERE email = $1 LIMIT 1", [email]);
    
    if (r.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
    }

    const user = r.rows[0];

    // Enforce approval for login
    if (String(user.status || "") !== "approved") {
      return NextResponse.json({ ok: false, error: "not_approved" }, { status: 403 });
    }

    if (!user.password_hash) {
      // If user has no password (old account), they can't login yet.
      return NextResponse.json({ ok: false, error: "no_password_set" }, { status: 401 });
    }

    const [salt, key] = user.password_hash.split(":");
    if (!salt || !key) {
       return NextResponse.json({ ok: false, error: "invalid_hash_format" }, { status: 500 });
    }
    
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    if (key !== hash) {
      return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
    }

    const SECRET = process.env.PROVIDER_SESSION_SECRET || "lk_provider_secret_123";
    const payload = JSON.stringify({ 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      city: user.city, 
      service: user.service_type, 
      status: user.status,
      exp: Date.now() + 7 * 24 * 3600 * 1000 // 7 days
    });
    const sig = sign(payload, SECRET);
    const token = Buffer.from(`${payload}.${sig}`).toString("base64url");

    const res = NextResponse.json({ ok: true });
    res.cookies.set("kashtat_provider_token", token, { 
      httpOnly: true, 
      path: "/", 
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 3600 
    });
    return res;

  } catch (e: any) {
    console.error("Login error:", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
