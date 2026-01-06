// app/api/customer-requests/active/route.ts
import { db } from "../../../../lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    console.log("Request body:", body);

    const { name, phone, email } = body;
    if (!name || !phone || !email) {
      return NextResponse.json(
        { ok: false, message: "الرجاء إدخال الاسم، رقم الجوال، والبريد الإلكتروني." },
        { status: 400 }
      );
    }

    const checkSql =
      "SELECT ref FROM customer_requests WHERE (phone = $1 OR email = $2) AND completed = false ORDER BY created_at DESC LIMIT 1";
    let existingRef: string | null = null;
    try {
      const r = await db.query(checkSql, [phone, email]);
      existingRef = r.rows[0]?.ref ?? null;
    } catch (e: any) {
      console.error("DB check error:", e);
      return NextResponse.json(
        { ok: false, message: "تعذر التحقق من الطلبات الحالية: " + (e.message || "DB error") },
        { status: 500 }
      );
    }

    if (existingRef) {
      return NextResponse.json({
        ok: true,
        found: true,
        message: "تم التسجيل مسبقًا — يمكنك متابعة حالتك من هنا.",
        ref: existingRef,
      });
    }

    return NextResponse.json({
      ok: true,
      found: false,
      message: "لا يوجد طلب سابق — أكمل الخيارات ثم أكّد الطلب.",
    });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { ok: false, message: "خطأ داخلي في الخادم.", details: JSON.stringify(err) },
      { status: 500 }
    );
  }
}
