
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }

  try {
    // 1. Check Customers
    const customerRes = await db.query(
      "SELECT id FROM customers WHERE verification_token = $1 LIMIT 1",
      [token]
    );

    if (customerRes.rows.length > 0) {
      await db.query(
        "UPDATE customers SET is_verified = true, verification_token = NULL WHERE id = $1",
        [customerRes.rows[0].id]
      );
      // Redirect to login with success message
      return NextResponse.redirect(new URL("/ar/customer/login?verified=true", req.url));
    }

    // 2. Check Providers
    const providerRes = await db.query(
      "SELECT id FROM provider_requests WHERE verification_token = $1 LIMIT 1",
      [token]
    );

    if (providerRes.rows.length > 0) {
      await db.query(
        "UPDATE provider_requests SET is_verified = true, verification_token = NULL WHERE id = $1",
        [providerRes.rows[0].id]
      );
      // Redirect to provider login with success message
      return NextResponse.redirect(new URL("/ar/providers/login?verified=true", req.url));
    }

    // 3. Invalid Token
    return NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 400 });

  } catch (e) {
    console.error("Verification error:", e);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
