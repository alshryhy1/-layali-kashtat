import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import nodemailer from "nodemailer";

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

function makeRef() {
  // LK- + 6 digits من timestamp (بسيطة وسريعة)
  const tail = Date.now().toString().slice(-6);
  return `LK-${tail}`;
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
      // Only use the variants for the matched city
      const distinct = new Set([k, ...variants]);
      return { canon, variants: Array.from(distinct) };
    }
  }
  // If no match found, just return the input as the only variant
  return { canon, variants: [s] };
}

function regexEscape(s: string) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getProviderNewRequestEmailTemplate(data: {
  ref: string;
  city: string;
  service: string;
  customerName: string;
  dashboardLink: string;
  location?: string;
}) {
  const { ref, city, service, customerName, dashboardLink, location } = data;
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>طلب جديد متاح</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; color: #111; font-size: 24px; font-weight: 800;">Layali Kashtat</h1>
        </div>
        <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="margin-top: 0; margin-bottom: 20px; color: #111; font-size: 20px;">طلب جديد متاح! 🚀</h2>
          <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
            مرحباً شريكنا العزيز،<br>
            يوجد طلب جديد مطابق لخدماتك ومدينتك.
          </p>
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <table style="width: 100%; font-size: 14px; color: #374151;">
              <tr><td style="padding: 5px 0; font-weight: bold; width: 100px;">المدينة:</td><td>${city}</td></tr>
              <tr><td style="padding: 5px 0; font-weight: bold;">الخدمة:</td><td>${service}</td></tr>
              <tr><td style="padding: 5px 0; font-weight: bold;">العميل:</td><td>${customerName}</td></tr>
              <tr><td style="padding: 5px 0; font-weight: bold;">رقم الطلب:</td><td>${ref}</td></tr>
              ${location ? `<tr><td style="padding: 5px 0; font-weight: bold;">موقع العميل:</td><td><a href="${location}">${location}</a></td></tr>` : ''}
            </table>
          </div>
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${dashboardLink}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              عرض الطلبات وقبولها
            </a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <p style="margin: 0; color: #9ca3af; font-size: 13px;">© ليالي كشتات. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getCustomerConfirmationEmailTemplate(data: {
  ref: string;
  city: string;
  service: string;
  name: string;
}) {
  const { ref, city, service, name } = data;
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تم استلام طلبك</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; color: #111; font-size: 24px; font-weight: 800;">Layali Kashtat</h1>
        </div>
        <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
             <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background-color: #eff6ff; border-radius: 50%; margin-bottom: 20px;">
               <span style="color: #3b82f6; font-size: 32px;">📝</span>
             </div>
             <h2 style="margin: 0; color: #111; font-size: 24px;">تم استلام طلبك</h2>
             <p style="margin: 10px 0 0; color: #6b7280; font-size: 16px;">رقم الطلب: <span style="font-family: monospace; font-weight: bold; color: #111;">${ref}</span></p>
          </div>
          <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
            مرحباً ${name}،<br>
            تم تسجيل طلبك بنجاح. نقوم حالياً بإشعار مقدمي الخدمة المناسبين في منطقتك.
          </p>
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <table style="width: 100%; font-size: 14px; color: #374151;">
              <tr><td style="padding: 5px 0; font-weight: bold; width: 100px;">المدينة:</td><td>${city}</td></tr>
              <tr><td style="padding: 5px 0; font-weight: bold;">الخدمة:</td><td>${service}</td></tr>
            </table>
          </div>
          <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
            سنقوم بإشعارك عبر البريد الإلكتروني فور قبول أحد مقدمي الخدمة لطلبك. شكراً لاستخدامك ليالي كشتات.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <p style="margin: 0; color: #9ca3af; font-size: 13px;">© ليالي كشتات. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const name = safeText(body?.name);
  const phone = normalizePhone(body?.phone);
  const email = normalizeEmail(body?.email);

  const cityInput = safeText(body?.city);
  const service_type = safeText(body?.service_type);

  const group_type = safeText(body?.group_type);
  const people_count = safeText(body?.people_count);
  const date_time = safeText(body?.date_time);
  const comments = safeText(body?.comments);
  const customer_location = safeText(body?.customer_location);

  if (!name || !phone || !cityInput || !service_type) {
    return jsonError(400, "missing_fields", "جميع الحقول المطلوبة يجب أن تكون معبأة.");
  }
  if (!isValidEmail(email)) {
    return jsonError(400, "invalid_email", "البريد الإلكتروني غير صحيح.");
  }

  // City Matching
  const { canon: city, variants } = normalizeCityAr(cityInput);
  const pattern = variants.map(regexEscape).join("|");

  try {
    // Save Request
    const ref = makeRef();
    const nowIso = new Date().toISOString();

    const ins = await db.query(
      "INSERT INTO customer_requests (ref, name, phone, email, city, service_type, group_type, people_count, date_time, notes, customer_location, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12, $12) RETURNING *",
      [
        ref,
        name,
        phone,
        email,
        city,
        service_type,
        group_type,
        people_count,
        date_time,
        comments,
        customer_location,
        nowIso,
      ]
    );
    const row = ins.rows[0];

    // تمرير الطلبات لمقدمي الخدمات المطابقين (مدينة + نوع خدمة)
    try {
      const providers = await db.query(
        "SELECT id,name,phone,email,service_type,city,status FROM provider_requests WHERE status = 'approved' AND city ~* $1 AND (CASE WHEN position(',' in service_type) > 0 THEN $2 = ANY(regexp_split_to_array(service_type, '\\\\s*,\\\\s*')) ELSE service_type = $2 END) ORDER BY id DESC LIMIT 50",
        [pattern, service_type]
      );

      const host = String(process.env.SMTP_HOST || "");
      const port = Number(process.env.SMTP_PORT || "587");
      const user = String(process.env.SMTP_USER || "");
      const pass = String(process.env.SMTP_PASS || "");
      const from = String(process.env.MAIL_FROM || `"Layali Kashtat" <${user}>`);
      const adminTo = String(process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || "");
      const providerBccRaw = String(
        process.env.PROVIDER_DISPATCH_BCC || process.env.PROVIDER_NOTIFY_BCC || ""
      );
      const providerBcc = providerBccRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (host && port && user && pass && adminTo) {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });

        // 1. Admin Notification (Simple Text)
        const subject = `طلب جديد: ${city} / ${service_type} (Ref ${row.ref})`;
        const textLines = [
          `تم استلام طلب جديد من عميل:`,
          `الاسم: ${name}`,
          `الجوال: ${phone}`,
          `الإيميل: ${email}`,
          `المدينة: ${city}`,
          `نوع الخدمة: ${service_type}`,
          `رقم الطلب (ref): ${row.ref}`,
          "",
          providers.rows.length > 0
            ? `مقدمو الخدمة المعتمدون المطابقون (${providers.rows.length}):`
            : `لا يوجد مقدّم خدمة معتمد مطابق حاليًا`,
          ...providers.rows.map(
            (p: any) =>
              `#${p.id} - ${p.name} - ${p.phone} - ${p.city} - ${p.service_type}`
          ),
          "",
          providers.rows.length > 0
            ? `للقبول السريع:`
            : "",
          ...providers.rows.map((p: any) => {
            const base =
              String(process.env.NEXT_PUBLIC_BASE_URL || "https://layalikashtat.com").trim();
            const path = `/ar/providers/accept?ref=${encodeURIComponent(row.ref)}&provider_id=${encodeURIComponent(p.id)}`;
            const url = base ? `${base}${path}` : path;
            return `قبول بواسطة ${p.name}: ${url}`;
          }),
        ];

        await transporter.sendMail({
          from,
          to: adminTo,
          bcc: providerBcc.length ? providerBcc : undefined,
          subject,
          text: textLines.join("\n"),
        });

        // 2. Notify Matched Providers
        const providerList = providers.rows.filter((p: any) => isValidEmail(String(p.email || "")));
        for (const p of providerList) {
          const pSubject = `طلب جديد مطابق لك: ${city} / ${service_type} (Ref ${row.ref})`;
          const pText = [
            `لديك طلب جديد من عميل مطابق لتخصصك.`,
            `المدينة: ${city}`,
            `نوع الخدمة: ${service_type}`,
            `رقم الطلب: ${row.ref}`,
            customer_location ? `موقع العميل: ${customer_location}` : "",
            "",
            `بيانات العميل:`,
            `الاسم: ${name}`,
            "",
            `للاستجابة لهذا الطلب (قبول/رفض)، يرجى الدخول للوحة التحكم.`,
          ].filter(Boolean).join("\n");

          const base = String(process.env.NEXT_PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").trim();
          const dashboardLink = base ? `${base}/ar/providers/dashboard` : `/ar/providers/dashboard`;

          const pHtml = getProviderNewRequestEmailTemplate({
            ref: row.ref,
            city,
            service: service_type,
            customerName: name,
            dashboardLink,
            location: customer_location,
          });

          try {
            await transporter.sendMail({
              from,
              to: String(p.email),
              subject: pSubject,
              text: pText,
              html: pHtml
            });
            try {
              await db.query(
                "CREATE TABLE IF NOT EXISTS mail_logs (id bigserial primary key, ref text, kind text, ok boolean, error text, created_at timestamptz default now())"
              );
              await db.query(
                "INSERT INTO mail_logs (ref, kind, ok, error) VALUES ($1,$2,$3,$4)",
                [row.ref, `provider_dispatch_${p.id}`, true, ""]
              );
            } catch {}
          } catch (e: any) {
            try {
              await db.query(
                "CREATE TABLE IF NOT EXISTS mail_logs (id bigserial primary key, ref text, kind text, ok boolean, error text, created_at timestamptz default now())"
              );
              await db.query(
                "INSERT INTO mail_logs (ref, kind, ok, error) VALUES ($1,$2,$3,$4)",
                [row.ref, `provider_dispatch_${p.id}`, false, String(e?.message || e)]
              );
            } catch {}
          }
        }

        try {
          await db.query(
            "CREATE TABLE IF NOT EXISTS mail_logs (id bigserial primary key, ref text, kind text, ok boolean, error text, created_at timestamptz default now())"
          );
          await db.query(
            "INSERT INTO mail_logs (ref, kind, ok, error) VALUES ($1,$2,$3,$4)",
            [row.ref, "admin_dispatch", true, ""]
          );
        } catch (logErr) {
          console.error("mail log insert failed:", logErr);
        }

        // 3. Notify Customer (Confirmation)
        if (isValidEmail(email)) {
           const customerSubject = `تم استلام طلبك بنجاح: ${city} / ${service_type} (Ref ${row.ref})`;
           const customerText = [
             `مرحباً ${name}،`,
             "",
             `تم استلام طلبك بنجاح وسيتم إشعار مقدمي الخدمة المناسبين.`,
             `رقم الطلب: ${row.ref}`,
             `المدينة: ${city}`,
             `الخدمة: ${service_type}`,
             "",
             `سنقوم بإشعارك عبر البريد الإلكتروني فور قبول أحد مقدمي الخدمة لطلبك.`,
             "",
             `شكراً لاستخدامك ليالي كشتات.`
           ].join("\n");

           const cHtml = getCustomerConfirmationEmailTemplate({
             ref: row.ref,
             city,
             service: service_type,
             name
           });

           try {
             await transporter.sendMail({
               from,
               to: email,
               subject: customerSubject,
               text: customerText,
               html: cHtml
             });
             // log
             try {
                await db.query("INSERT INTO mail_logs (ref, kind, ok, error) VALUES ($1,$2,$3,$4)", [row.ref, "customer_confirmation", true, ""]);
             } catch {}
           } catch (custErr: any) {
             console.error("customer confirmation email failed:", custErr);
             try {
                await db.query("INSERT INTO mail_logs (ref, kind, ok, error) VALUES ($1,$2,$3,$4)", [row.ref, "customer_confirmation", false, String(custErr?.message || custErr)]);
             } catch {}
           }
        }
      } else {
        console.error("dispatch email missing envs: SMTP/Mail config not complete");
        try {
          await db.query(
            "CREATE TABLE IF NOT EXISTS mail_logs (id bigserial primary key, ref text, kind text, ok boolean, error text, created_at timestamptz default now())"
          );
          await db.query(
            "INSERT INTO mail_logs (ref, kind, ok, error) VALUES ($1,$2,$3,$4)",
            [row.ref, "admin_dispatch", false, "missing_smtp_env"]
          );
        } catch (logErr) {
          console.error("mail log insert failed:", logErr);
        }
      }
    } catch (dispatchErr) {
      console.error("dispatch providers error:", dispatchErr);
      try {
        await db.query(
          "CREATE TABLE IF NOT EXISTS mail_logs (id bigserial primary key, ref text, kind text, ok boolean, error text, created_at timestamptz default now())"
        );
        await db.query(
          "INSERT INTO mail_logs (ref, kind, ok, error) VALUES ($1,$2,$3,$4)",
          [row.ref, "admin_dispatch", false, String((dispatchErr as any)?.message || dispatchErr)]
        );
      } catch (logErr) {
        console.error("mail log insert failed:", logErr);
      }
    }

    return NextResponse.json({ ok: true, ref: row.ref });
  } catch (e: any) {
    console.error("Create Request Error:", e);
    return jsonError(500, "server_error", "حدث خطأ أثناء معالجة الطلب.");
  }
}
