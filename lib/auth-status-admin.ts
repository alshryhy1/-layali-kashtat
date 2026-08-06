import { verifyAdminSession } from "@/lib/auth-admin";
import { db } from "@/lib/db";
import { supabaseServer } from "@/lib/supabaseServer";

function norm(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase();
}

/** True when profiles.role is admin, email is in admins.username, or matches ADMIN_EMAIL. */
export async function isSupabaseUserAdmin(
  accessToken: string | null | undefined
): Promise<boolean> {
  if (!accessToken) return false;
  try {
    const { data: userData, error: userErr } = await supabaseServer.auth.getUser(accessToken);
    if (userErr || !userData?.user?.id) return false;

    const userId = userData.user.id;
    const authEmail = norm(userData.user.email);

    const { data: profile, error: profileErr } = await supabaseServer
      .from("profiles")
      .select("role, email")
      .eq("id", userId)
      .maybeSingle();

    if (!profileErr && norm((profile as { role?: string } | null)?.role) === "admin") {
      return true;
    }

    const effectiveEmail =
      authEmail || norm((profile as { email?: string } | null)?.email);
    const adminEmail = norm(process.env.ADMIN_EMAIL);
    if (adminEmail && effectiveEmail && effectiveEmail === adminEmail) return true;

    if (effectiveEmail) {
      try {
        const local = effectiveEmail.split("@")[0] || "";
        const res = await db.query(
          `SELECT 1 FROM admins
           WHERE lower(username) = $1
              OR lower(username) = $2
           LIMIT 1`,
          [effectiveEmail, local]
        );
        if ((res.rows?.length ?? 0) > 0) return true;
      } catch {
        /* admins table may be missing in some envs */
      }
    }

    return false;
  } catch {
    return false;
  }
}

export async function resolveAuthStatusIsAdmin(opts: {
  adminCookie?: string | null;
  accessToken?: string | null;
}): Promise<boolean> {
  if (verifyAdminSession(opts.adminCookie)) return true;
  return isSupabaseUserAdmin(opts.accessToken);
}
