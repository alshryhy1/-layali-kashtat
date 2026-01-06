import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import crypto from "crypto";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function verify(token: string, secret: string) {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const [payloadStr, sig] = raw.split(".");
    if (!payloadStr || !sig) return null;
    
    const expectedSig = sign(payloadStr, secret);
    if (sig !== expectedSig) return null;

    const payload = JSON.parse(payloadStr);
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("kashtat_provider_token")?.value;

    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const SECRET = process.env.PROVIDER_SESSION_SECRET || "lk_provider_secret_123";
    const session = verify(token, SECRET);

    if (!session || !session.id) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const oldPassword = String(body?.oldPassword || "").trim();
    const newPassword = String(body?.newPassword || "").trim();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ ok: false, error: "password_too_short" }, { status: 400 });
    }

    // Verify old password against DB
    const r = await db.query("SELECT id, password_hash FROM provider_requests WHERE id = $1 LIMIT 1", [session.id]);
    if (r.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
    }

    const user = r.rows[0];
    if (!user.password_hash) {
      return NextResponse.json({ ok: false, error: "no_password_set" }, { status: 400 });
    }

    const [salt, key] = user.password_hash.split(":");
    const oldHash = crypto.scryptSync(oldPassword, salt, 64).toString("hex");

    if (key !== oldHash) {
      return NextResponse.json({ ok: false, error: "invalid_old_password" }, { status: 401 });
    }

    // Set new password
    const newSalt = crypto.randomBytes(16).toString("hex");
    const newHash = crypto.scryptSync(newPassword, newSalt, 64).toString("hex");
    const password_hash = `${newSalt}:${newHash}`;

    await db.query("UPDATE provider_requests SET password_hash = $1 WHERE id = $2", [password_hash, session.id]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Change password error:", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
