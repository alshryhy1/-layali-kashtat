// app/api/provider-signup/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // تأكيد أن DATABASE_URL موجود فعلاً داخل Vercel Runtime
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is missing in runtime env");
      return NextResponse.json(
        { error: "DATABASE_URL is missing" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { name, phone, serviceType, city } = body;

    if (!name || !phone || !serviceType || !city) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    await query(
      `
      INSERT INTO provider_requests
      (name, phone, service_type, city, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      `,
      [name, phone, serviceType, city]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // نطبع السبب الحقيقي في Vercel Runtime Logs
    console.error("provider-signup error:", error);

    // ونرجّع سبب مختصر عشان نعرف هل هو اتصال/SQL
    return NextResponse.json(
      { error: "خطأ في الخادم", detail: String(error?.message || error) },
      { status: 500 }
    );
  }
}
