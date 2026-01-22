import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const token = String(body?.token || "").trim();
    const password = String(body?.password || "").trim();

    if (!token) return jsonError(400, "missing_token", "رابط غير صالح.");
    if (!password || password.length < 6) return jsonError(400, "invalid_password", "كلمة المرور قصيرة.");

    // Find user by token and expiry
    const r = await db.query(
      "SELECT id FROM provider_requests WHERE reset_token = $1 AND reset_token_expiry > NOW() LIMIT 1",
      [token]
    );

    if (r.rows.length === 0) {
      return jsonError(400, "invalid_token", "الرابط غير صالح أو منتهي الصلاحية.");
    }

    const userId = r.rows[0].id;

    // Hash new password
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    const password_hash = `${salt}:${hash}`;

    // Update password and clear token
    await db.query(
      "UPDATE provider_requests SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
      [password_hash, userId]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Reset API Error:", e);
    return jsonError(500, "server_error", "حدث خطأ غير متوقع.");
  }
}
