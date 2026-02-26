import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/authentica";
import { db } from "@/lib/db";
import { signToken } from "@/lib/auth-customer";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function toInternational(phone: string) {
  let s = clean(phone).replace(/[^0-9]/g, "");
  if (!s) return "";
  if (s.startsWith("00966")) s = s.slice(5);
  if (s.startsWith("966")) return s;
  if (s.startsWith("05")) return "966" + s.slice(1);
  if (s.startsWith("5")) return "966" + s;
  return s;
}

function toLocal(phone: string) {
  let s = clean(phone).replace(/[^0-9]/g, "");
  if (!s) return "";
  if (s.startsWith("00966")) s = s.slice(5);
  if (s.startsWith("966")) s = s.slice(3);
  if (s.startsWith("5")) s = "0" + s;
  return s;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phoneRaw = clean(body?.phone);
    const otp = clean(body?.otp);
    const role = clean(body?.role || "customer");

    if (!phoneRaw || !otp) {
      return NextResponse.json({ ok: false, error: "missing_phone_or_otp" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const atMeta = JSON.parse(cookieStore.get("lk_otp_attempts")?.value || "{}");
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const attempts = Array.isArray(atMeta?.list) ? atMeta.list.filter((t: number) => now - t < windowMs) : [];
    if (attempts.length >= 5) {
      return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
    }
    attempts.push(now);
    cookieStore.set("lk_otp_attempts", JSON.stringify({ list: attempts }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    const intl = toInternational(phoneRaw);
    const local = toLocal(phoneRaw);

    await verifyOTP(intl, otp);

    // reset attempts on success
    try {
      cookieStore.set("lk_otp_attempts", JSON.stringify({ list: [] }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    } catch {}

    if (role === "provider") {
      const res = await db.query(
        "SELECT id, name, email, phone, city, service_type, is_verified FROM provider_requests WHERE phone = $1 OR phone = $2 LIMIT 1",
        [local, phoneRaw]
      );
      if (res.rows.length === 0) {
        return NextResponse.json({ ok: false, error: "provider_not_found" }, { status: 404 });
      }
      const row = res.rows[0];
      if (!row.is_verified) {
        await db.query("UPDATE provider_requests SET is_verified = true WHERE id = $1", [row.id]);
      }
      return NextResponse.json({ ok: true, verified: true, role: "provider" }, { status: 200 });
    }

    const res = await db.query(
      "SELECT id, name, email, phone, is_verified FROM customers WHERE phone = $1 OR phone = $2 LIMIT 1",
      [phoneRaw, local]
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "customer_not_found" }, { status: 404 });
    }
    const user = res.rows[0];
    if (!user.is_verified) {
      await db.query("UPDATE customers SET is_verified = true WHERE id = $1", [user.id]);
    }

    const token = signToken({
      id: user.id,
      name: clean(user.name),
      phone: clean(user.phone),
      email: clean(user.email),
      role: "customer",
    });
    const cookieStore2 = await cookies();
    cookieStore2.set("customer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ ok: true, verified: true, role: "customer" }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server_error" }, { status: 500 });
  }
}
