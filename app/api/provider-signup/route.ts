// app/api/provider-signup/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is missing in runtime env");
      return NextResponse.json(
        { error: "DATABASE_URL is missing", detail: "DATABASE_URL is missing" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { name, phone, serviceType, city } = body || {};

    if (!name || !phone || !serviceType || !city) {
      return NextResponse.json(
        { error: "بيانات ناقصة", detail: "Missing required fields" },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO provider_requests
      (name, phone, service_type, city, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `;

    const res = await query(sql, [name, phone, serviceType, city]);

    return NextResponse.json({ success: true, id: res.rows?.[0]?.id ?? null });
  } catch (error: any) {
    // اطبع الخطأ كامل في Logs
    console.error("provider-signup error message:", error?.message || error);
    console.error("provider-signup error stack:", error?.stack || error);

    // ✅ رجّع detail دائمًا (تشخيص مؤقت)
    return NextResponse.json(
      {
        error: "خطأ في الخادم",
        detail: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}
