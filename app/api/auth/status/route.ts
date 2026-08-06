import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth-customer";
import { resolveAuthStatusIsAdmin } from "@/lib/auth-status-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cookieStore = await cookies();

  // Portal cookie OR Supabase user who is admin in DB (profiles.role / admins / ADMIN_EMAIL)
  const adminToken = cookieStore.get("kashtat_admin")?.value;
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const isAdmin = await resolveAuthStatusIsAdmin({
    adminCookie: adminToken,
    accessToken: bearer || null,
  });

  const customerSession = await getSession();

  return NextResponse.json({
    isAdmin,
    user: customerSession ? { id: customerSession.id, name: customerSession.name } : null,
  });
}
