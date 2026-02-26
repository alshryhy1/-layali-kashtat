
import { NextResponse } from "next/server";
import { verifyOTP } from "@/lib/authentica";
import { db } from "@/lib/db";
import { signToken } from "@/lib/auth-customer";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();
    if (!phone || !otp) {
      return NextResponse.json({ ok: false, error: "Phone and OTP are required" }, { status: 400 });
    }

    // 1. Verify with Authentica
    await verifyOTP(phone, otp);

    // 2. If successful, find user and login/verify
    // Normalize phone for DB lookup (assuming stored as 05...)
    // But DB usually stores what user entered. Let's try flexible search.
    // Actually, let's normalize to 05... format if possible, or search exact.
    
    // Convert 9665... to 05...
    let dbPhone = phone.replace(/[^0-9]/g, "");
    if (dbPhone.startsWith("966")) dbPhone = "0" + dbPhone.substring(3);
    
    const res = await db.query("SELECT * FROM customers WHERE phone = $1 OR phone = $2", [phone, dbPhone]);
    
    if (res.rows.length > 0) {
      const user = res.rows[0];
      
      // Update verified status
      if (!user.is_verified) {
        await db.query("UPDATE customers SET is_verified = true WHERE id = $1", [user.id]);
      }

      // Set Session
      const token = signToken({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: "customer"
      });

      const cookieStore = await cookies();
      cookieStore.set("customer_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return NextResponse.json({ ok: true, message: "Logged in successfully" });
    } else {
      // User not found, maybe redirect to signup or just say verified but no account
      // For now, return ok so frontend can redirect to signup with verified phone
      return NextResponse.json({ ok: true, message: "Verified", isNewUser: true });
    }

  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
