import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { username?: string; password?: string };

// سياسة القفل
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function jsonNoStore(body: any, init?: { status?: number }) {
  const res = NextResponse.json(body, { status: init?.status ?? 200 });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

function getClientIp(req: Request): string {
  // ✅ نهائي: Route Handler يعتمد على req.headers (الأثبت)
  const xff = (req.headers.get("x-forwarded-for") || "").trim();
  const xrip = (req.headers.get("x-real-ip") || "").trim();
  const ip = (xff.split(",")[0] || "").trim() || xrip || "local";
  return ip;
}

function sbAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function makeKey(ip: string, username: string) {
  return `${ip}|${username.toLowerCase()}`;
}

export async function POST(req: Request) {
  try {
    const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "").trim();
    const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "").trim();
    const SECRET = process.env.ADMIN_SESSION_SECRET || "";

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !SECRET) {
      return jsonNoStore(
        { ok: false, error: "Missing env: ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_SESSION_SECRET" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "").trim();

    if (!username || !password) {
      return jsonNoStore({ ok: false, error: "Missing username/password" }, { status: 400 });
    }

    const ip = getClientIp(req);
    const key = makeKey(ip, username);

    const admin = sbAdmin();

    // 1) Check lock (DB)
    {
      const { data, error } = await admin.rpc("admin_login_attempts_check", { p_key: key });
      if (error) {
        return jsonNoStore({ ok: false, error: "Lock check failed" }, { status: 500 });
      }

      const row = Array.isArray(data) ? data[0] : data;
      const locked = Boolean(row?.locked);
      const retryAfterSec = Number(row?.retry_after_sec || 0);

      if (locked) {
        const res = jsonNoStore(
          { ok: false, error: "locked", retryAfterSec: Math.max(1, retryAfterSec) },
          { status: 429 }
        );
        res.headers.set("Retry-After", String(Math.max(1, retryAfterSec)));
        return res;
      }
    }

    // 2) Verify credentials
    const okCreds = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;

    if (!okCreds) {
      const { data, error } = await admin.rpc("admin_login_attempts_register_failure", {
        p_key: key,
        p_max_attempts: MAX_ATTEMPTS,
        p_lock_minutes: LOCK_MINUTES,
      });

      if (error) {
        return jsonNoStore({ ok: false, error: "Rate limit update failed" }, { status: 500 });
      }

      const row = Array.isArray(data) ? data[0] : data;
      const locked = Boolean(row?.locked);
      const retryAfterSec = Number(row?.retry_after_sec || 0);

      if (locked) {
        const res = jsonNoStore(
          { ok: false, error: "locked", retryAfterSec: Math.max(1, retryAfterSec) },
          { status: 429 }
        );
        res.headers.set("Retry-After", String(Math.max(1, retryAfterSec)));
        return res;
      }

      return jsonNoStore({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    // 3) SUCCESS => reset attempts (DB)
    {
      await admin.rpc("admin_login_attempts_reset", { p_key: key });
    }

    // 4) Issue session cookie (12h)
    const exp = Date.now() + 1000 * 60 * 60 * 12;
    const payload = JSON.stringify({ u: username, exp });
    const sig = sign(payload, SECRET);
    const token = Buffer.from(`${payload}.${sig}`, "utf8").toString("base64url");

    const res = jsonNoStore({ ok: true });

    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set("kashtat_admin", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch (e: any) {
    return jsonNoStore({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
