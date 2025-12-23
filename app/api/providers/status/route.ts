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

function normalizePhone(v: string) {
  return String(v || "").replace(/[^\d]/g, "").trim();
}

export async function GET(req: Request) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE) {
      return json(
        false,
        { error: "Missing env: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
        500
      );
    }

    const url = new URL(req.url);
    const ref = String(url.searchParams.get("ref") || "").trim(); // expects: LK-57
    const phoneRaw = String(url.searchParams.get("phone") || "").trim();
    const phone = normalizePhone(phoneRaw);

    if (!ref) return json(false, { error: "Invalid ref" }, 400);
    if (!phone) return json(false, { error: "Invalid phone" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("provider_requests")
      .select("ref_code,status,created_at")
      .eq("ref_code", ref)
      .eq("phone", phone)
      .maybeSingle();

    if (error) return json(false, { error: "Database error" }, 500);
    if (!data) return json(false, { error: "Not found" }, 404);

    const status = String(data.status || "pending");
    const normalized =
      status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";

    return json(
      true,
      { ref: data.ref_code, status: normalized, updated_at: data.created_at ?? null },
      200
    );
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
