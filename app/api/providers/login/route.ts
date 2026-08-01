import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const emailRaw = clean(body?.email);
    const phoneRaw = clean(body?.phone);
    const password = clean(body?.password);
    if (!password || (!emailRaw && !phoneRaw)) {
      return json(false, { error: "missing_credentials" }, 400);
    }

    const identifierIsEmail = isEmail(emailRaw);
    const email = identifierIsEmail ? emailRaw : "";
    const phone = normalizePhone(identifierIsEmail ? "" : phoneRaw);

    let row: any | null = null;
    if (email) {
      const res = await db.query("SELECT * FROM provider_requests WHERE email = $1 LIMIT 1", [email]);
      row = res.rows[0] || null;
    } else if (phone) {
      const res = await db.query("SELECT * FROM provider_requests WHERE phone = $1 LIMIT 1", [phone]);
      row = res.rows[0] || null;
    }

    if (!row) {
      const alt = await db.query(
        "SELECT * FROM customers WHERE " + (email ? "email = $1" : "phone = $1") + " LIMIT 1",
        [email || phone]
      );
      const cust = alt.rows[0] || null;
      if (!cust) return json(false, { error: "invalid_credentials" }, 401);
      const ok = await bcrypt.compare(password, clean(cust.password));
      if (!ok) return json(false, { error: "invalid_credentials" }, 401);
      const token = crypto.randomBytes(24).toString("hex");
      const res = NextResponse.json({ ok: true, role: "customer", redirect: "/customer/dashboard" });
      res.cookies.set("customer_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }

    const ok = await bcrypt.compare(password, clean(row.password_hash));
    if (!ok) return json(false, { error: "invalid_credentials" }, 401);

    if (!row.is_verified) {
      return json(false, { error: "not_verified", message: "verification_sent_email" }, 403);
    }

    const SECRET = clean(process.env.PROVIDER_SESSION_SECRET);
    if (!SECRET) {
      return json(false, { error: "server_not_configured", message: "missing_provider_session_secret" }, 500);
    }
    const payloadObj = {
      id: row.id,
      email: clean(row.email || ""),
      phone: clean(row.phone || ""),
      name: clean(row.name || ""),
      city: clean(row.city || ""),
      service: clean(row.service_type || ""),
      status: clean(row.status || "pending"),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    };
    const payload = JSON.stringify(payloadObj);
    const token = Buffer.from(`${payload}.${sign(payload, SECRET)}`).toString("base64url");

    const res = NextResponse.json({ ok: true, role: "provider", redirect: "/providers/dashboard" });
    res.cookies.set("kashtat_provider_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}
