import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any = {}, status = 200) {
  return NextResponse.json({ ok, ...data }, { status });
}

function safe(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function isValidEmail(e: string) {
  const s = safe(e).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function normalizeCityAr(input: string) {
  const s = String(input || "").trim();
  const m = s.replace(/\s+/g, " ").toLowerCase();
  const maps: Record<string, string[]> = {
    "مكة المكرمة": ["مكة", "مكه", "مكه المكرمه", "مكة المكرمة"],
    "المدينة المنورة": ["المدينة", "المدينه", "المدينه المنوره", "المدينة المنورة"],
    "جدة": ["جدة", "جده"],
    "العلا": ["العلا", "العلاء"],
    "حائل": ["حائل", "حايل"],
    "الرياض": ["الرياض", "رياض"],
    "القصيم": ["القصيم", "قصيم"],
    "تبوك": ["تبوك"],
    "الجوف": ["الجوف"],
    "ينبع": ["ينبع"],
    "أملج": ["أملج", "املج"],
    "حقل": ["حقل"],
    "عرعر": ["عرعر"],
  };
  let canon = s;
  for (const [k, variants] of Object.entries(maps)) {
    if (variants.includes(m)) {
      canon = k;
      break;
    }
  }
  return canon;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ref = safe(url.searchParams.get("ref"));
    const providerIdRaw = safe(url.searchParams.get("provider_id"));
    const providerId = parseInt(providerIdRaw || "0", 10);

    if (!ref || !providerId || providerId <= 0) {
      return json(false, { error: "missing_params" }, 400);
    }

    let rq: any = null;
    try {
      const r = await db.query(
        "SELECT id, ref, name, phone, email, city, service_type, status, completed FROM customer_requests WHERE ref = $1 LIMIT 1",
        [ref]
      );
      rq = r.rows[0] || null;
    } catch {
      return json(false, { error: "db_error_request" }, 500);
    }
    if (!rq) return json(false, { error: "not_found_request" }, 404);
    if (rq.completed === true) return json(false, { error: "already_completed" }, 409);

    let pv: any = null;
    try {
      const r = await db.query(
        "SELECT id, name, phone, email, city, service_type, status FROM provider_requests WHERE id = $1 LIMIT 1",
        [providerId]
      );
      pv = r.rows[0] || null;
    } catch {
      return json(false, { error: "db_error_provider" }, 500);
    }
    if (!pv) return json(false, { error: "not_found_provider" }, 404);
    if (String(pv.status || "") !== "approved")
      return json(false, { error: "provider_not_approved" }, 403);

    const cityRq = normalizeCityAr(String(rq.city || ""));
    const cityPv = normalizeCityAr(String(pv.city || ""));
    if (cityRq !== cityPv) return json(false, { error: "city_mismatch" }, 409);

    const serviceRq = safe(rq.service_type);
    const listPv =
      String(pv.service_type || "")
        .split(",")
        .map((x: string) => safe(x))
        .filter(Boolean);
    if (!listPv.includes(serviceRq)) return json(false, { error: "service_mismatch" }, 409);

    const nowIso = new Date().toISOString();
    try {
      await db.query(
        "ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_provider_id bigint"
      );
      await db.query(
        "ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_provider_name text"
      );
      await db.query(
        "ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_provider_phone text"
      );
      await db.query(
        "ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_provider_email text"
      );
      await db.query(
        "ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_at timestamptz"
      );
    } catch {
      // ignore
    }

    try {
      await db.query(
        "UPDATE customer_requests SET status = 'approved', accepted_provider_id = $2, accepted_provider_name = $3, accepted_provider_phone = $4, accepted_provider_email = $5, accepted_at = $6, updated_at = $6 WHERE ref = $1",
        [ref, pv.id, pv.name, pv.phone, pv.email || null, nowIso]
      );
    } catch {
      return json(false, { error: "db_update_failed" }, 500);
    }

    const host = String(process.env.SMTP_HOST || "");
    const port = Number(process.env.SMTP_PORT || "587");
    const user = String(process.env.SMTP_USER || "");
    const pass = String(process.env.SMTP_PASS || "");
    const from = String(process.env.MAIL_FROM || `"Layali Kashtat" <${user}>`);

    if (host && port && user && pass && isValidEmail(String(rq.email || ""))) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });

        const subject = `تم قبول طلبك (${ref}) — ${cityRq} / ${serviceRq}`;
        const textLines = [
          `تم قبول طلبك من قبل مقدم خدمة مطابق.`,
          "",
          `بيانات مقدم الخدمة:`,
          `الاسم: ${pv.name}`,
          `الجوال: ${pv.phone}`,
          `الإيميل: ${pv.email || "-"}`,
          `المدينة: ${pv.city}`,
          `الخدمات: ${pv.service_type}`,
          "",
          `رقم الطلب: ${ref}`,
          `المدينة: ${cityRq}`,
          `نوع الخدمة: ${serviceRq}`,
          "",
          `يرجى التواصل مع مقدم الخدمة مباشرة لاستكمال التفاصيل.`,
        ];

        await transporter.sendMail({
          from,
          to: String(rq.email),
          subject,
          text: textLines.join("\n"),
        });

        try {
          await db.query(
            "CREATE TABLE IF NOT EXISTS mail_logs (id bigserial primary key, ref text, kind text, ok boolean, error text, created_at timestamptz default now())"
          );
          await db.query(
            "INSERT INTO mail_logs (ref, kind, ok, error) VALUES ($1,$2,$3,$4)",
            [ref, "customer_accept_notify", true, ""]
          );
        } catch {}
      } catch (e: any) {
        try {
          await db.query(
            "CREATE TABLE IF NOT EXISTS mail_logs (id bigserial primary key, ref text, kind text, ok boolean, error text, created_at timestamptz default now())"
          );
          await db.query(
            "INSERT INTO mail_logs (ref, kind, ok, error) VALUES ($1,$2,$3,$4)",
            [ref, "customer_accept_notify", false, String(e?.message || e)]
          );
        } catch {}
      }
    }

    return json(true, {
      ref,
      provider: { id: pv.id, name: pv.name, phone: pv.phone, email: pv.email || null },
      message: "accepted",
    });
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const ref = safe(body?.ref);
    const providerId = parseInt(String(body?.provider_id || "0"), 10);
    const priceTotalRaw = String(body?.price_total || "").trim();
    const priceCurrency = safe(body?.currency || "SAR");
    const priceNotes = safe(body?.notes || "");

    if (!ref || !providerId || providerId <= 0) {
      return json(false, { error: "missing_params" }, 400);
    }

    const priceTotal = priceTotalRaw ? Number(priceTotalRaw) : null;
    if (priceTotalRaw && (isNaN(priceTotal as number) || (priceTotal as number) < 0)) {
      return json(false, { error: "invalid_price" }, 400);
    }

    let rq: any = null;
    let pv: any = null;
    try {
      const r1 = await db.query(
        "SELECT id, ref, name, phone, email, city, service_type, status, completed FROM customer_requests WHERE ref = $1 LIMIT 1",
        [ref]
      );
      rq = r1.rows[0] || null;
      const r2 = await db.query(
        "SELECT id, name, phone, email, city, service_type, status FROM provider_requests WHERE id = $1 LIMIT 1",
        [providerId]
      );
      pv = r2.rows[0] || null;
    } catch {
      return json(false, { error: "db_error" }, 500);
    }
    if (!rq || !pv) return json(false, { error: "not_found" }, 404);
    if (rq.completed === true) return json(false, { error: "already_completed" }, 409);
    if (String(pv.status || "") !== "approved") return json(false, { error: "provider_not_approved" }, 403);

    const cityRq = normalizeCityAr(String(rq.city || ""));
    const cityPv = normalizeCityAr(String(pv.city || ""));
    if (cityRq !== cityPv) return json(false, { error: "city_mismatch" }, 409);
    const serviceRq = safe(rq.service_type);
    const listPv = String(pv.service_type || "").split(",").map((x: string) => safe(x)).filter(Boolean);
    if (!listPv.includes(serviceRq)) return json(false, { error: "service_mismatch" }, 409);

    try {
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_provider_id bigint");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_provider_name text");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_provider_phone text");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_provider_email text");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_at timestamptz");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_price_total numeric");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_price_currency text");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_price_notes text");
      // New columns for location and payment
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_meeting_location text");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_payment_method text");
      await db.query("ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS accepted_payment_details text");
    } catch {}

    const nowIso = new Date().toISOString();
    try {
      await db.query(
        "UPDATE customer_requests SET status = 'approved', accepted_provider_id = $2, accepted_provider_name = $3, accepted_provider_phone = $4, accepted_provider_email = $5, accepted_at = $6, accepted_price_total = $7, accepted_price_currency = $8, accepted_price_notes = $9, accepted_meeting_location = $10, accepted_payment_method = $11, accepted_payment_details = $12, updated_at = $6 WHERE ref = $1",
        [
          ref, 
          pv.id, 
          pv.name, 
          pv.phone, 
          pv.email || null, 
          nowIso, 
          priceTotal, 
          priceCurrency || null, 
          priceNotes || null,
          safe(body?.meeting_location || ""),
          safe(body?.payment_method || ""),
          safe(body?.payment_details || "")
        ]
      );
      await db.query("CREATE TABLE IF NOT EXISTS status_history (id bigserial primary key, ref text, event text, provider_id bigint, note text, created_at timestamptz default now())");
      const note = [
        priceTotal !== null ? `price=${priceTotal}` : "",
        priceCurrency ? `currency=${priceCurrency}` : "",
        priceNotes ? `notes=${priceNotes}` : "",
        safe(body?.meeting_location || "") ? `meet=${safe(body?.meeting_location || "")}` : "",
        safe(body?.payment_method || "") ? `pay=${safe(body?.payment_method || "")}` : "",
      ].filter(Boolean).join("; ");
      await db.query("INSERT INTO status_history (ref, event, provider_id, note) VALUES ($1,$2,$3,$4)", [ref, "accepted", pv.id, note]);
    } catch {
      return json(false, { error: "db_update_failed" }, 500);
    }

    const host = String(process.env.SMTP_HOST || "");
    const port = Number(process.env.SMTP_PORT || "587");
    const user = String(process.env.SMTP_USER || "");
    const pass = String(process.env.SMTP_PASS || "");
    const from = String(process.env.MAIL_FROM || `"Layali Kashtat" <${user}>`);

    if (host && port && user && pass && isValidEmail(String(rq.email || ""))) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
        
        const priceLine = priceTotal !== null ? `السعر المقترح: ${priceTotal} ${priceCurrency || "SAR"}` : null;
        const meetingLoc = safe(body?.meeting_location || "");
        const payMethod = safe(body?.payment_method || "");
        const payDetails = safe(body?.payment_details || "");
        
        let paymentInfo = "";
        if (payMethod === "cash") {
          paymentInfo = "نقداً بعد الالتقاء";
        } else if (payMethod === "transfer") {
          paymentInfo = "تحويل بنكي/رقمي";
          if (payDetails) paymentInfo += `\nتفاصيل الحساب:\n${payDetails}`;
        }

        const subject = `تم قبول طلبك (${ref}) — ${cityRq} / ${serviceRq}`;
        const textLines = [
          `تم قبول طلبك من قبل مقدم خدمة مطابق.`,
          "",
          `بيانات مقدم الخدمة:`,
          `الاسم: ${pv.name}`,
          `الجوال: ${pv.phone}`,
          `الإيميل: ${pv.email || "-"}`,
          `المدينة: ${pv.city}`,
          `الخدمات: ${pv.service_type}`,
          "",
          `رقم الطلب: ${ref}`,
          `المدينة: ${cityRq}`,
          `نوع الخدمة: ${serviceRq}`,
          priceLine ? priceLine : null,
          priceNotes ? `ملاحظات السعر: ${priceNotes}` : null,
          "",
          meetingLoc ? `موقع الالتقاء: ${meetingLoc}` : null,
          paymentInfo ? `طريقة الدفع: ${paymentInfo}` : null,
          "",
          `يرجى التواصل مع مقدم الخدمة مباشرة لاستكمال التفاصيل.`,
        ].filter(Boolean) as string[];

        await transporter.sendMail({
          from,
          to: String(rq.email),
          subject,
          text: textLines.join("\n"),
        });

        try {
          await db.query(
            "CREATE TABLE IF NOT EXISTS mail_logs (id bigserial primary key, ref text, kind text, ok boolean, error text, created_at timestamptz default now())"
          );
          await db.query(
            "INSERT INTO mail_logs (ref, kind, ok, error) VALUES ($1,$2,$3,$4)",
            [ref, "customer_accept_notify", true, ""]
          );
        } catch {}
      } catch (e: any) {
        try {
          await db.query(
            "CREATE TABLE IF NOT EXISTS mail_logs (id bigserial primary key, ref text, kind text, ok boolean, error text, created_at timestamptz default now())"
          );
          await db.query(
            "INSERT INTO mail_logs (ref, kind, ok, error) VALUES ($1,$2,$3,$4)",
            [ref, "customer_accept_notify", false, String(e?.message || e)]
          );
        } catch {}
      }
    }

    return json(true, {
      ref,
      provider: { id: pv.id, name: pv.name, phone: pv.phone, email: pv.email || null },
      price_total: priceTotal,
      currency: priceCurrency || null,
      notes: priceNotes || null,
      message: "accepted_with_price",
    });
  } catch (e: any) {
    return json(false, { error: String(e?.message || e) }, 500);
  }
}
