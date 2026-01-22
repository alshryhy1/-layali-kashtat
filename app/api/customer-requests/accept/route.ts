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

function getCustomerAcceptEmailTemplate(data: {
  ref: string;
  provider: { name: string; phone: string; email: string };
  request: { city: string; service: string };
  price: { total: number | null; currency: string; notes: string };
  meeting: string;
  payment: string;
  trackLink: string;
}) {
  const { ref, provider, request, price, meeting, payment, trackLink } = data;
  
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تم قبول طلبك</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; color: #111; font-size: 24px; font-weight: 800;">Layali Kashtat</h1>
        </div>

        <!-- Card -->
        <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <div style="text-align: center; margin-bottom: 30px;">
             <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background-color: #dcfce7; border-radius: 50%; margin-bottom: 20px;">
               <span style="color: #16a34a; font-size: 32px;">✓</span>
             </div>
             <h2 style="margin: 0; color: #111; font-size: 24px;">تم قبول طلبك!</h2>
             <p style="margin: 10px 0 0; color: #6b7280; font-size: 16px;">رقم الطلب: <span style="font-family: monospace; font-weight: bold; color: #111;">${ref}</span></p>
          </div>
          
          <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
            مرحباً عزيزنا العميل،<br>
            يسعدنا إخبارك بأن مقدم خدمة مطابق قد قبل طلبك. فيما يلي التفاصيل:
          </p>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px; font-size: 16px; color: #111; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">معلومات مقدم الخدمة</h3>
            <table style="width: 100%; font-size: 14px; color: #374151;">
              <tr>
                <td style="padding: 5px 0; font-weight: bold; width: 80px;">الاسم:</td>
                <td>${provider.name}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px; font-size: 16px; color: #111; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">تفاصيل الاتفاق</h3>
            <table style="width: 100%; font-size: 14px; color: #374151;">
              <tr>
                <td style="padding: 5px 0; font-weight: bold; width: 100px;">المدينة:</td>
                <td>${request.city}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">الخدمة:</td>
                <td>${request.service}</td>
              </tr>
              ${price.total !== null ? `
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">السعر:</td>
                <td style="color: #16a34a; font-weight: bold;">${price.total} ${price.currency}</td>
              </tr>` : ''}
              ${price.notes ? `
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">ملاحظات السعر:</td>
                <td>${price.notes}</td>
              </tr>` : ''}
              ${meeting ? `
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">موقع الالتقاء:</td>
                <td>${meeting}</td>
              </tr>` : ''}
              ${payment ? `
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">الدفع:</td>
                <td style="white-space: pre-line;">${payment}</td>
              </tr>` : ''}
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${trackLink}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              تتبع الطلب والتواصل
            </a>
          </div>
          
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px;">
          <p style="margin: 0; color: #9ca3af; font-size: 13px;">
            © ليالي كشتات. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
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
      
      // Create Conversation for Chat
      try {
        const existConv = await db.query("SELECT id FROM conversations WHERE request_id = $1 LIMIT 1", [rq.id]);
        if (existConv.rows.length === 0) {
           await db.query(
             "INSERT INTO conversations (request_id, provider_id, status) VALUES ($1, $2, 'open')", 
             [rq.id, pv.id]
           );
        }
      } catch (convErr) {
        console.error("Failed to create conversation:", convErr);
      }

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

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const trackLink = `${baseUrl}/ar/request/track?ref=${ref}`;

        const html = getCustomerAcceptEmailTemplate({
          ref,
          provider: { name: pv.name, phone: pv.phone, email: pv.email || "" },
          request: { city: cityRq, service: serviceRq },
          price: { total: priceTotal, currency: priceCurrency || "SAR", notes: priceNotes },
          meeting: meetingLoc,
          payment: paymentInfo,
          trackLink,
        });

        await transporter.sendMail({
          from,
          to: String(rq.email),
          subject,
          text: textLines.join("\n"),
          html,
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
