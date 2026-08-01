import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { setSession } from "@/lib/auth-customer";

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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const emailRaw = clean(body?.email);
    const phoneRaw = clean(body?.phone);
    const password = clean(body?.password);
    if (!password || (!emailRaw && !phoneRaw)) return json(false, { error: "missing_credentials" }, 400);

    const isEmailId = isEmail(emailRaw);
    const email = isEmailId ? emailRaw : "";
    const phone = isEmailId ? "" : normalizePhone(phoneRaw);

    let row: any | null = null;
    if (email) {
      const res = await db.query("SELECT * FROM customers WHERE email = $1 LIMIT 1", [email]);
      row = res.rows[0] || null;
    } else if (phone) {
      const res = await db.query("SELECT * FROM customers WHERE phone = $1 LIMIT 1", [phone]);
      row = res.rows[0] || null;
    }
    if (!row) return json(false, { error: "invalid_credentials" }, 401);

    const ok = await bcrypt.compare(password, clean(row.password));
    if (!ok) return json(false, { error: "invalid_credentials" }, 401);

    if (!row.is_verified) {
      return json(false, { error: "not_verified", message: "verification_sent_email" }, 403);
    }

    await setSession({
      id: row.id,
      name: clean(row.name || ""),
      phone: clean(row.phone || ""),
      email: clean(row.email || ""),
    });
    return json(true, { redirect: "/customer/dashboard" });
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}
