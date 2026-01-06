import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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

type AttemptRow = { count: number; lockedUntil: number; updatedAt: number };
function attemptsPath() {
  return path.join(process.cwd(), "data", "admin_login_attempts.json");
}
function loadAttempts(): Record<string, AttemptRow> {
  try {
    const p = attemptsPath();
    if (!fs.existsSync(p)) return {};
    const raw = fs.readFileSync(p, "utf8");
    const arr = JSON.parse(raw) as Array<{ key: string } & AttemptRow> | Record<string, AttemptRow>;
    if (Array.isArray(arr)) {
      const out: Record<string, AttemptRow> = {};
      for (const r of arr) {
        if (r && typeof r.key === "string") out[r.key] = { count: r.count || 0, lockedUntil: r.lockedUntil || 0, updatedAt: r.updatedAt || 0 };
      }
      return out;
    }
    return arr as Record<string, AttemptRow>;
  } catch {
    return {};
  }
}
function saveAttempts(map: Record<string, AttemptRow>) {
  try {
    const p = attemptsPath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const list = Object.entries(map).map(([key, v]) => ({ key, ...v }));
    fs.writeFileSync(p, JSON.stringify(list, null, 2), "utf8");
  } catch {
  }
}
function localCheck(key: string) {
  const m = loadAttempts();
  const row = m[key];
  const now = Date.now();
  const locked = !!row && Number(row.lockedUntil || 0) > now;
  const retryAfterSec = locked ? Math.ceil((Number(row.lockedUntil) - now) / 1000) : 0;
  return { locked, retryAfterSec };
}
function localRegisterFailure(key: string) {
  const m = loadAttempts();
  const now = Date.now();
  const cur = m[key] || { count: 0, lockedUntil: 0, updatedAt: 0 };
  let count = (cur.count || 0) + 1;
  let lockedUntil = cur.lockedUntil || 0;
  if (count >= MAX_ATTEMPTS) {
    lockedUntil = now + LOCK_MINUTES * 60 * 1000;
    count = 0;
  }
  m[key] = { count, lockedUntil, updatedAt: now };
  saveAttempts(m);
  const locked = lockedUntil > now;
  const retryAfterSec = locked ? Math.ceil((lockedUntil - now) / 1000) : 0;
  return { locked, retryAfterSec };
}
function localReset(key: string) {
  const m = loadAttempts();
  const now = Date.now();
  m[key] = { count: 0, lockedUntil: 0, updatedAt: now };
  saveAttempts(m);
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

  // 1) Check lock (DB) — إذا فشل الـ RPC نسمح بالمتابعة (وضع تطوير)
  {
    try {
      const { data, error } = await admin.rpc("admin_login_attempts_check", { p_key: key });
      if (error) throw error;
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
    } catch {
      const local = localCheck(key);
      if (local.locked) {
        const res = jsonNoStore(
          { ok: false, error: "locked", retryAfterSec: Math.max(1, local.retryAfterSec) },
          { status: 429 }
        );
        res.headers.set("Retry-After", String(Math.max(1, local.retryAfterSec)));
        return res;
      }
    }
  }

    // 2) Verify credentials
    const okCreds = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;

  if (!okCreds) {
    try {
      const { data, error } = await admin.rpc("admin_login_attempts_register_failure", {
        p_key: key,
        p_max_attempts: MAX_ATTEMPTS,
        p_lock_minutes: LOCK_MINUTES,
      });
      if (!error) {
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
    } catch {
      const local = localRegisterFailure(key);
      if (local.locked) {
        const res = jsonNoStore(
          { ok: false, error: "locked", retryAfterSec: Math.max(1, local.retryAfterSec) },
          { status: 429 }
        );
        res.headers.set("Retry-After", String(Math.max(1, local.retryAfterSec)));
        return res;
      }
    }
    return jsonNoStore({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

    // 3) SUCCESS => reset attempts (DB)
  {
    try {
      await admin.rpc("admin_login_attempts_reset", { p_key: key });
    } catch {
      localReset(key);
    }
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
