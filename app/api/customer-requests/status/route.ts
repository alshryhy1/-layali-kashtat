import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

function safeText(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function normalizePhone(input: string) {
  const s = safeText(input);
  const map: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  const ascii = s.replace(/[٠-٩]/g, (d) => map[d] ?? d).replace(/\s+/g, "");
  return ascii.replace(/[^0-9+]/g, "");
}

function normalizeEmail(input: string) {
  return safeText(input).toLowerCase();
}

function isValidEmail(email: string) {
  const e = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function looksLikeEmailOrPhone(v: string) {
  const s = safeText(v);
  if (!s) return { kind: "none" as const, value: "" };
  const e = normalizeEmail(s);
  if (isValidEmail(e)) return { kind: "email" as const, value: e };
  const p = normalizePhone(s);
  if (p && p.length >= 8) return { kind: "phone" as const, value: p };
  return { kind: "unknown" as const, value: s };
}

function normalizeStatus(s: string) {
  const v = safeText(s).toLowerCase();
  if (v === "approved") return "approved";
  if (v === "rejected") return "rejected";
  return "pending";
}

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const ref = safeText(body?.ref);
  const contactRaw = safeText(body?.contact);

  if (!ref) return jsonError(400, "missing_ref", "يرجى إدخال رقم الطلب.");
  if (!contactRaw) return jsonError(400, "missing_contact", "يرجى إدخال الجوال أو الإيميل.");

  const contact = looksLikeEmailOrPhone(contactRaw);
  if (contact.kind === "unknown" || contact.kind === "none") {
    return jsonError(400, "invalid_contact", "صيغة الجوال أو الإيميل غير صحيحة.");
  }

  try {
    const r = await db.query(
      "SELECT ref,status,completed,phone,email,city,service_type,updated_at,accepted_provider_id,accepted_provider_name,accepted_provider_phone,accepted_provider_email,accepted_price_total,accepted_price_currency,accepted_price_notes,accepted_meeting_location,accepted_payment_method,accepted_payment_details,provider_status,provider_current_lat,provider_current_lng,route_polyline,eta FROM customer_requests WHERE ref = $1 LIMIT 1",
      [ref]
    );
    const row = r.rows[0];
    if (!row?.ref) return jsonError(404, "not_found", "رقم الطلب غير موجود.");

    const dbPhone = normalizePhone(row.phone || "");
    const dbEmail = normalizeEmail(row.email || "");
    const okMatch =
      (contact.kind === "phone" && contact.value && dbPhone && contact.value === dbPhone) ||
      (contact.kind === "email" && contact.value && dbEmail && contact.value === dbEmail);

    if (!okMatch) {
      return jsonError(403, "contact_mismatch", "الجوال/الإيميل لا يطابق هذا الطلب.");
    }

    const status = normalizeStatus(row.status || "");

    return NextResponse.json({
      ok: true,
      ref: row.ref,
      status,
      completed: !!row.completed,
      city: safeText(row.city || ""),
      service_type: safeText(row.service_type || ""),
      updated_at: safeText(row.updated_at || ""),
      accepted_provider_id: row.accepted_provider_id ?? null,
      accepted_provider_name: safeText(row.accepted_provider_name || ""),
      accepted_provider_phone: safeText(row.accepted_provider_phone || ""),
      accepted_provider_email: safeText(row.accepted_provider_email || ""),
      accepted_price_total:
        row.accepted_price_total === null || row.accepted_price_total === undefined
          ? null
          : Number(row.accepted_price_total),
      accepted_price_currency: safeText(row.accepted_price_currency || ""),
      accepted_price_notes: safeText(row.accepted_price_notes || ""),
      accepted_meeting_location: safeText(row.accepted_meeting_location || ""),
      accepted_payment_method: safeText(row.accepted_payment_method || ""),
      accepted_payment_details: safeText(row.accepted_payment_details || ""),
      provider_status: safeText(row.provider_status || "accepted"),
      provider_current_lat: row.provider_current_lat ? Number(row.provider_current_lat) : null,
      provider_current_lng: row.provider_current_lng ? Number(row.provider_current_lng) : null,
      route_polyline: row.route_polyline,
      eta: row.eta ? Number(row.eta) : null,
    });
  } catch {
    return jsonError(500, "db_read_failed", "تعذر جلب بيانات الطلب.");
  }
}
