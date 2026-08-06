import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/auth-admin";
import { getSession } from "@/lib/auth-customer";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();

  // Check Admin (kashtat_admin session cookie)
  const adminToken = cookieStore.get("kashtat_admin")?.value;
  const isAdmin = verifyAdminSession(adminToken);

  // Check Customer
  const customerSession = await getSession();

  return NextResponse.json({
    isAdmin,
    user: customerSession ? { id: customerSession.id, name: customerSession.name } : null,
  });
}
