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
  const ratingRaw = String(body?.rating ?? "").trim();

  if (!ref) return jsonError(400, "missing_ref", "يرجى إدخال رقم الطلب.");
  if (!contactRaw) return jsonError(400, "missing_contact", "يرجى إدخال الجوال أو الإيميل.");

  const contact = looksLikeEmailOrPhone(contactRaw);
  if (contact.kind === "unknown" || contact.kind === "none") {
    return jsonError(400, "invalid_contact", "صيغة الجوال أو الإيميل غير صحيحة.");
  }

  let rating: number | null = null;
  if (ratingRaw !== "") {
    const n = Number(ratingRaw);
    if (!Number.isFinite(n) || n < 1 || n > 5) {
      return jsonError(400, "invalid_rating", "الرجاء اختيار تقييم بين 1 و 5.");
    }
    rating = Math.round(n);
  }

  let data: any = null;
  try {
    const r = await db.query(
      "SELECT id,ref,status,completed,phone,email FROM customer_requests WHERE ref = $1 LIMIT 1",
      [ref]
    );
    data = r.rows[0] || null;
  } catch {
    return jsonError(500, "db_read_failed", "تعذر جلب بيانات الطلب.");
  }
  if (!data?.ref) return jsonError(404, "not_found", "رقم الطلب غير موجود.");

  const dbPhone = normalizePhone(data.phone || "");
  const dbEmail = normalizeEmail(data.email || "");

  const okMatch =
    (contact.kind === "phone" && contact.value && dbPhone && contact.value === dbPhone) ||
    (contact.kind === "email" && contact.value && dbEmail && contact.value === dbEmail);

  if (!okMatch) {
    return jsonError(403, "contact_mismatch", "الجوال/الإيميل لا يطابق هذا الطلب.");
  }

  // سياسة التشغيل: لا نسمح بإنهاء طلب مرفوض
  const status = normalizeStatus(data.status);
  if (status === "rejected") {
    return jsonError(409, "cannot_complete_rejected", "لا يمكن إنهاء طلب مرفوض.");
  }

  // لو مكتمل مسبقًا
  if (data.completed === true) {
    return NextResponse.json({
      ok: true,
      ref: data.ref,
      status,
      completed: true,
      updated: false,
      reason: "already_completed",
    });
  }

  const nowIso = new Date().toISOString();

  try {
    await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS customer_rating integer");
    await db.query("CREATE TABLE IF NOT EXISTS status_history (id bigserial primary key, ref text, event text, provider_id bigint, note text, created_at timestamptz default now())");
    await db.query("CREATE TABLE IF NOT EXISTS ratings (id bigserial primary key, ref text, provider_id bigint, rating integer, created_at timestamptz default now())");
  } catch {}

  try {
    const r = await db.query("SELECT accepted_provider_id FROM customer_requests WHERE ref = $1 LIMIT 1", [ref]);
    const pid = r.rows[0]?.accepted_provider_id ?? null;
    await db.query(
      "UPDATE customer_requests SET completed = true, customer_rating = COALESCE($3, customer_rating), updated_at = $2 WHERE ref = $1",
      [ref, nowIso, rating]
    );
    await db.query("INSERT INTO status_history (ref, event, provider_id, note) VALUES ($1,'completed',$2,$3)", [ref, pid, rating !== null ? `rating=${rating}` : ""]);
    if (rating !== null && pid) {
      await db.query("INSERT INTO ratings (ref, provider_id, rating) VALUES ($1,$2,$3)", [ref, pid, rating]);
    }
  } catch {
    return jsonError(500, "db_update_failed", "تعذر إنهاء الطلب. حاول مرة أخرى.");
  }

  return NextResponse.json({
    ok: true,
    ref,
    status,
    completed: true,
    updated: true,
    updated_at: nowIso,
    customer_rating: rating ?? null,
  });
}
