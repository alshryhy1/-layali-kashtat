import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sbAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function getClientIp(req: Request): string {
  const h = req.headers;
  const xff = h.get("x-forwarded-for") || "";
  const xrip = h.get("x-real-ip") || "";
  return ((xff.split(",")[0] || "").trim() || xrip.trim() || "local").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const id = String(body.id || "").trim();
    const status = String(body.status || "").trim().toLowerCase();

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
    }

    const admin = sbAdmin();

    // 1) تحديث الحالة (الأساس)
    const { error } = await admin.from("provider_requests").update({ status }).eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // 2) Audit Log (نهائي) — لا نكسر العملية الأساسية إذا فشل الإدخال
    // actor هنا "admin" لأن التحقق الفعلي يتم عبر حماية مسارات الأدمن/الكوكي عندك
    // وإذا تبغاه يقرأ اسم الأدمن من الكوكي (موقّع) قلّي وبنسويه بشكل نهائي.
    const ip = getClientIp(req);
    const action = status === "approved" ? "requests.approve" : status === "rejected" ? "requests.reject" : "requests.pending";

    const auditInsert = await admin.from("admin_audit_log").insert([
      {
        action,
        actor: "admin",
        ip,
        target: id,
        meta: { id, status },
      },
    ]);

    if (auditInsert.error) {
      // لا نرجّع 500 عشان ما نخرب قبول/رفض عندك
      console.error("AUDIT_LOG_INSERT_FAILED:", auditInsert.error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
