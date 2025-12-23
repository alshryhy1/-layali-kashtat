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

function normalizePhone(raw: string) {
  let s = String(raw || "").trim().replace(/[^\d]/g, "");

  if (s.startsWith("00966")) s = s.replace(/^00966/, "");
  if (s.startsWith("966")) s = s.replace(/^966/, "");

  if (s.length === 9 && s.startsWith("5")) s = `0${s}`;
  return s;
}

export async function GET(req: Request) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SRV) {
      return json(false, { error: "Missing env: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." }, 500);
    }

    const url = new URL(req.url);

    const refRaw = String(url.searchParams.get("ref") || "").trim();
    const phoneRaw = String(url.searchParams.get("phone") || "").trim();

    const ref = Number(refRaw);

    if (!refRaw || !Number.isFinite(ref) || !Number.isInteger(ref) || ref <= 0) {
      return json(false, { error: "Invalid ref" }, 400);
    }

    if (!phoneRaw) {
      return json(false, { error: "Phone is required" }, 400);
    }

    const phone = normalizePhone(phoneRaw);
    if (!/^05\d{8}$/.test(phone)) {
      return json(false, { error: "Invalid phone" }, 400);
    }

    // ✅ Server-side (Service Role) to avoid RLS issues
    const supabase = createClient(SUPABASE_URL, SRV, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("provider_requests")
      .select("id, phone, status")
      .eq("id", ref)
      .single();

    if (error) {
      // Supabase: if no row found -> return 404 (common patterns: PGRST116)
      const msg = String((error as any)?.message || "");
      const code = String((error as any)?.code || "");
      if (code === "PGRST116" || msg.toLowerCase().includes("0 rows")) {
        return json(false, { error: "Not found" }, 404);
      }
      return json(false, { error: msg || "Server error" }, 500);
    }

    if (!data) return json(false, { error: "Not found" }, 404);

    const dbPhone = normalizePhone(String((data as any).phone || ""));
    if (!dbPhone) return json(false, { error: "Request phone missing in database" }, 500);

    if (dbPhone !== phone) {
      return json(false, { error: "Phone mismatch" }, 403);
    }

    const st = String((data as any).status || "pending").toLowerCase();
    const normalized = st === "approved" ? "approved" : st === "rejected" ? "rejected" : "pending";

    return json(true, { ref, status: normalized, updated_at: null }, 200);
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
