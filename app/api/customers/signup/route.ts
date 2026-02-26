import { NextResponse } from "next/server";
import { db } from "@/lib/db";
// nodemailer disabled for OTP-only flow
import bcrypt from "bcrypt";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(ok: boolean, data: any = {}, status = 200) {
  return NextResponse.json({ ok, ...data }, { status });
}
function clean(v: unknown) {
  return String(v ?? "").trim();
}
function isEmail(s: string) {
  const v = clean(s).toLowerCase();
  return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function normalizePhone(raw: string) {
  let s = clean(raw).replace(/[^\d]/g, "");
  if (!s) return "";
  if (s.startsWith("00966")) s = s.slice(5);
  if (s.startsWith("966")) s = s.slice(3);
  if (s.startsWith("5")) s = `0${s}`;
  return s;
}
async function getMailer() { return null; }

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const name = clean(body?.name);
    const email = clean(body?.email);
    const phone = normalizePhone(body?.phone || "");
    const password = clean(body?.password);
    const accepted = !!body?.accepted;

    if (!accepted) {
      return json(false, { error: "must_accept" }, 400);
    }
    if (!name || !phone || !password || !email) {
      return json(false, { error: "missing_fields" }, 400);
    }
    if (!isEmail(email)) return json(false, { error: "invalid_email" }, 400);
    if (phone.length < 9) return json(false, { error: "invalid_phone" }, 400);
    if (phone && phone.length < 9) return json(false, { error: "invalid_phone" }, 400);

    const check = await db.query(
      "SELECT id FROM customers WHERE (email = $1 AND $1 IS NOT NULL AND $1 <> '') OR (phone = $2 AND $2 IS NOT NULL AND $2 <> '') LIMIT 1",
      [email || null, phone || null]
    );
    if (check.rows.length > 0) return json(false, { error: "duplicate_entry" }, 409);

    const hash = await bcrypt.hash(password, 10);
    const verification_token = crypto.randomBytes(24).toString("hex");

    const ins = await db.query(
      "INSERT INTO customers (name, email, phone, password, is_verified, verification_token) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
      [name, email, phone, hash, false, verification_token]
    );
    const id = ins.rows[0]?.id;

    return json(true, { id, message: "verification_required_otp" });
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}
