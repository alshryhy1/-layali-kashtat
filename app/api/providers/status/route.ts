import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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

export async function GET(req: Request) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const ANON = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !ANON) {
      return json(false, { error: "Missing env: SUPABASE_URL or SUPABASE_ANON_KEY." }, 500);
    }

    const url = new URL(req.url);
    const refRaw = (url.searchParams.get("ref") || "").trim();
    const phoneRaw = (url.searchParams.get("phone") || "").trim();

    const ref = Number(refRaw);
    if (!refRaw || !Number.isFinite(ref) || !Number.isInteger(ref) || ref <= 0) {
      return json(false, { error: "Invalid ref" }, 400);
    }
    if (!phoneRaw) {
      return json(false, { error: "Phone is required" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, ANON, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.rpc("get_provider_request_status", {
      p_ref: ref,
      p_phone: phoneRaw,
    });

    if (error) return json(false, { error: error.message }, 500);

    const row = Array.isArray(data) ? data[0] : null;
    const ok = Boolean(row?.ok);

    if (!row) return json(false, { error: "Server error" }, 500);

    if (!ok) {
      const e = String(row?.error || "").toLowerCase();
      if (e === "not_found") return json(false, { error: "Not found" }, 404);
      if (e === "phone_mismatch") return json(false, { error: "Phone mismatch" }, 403);
      if (e === "invalid_ref") return json(false, { error: "Invalid ref" }, 400);
      if (e === "invalid_phone") return json(false, { error: "Invalid phone" }, 400);
      if (e === "phone_missing") return json(false, { error: "Request phone missing in database" }, 500);
      return json(false, { error: "Invalid" }, 400);
    }

    const status = String(row?.status || "pending");
    const normalized =
      status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";

    // نخلي updated_at موجود (null) عشان لو صفحتك تتوقعه ما تنكسر
    return json(true, { ref: Number(row?.ref || ref), status: normalized, updated_at: null }, 200);
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
export async function PATCH() {
  return json(false, { error: "Method Not Allowed" }, 405);
}
export async function DELETE() {
  return json(false, { error: "Method Not Allowed" }, 405);
}
