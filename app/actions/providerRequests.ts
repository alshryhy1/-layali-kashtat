"use server";

import nodemailer from "nodemailer";
import { supabaseServer } from "@/lib/supabaseServer";

type State = { ok: boolean; message: string } | null;

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function sendAdminEmail(subject: string, text: string) {
  const host = requireEnv("SMTP_HOST");
  const port = Number(requireEnv("SMTP_PORT"));
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");
  const to = requireEnv("ADMIN_EMAIL");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Layali Kashtat" <${user}>`,
    to,
    subject,
    text,
  });
}

// ✅ هذا هو الـ export الوحيد (لا تصدّر أي const/variable هنا)
export async function createProviderRequest(
  _prevState: State,
  formData: FormData
): Promise<State> {
  try {
    const name = clean(formData.get("name"));
    const phone = clean(formData.get("phone"));
    const service_type = clean(formData.get("service_type"));
    const city = clean(formData.get("city"));

    const agree = formData.get("agree");
    const agreed = agree === "on" || agree === "true" || agree === "1";

    if (!name || !phone || !service_type || !city) {
      return { ok: false, message: "الرجاء تعبئة كل الحقول" };
    }

    if (!agreed) {
      return { ok: false, message: "يجب الموافقة على التوثيق والشروط قبل الإرسال" };
    }

    const { error } = await supabaseServer.from("provider_requests").insert([
      { name, phone, service_type, city },
    ]);

    if (error) {
      return { ok: false, message: `خطأ بالحفظ: ${error.message}` };
    }

    await sendAdminEmail(
      "طلب تسجيل مقدم خدمة",
      `طلب جديد لتسجيل مقدم خدمة:\n\n` +
        `الاسم: ${name}\n` +
        `الجوال: ${phone}\n` +
        `نوع الخدمة: ${service_type}\n` +
        `المدينة: ${city}\n`
    );

    return { ok: true, message: "تم إرسال طلبك بنجاح وسيتم التواصل معك." };
  } catch (e: any) {
    return { ok: false, message: e?.message || "Server error" };
  }
}
