import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSession as setCustomerSession } from "@/lib/auth-customer";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any = {}, status = 200) {
  return NextResponse.json({ ok, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}
function clean(v: unknown) {
  return String(v ?? "").trim();
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
    const accessToken = clean(body?.accessToken || body?.["access-token"] || body?.token);
    const role = clean(body?.role || "customer").toLowerCase(); // customer | provider
    const phoneRaw = clean(body?.phone || "");

    const AUTH_KEY = clean(process.env.MSG91_AUTH_KEY);
    if (!AUTH_KEY) return json(false, { error: "missing_auth_key" }, 500);
    if (!accessToken) return json(false, { error: "missing_access_token" }, 400);

    const res = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authkey: AUTH_KEY,
        "access-token": accessToken,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return json(false, { error: "provider_error", details: data }, 200);
    }

    const widgetPhone = clean(
      data?.mobile || data?.phone || data?.identifier || data?.data?.mobile || data?.data?.phone
    );
    const phone = normalizePhone(widgetPhone || phoneRaw);

    const verified = !!phone;
    let user: any = null;

    if (verified) {
      if (role === "customer") {
        const alt = phone.startsWith("0") ? `966${phone.slice(1)}` : phone;
        const q = await db.query("SELECT * FROM customers WHERE phone = $1 OR phone = $2 LIMIT 1", [phone, alt]);
        if (q.rows.length > 0) {
          user = q.rows[0];
          if (!user.is_verified) {
            await db.query("UPDATE customers SET is_verified = true WHERE id = $1", [user.id]);
          }
          await setCustomerSession({
            id: String(user.id),
            name: clean(user.name || ""),
            phone: clean(user.phone || phone),
            email: clean(user.email || ""),
          });
        }
      } else {
        const alt = phone.startsWith("0") ? `966${phone.slice(1)}` : phone;
        const q = await db.query(
          "SELECT * FROM provider_requests WHERE phone = $1 OR phone = $2 LIMIT 1",
          [phone, alt]
        );
        if (q.rows.length > 0) {
          const pv = q.rows[0];
          if (!pv.is_verified) {
            await db.query("UPDATE provider_requests SET is_verified = true WHERE id = $1", [pv.id]);
          }
          const SECRET = clean(process.env.PROVIDER_SESSION_SECRET) || "lk_provider_secret_123";
          const payloadObj = {
            id: pv.id,
            email: clean(pv.email || ""),
            phone: clean(pv.phone || phone),
            name: clean(pv.name || ""),
            city: clean(pv.city || ""),
            service: clean(pv.service_type || ""),
            status: clean(pv.status || "pending"),
            exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
          };
          const payload = JSON.stringify(payloadObj);
          const token = Buffer.from(`${payload}.${sign(payload, SECRET)}`).toString("base64url");
          const resCookies = await cookies();
          resCookies.set("kashtat_provider_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
          });
        }
      }
    }

    return json(true, { verified: verified, phone }, 200);
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}
