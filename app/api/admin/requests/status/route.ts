import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

type Status = "pending" | "approved" | "rejected";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json(
    { ok, ...data },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// ✅ تحقق أدمن عبر Cookie موقّع (يدعم أكثر من صيغة فاصلة)
function isAdminAuthed(req: Request) {
  const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "").trim();
  const SECRET = (process.env.ADMIN_SESSION_SECRET || "").trim();
  if (!ADMIN_USERNAME || !SECRET) return false;

  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)admin_session=([^;]+)/);
  if (!m) return false;

  const raw = decodeURIComponent(m[1] || "").trim();
  // صيغ مدعومة:
  // username.exp.sig  أو  username:exp:sig  أو  username|exp|sig
  const parts =
    raw.includes(".") ? raw.split(".") : raw.includes(":") ? raw.split(":") : raw.split("|");
  if (parts.length !== 3) return false;

  const [u, expRaw, sig] = parts;
  if (!u || !expRaw || !sig) return false;
  if (u !== ADMIN_USERNAME) return false;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp <= 0) return false;
  if (Date.now() > exp) return false;

  const payload = `${u}.${exp}`;
  const expected = sign(payload, SECRET);
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function normalizeStatus(v: any): Status | null {
  const s = String(v || "").toLowerCase().trim();
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "pending") return "pending";
  return null;
}

function parseIntSafe(v: any) {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

export async function GET(req: Request) {
  try {
    if (!isAdminAuthed(req)) return json(false, { error: "Unauthorized" }, 401);

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return json(false, { error: "Missing env: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" }, 500);
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const statusFilter = normalizeStatus(url.searchParams.get("status"));
    const limit = Math.min(Math.max(parseIntSafe(url.searchParams.get("limit")) || 200, 1), 200);
    const offset = Math.max(parseIntSafe(url.searchParams.get("offset")) || 0, 0);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // أعمدة نعرضها للأدمن (مطابقة لجدولك)
    let query = supabase
      .from("provider_requests")
      .select("id,name,phone,service_type,city,status", { count: "exact" })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    // بحث بسيط وآمن عبر ilike (اسم/جوال/مدينة/نوع)
    if (q) {
      const qq = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
      // ملاحظة: or(...) في supabase-js صيغة string
      query = query.or(
        `name.ilike.%${qq}%,phone.ilike.%${qq}%,city.ilike.%${qq}%,service_type.ilike.%${qq}%`
      );
    }

    const { data, error, count } = await query;
    if (error) return json(false, { error: error.message }, 500);

    return json(true, { items: data || [], count: count ?? null, limit, offset }, 200);
  } catch (e: any) {
    return json(false, { error: e?.message || "Server error" }, 500);
  }
}

export async function PATCH(req: Request) {
  try {
    if (!isAdminAuthed(req)) return json(false, { error: "Unauthorized" }, 401);

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return json(false, { error: "Missing env: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" }, 500);
    }

    const body = (await req.json().catch(() => null)) as
      | { id?: number; status?: string }
      | null;

    const id = parseIntSafe(body?.id);
    const status = normalizeStatus(body?.status);

    if (!id) return json(false, { error: "Invalid id" }, 400);
    if (!status) return json(false, { error: "Invalid status" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("provider_requests")
      .update({ status })
      .eq("id", id)
      .select("id,status")
      .maybeSingle();

    if (error) return json(false, { error: error.message }, 500);
    if (!data) return json(false, { error: "Not found" }, 404);

    return json(true, { updated: data }, 200);
  } catch (e: any) {
    return json(false, { error: e?.message || "Server error" }, 500);
  }
}

export async function POST() {
  return json(false, { error: "Method Not Allowed" }, 405);
}
export async function PUT() {
  return json(false, { error: "Method Not Allowed" }, 405);
}
export async function DELETE() {
  return json(false, { error: "Method Not Allowed" }, 405);
}
