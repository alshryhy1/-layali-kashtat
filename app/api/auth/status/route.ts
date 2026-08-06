import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/auth-admin";
import { getSession } from "@/lib/auth-customer";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

async function isProfilesAdmin(accessToken: string | null | undefined): Promise<boolean> {
  if (!accessToken) return false;
  try {
    const { data: userData, error: userErr } = await supabaseServer.auth.getUser(accessToken);
    if (userErr || !userData?.user?.id) return false;
    const { data, error } = await supabaseServer
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (error) return false;
    return String((data as { role?: string } | null)?.role ?? "")
      .trim()
      .toLowerCase() === "admin";
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const cookieStore = await cookies();

  // Portal admin session cookie (set by /api/admin/login)
  const adminToken = cookieStore.get("kashtat_admin")?.value;
  let isAdmin = verifyAdminSession(adminToken);

  // Supabase user with profiles.role=admin (Bearer from client session)
  if (!isAdmin) {
    const auth = req.headers.get("authorization") || "";
    const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
    isAdmin = await isProfilesAdmin(bearer || null);
  }

  const customerSession = await getSession();

  return NextResponse.json({
    isAdmin,
    user: customerSession ? { id: customerSession.id, name: customerSession.name } : null,
  });
}
