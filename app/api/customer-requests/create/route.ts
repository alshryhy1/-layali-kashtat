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
  const cooking = safeText(body?.cooking);
  const equip = safeText(body?.equip);
  const notes = safeText(body?.notes);

  if (!name) return jsonError(400, "invalid_name", "يرجى إدخال الاسم.");
  if (!phone || phone.length < 8) return jsonError(400, "invalid_phone", "يرجى إدخال رقم جوال صحيح.");
  if (!email || !isValidEmail(email)) return jsonError(400, "invalid_email", "يرجى إدخال بريد إلكتروني صحيح.");
  if (!cityInput) return jsonError(400, "invalid_city", "يرجى اختيار المدينة.");
  if (!service_type) return jsonError(400, "invalid_service", "يرجى اختيار نوع الخدمة.");

  try {
    const check = await db.query(
      "SELECT ref,status,completed FROM customer_requests WHERE (phone = $1 OR email = $2) AND completed = false ORDER BY created_at DESC LIMIT 1",
      [phone, email]
    );
    const active = check.rows[0];
    if (active?.ref) {
      return NextResponse.json({
        ok: true,
        created: false,
        ref: active.ref,
        status: active.status,
        completed: active.completed,
        reason: "active_request_exists",
      });
    }
  } catch {
    return jsonError(500, "db_active_check_failed", "تعذر التحقق من الطلبات الحالية.");
  }

  const nowIso = new Date().toISOString();
  const nc = normalizeCityAr(cityInput);
  const city = nc.canon;
  const variants = nc.variants.map((v) => regexEscape(v));
  const pattern = `^(${variants.join("|")})$`;

  for (let i = 0; i < 5; i++) {
    const ref = makeRef();
    try {
      const ins = await db.query(
        "INSERT INTO customer_requests (ref,name,phone,email,city,service_type,status,completed,group_type,people_count,cooking,equip,notes,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING ref,status,completed",
        [
          ref,
          name,
          phone,
          email,
          city,
          service_type,
          "pending",
          false,
          group_type || null,
          people_count || null,
          cooking || null,
          equip || null,
          notes || null,
          nowIso,
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
                String(process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").trim();
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

          const providerList = providers.rows.filter((p: any) => isValidEmail(String(p.email || "")));
          for (const p of providerList) {
            const pSubject = `طلب جديد مطابق لك: ${city} / ${service_type} (Ref ${row.ref})`;
            const pText = [
              `لديك طلب جديد من عميل مطابق لتخصصك.`,
              `المدينة: ${city}`,
              `نوع الخدمة: ${service_type}`,
              `رقم الطلب: ${row.ref}`,
              "",
              `بيانات العميل:`,
              `الاسم: ${name}`,
              `الجوال: ${phone}`,
              `الإيميل: ${email}`,
              "",
              `للاستجابة لهذا الطلب (قبول/رفض)، يرجى الدخول للوحة التحكم:`,
              (() => {
                const base = String(process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").trim();
                const path = `/ar/providers/dashboard`;
                const url = base ? `${base}${path}` : path;
                return url;
              })(),
              "",
              `يرجى التواصل مع العميل مباشرةً بعد القبول أو التنسيق عبر الأدمن حسب الحاجة.`,
            ].join("\n");
            try {
              await transporter.sendMail({
                from,
                to: String(p.email),
                subject: pSubject,
                text: pText,
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

      return NextResponse.json({
        ok: true,
        created: true,
        ref: row.ref,
        status: row.status,
        completed: row.completed,
      });
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
        continue;
      }
      return jsonError(500, "db_insert_failed", "تعذر إنشاء الطلب. حاول مرة أخرى.");
    }
  }

  return jsonError(500, "ref_collision", "تعذر إنشاء رقم طلب فريد. حاول مرة أخرى.");
}
