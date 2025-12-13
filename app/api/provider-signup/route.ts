// app/api/provider-signup/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, serviceType, city } = body;

    if (!name || !phone || !serviceType || !city) {
      return NextResponse.json(
        { error: "بيانات ناقصة" },
        { status: 400 }
      );
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
  } catch (error) {
    return NextResponse.json(
      { error: "خطأ في الخادم" },
      { status: 500 }
    );
  }
}
