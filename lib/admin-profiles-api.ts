import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/auth-admin";
import { db } from "@/lib/db";
import { supabaseServer } from "@/lib/supabaseServer";
import { writeAdminAudit } from "@/lib/admin-users-data";
import { isSuspended } from "@/lib/admin-users-shared";

export async function requireAdminApi(): Promise<{ ok: true; username: string } | { ok: false; status: number; error: string }> {
  const token = (await cookies()).get("kashtat_admin")?.value;
  if (!verifyAdminSession(token)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  let username = "admin";
  try {
    const raw = Buffer.from(String(token), "base64url").toString("utf8");
    const i = raw.lastIndexOf(".");
    if (i > 0) {
      const obj = JSON.parse(raw.slice(0, i));
      if (obj?.u) username = String(obj.u);
      else if (obj?.username) username = String(obj.username);
    }
  } catch {
    /* ignore */
  }
  return { ok: true, username };
}

export type ProfileAction =
  | "suspend"
  | "activate"
  | "verify"
  | "unverify"
  | "set_role"
  | "reset_password"
  | "delete";

const FAR_BAN = "2099-12-31T23:59:59.000Z";

async function getAuthSnapshot(id: string) {
  const res = await db.query(
    `SELECT COALESCE(u.email, p.email)::text AS email,
            u.banned_until::text AS banned_until,
            p.phone_verified, p.email_verified, p.role::text AS role, p.name::text AS name
     FROM profiles p
     LEFT JOIN auth.users u ON u.id = p.id
     WHERE p.id::text = $1
     LIMIT 1`,
    [id]
  );
  return (res.rows[0] || null) as
    | {
        email: string | null;
        banned_until: string | null;
        phone_verified: boolean | null;
        email_verified: boolean | null;
        role: string | null;
        name: string | null;
      }
    | null;
}

export async function applyProfileAction(opts: {
  id: string;
  action: ProfileAction;
  role?: string;
  adminUsername: string;
}): Promise<{ ok: boolean; error?: string; recoveryLink?: string; message?: string }> {
  const id = String(opts.id || "").trim();
  if (!id) return { ok: false, error: "missing_id" };

  const snap = await getAuthSnapshot(id);
  if (!snap) {
    // Profile may exist without auth row — still allow profile-only updates
    const p = await db.query(`SELECT id::text FROM profiles WHERE id::text = $1`, [id]);
    if (!p.rows[0]) return { ok: false, error: "not_found" };
  }

  const before = snap
    ? `role=${snap.role || "null"};verified=${!!(snap.phone_verified || snap.email_verified)};suspended=${isSuspended(snap.banned_until)}`
    : null;

  try {
    switch (opts.action) {
      case "suspend": {
        const upd = await db.query(
          `UPDATE auth.users SET banned_until = $2::timestamptz WHERE id::text = $1`,
          [id, FAR_BAN]
        );
        if (!upd.rowCount) {
          return { ok: false, error: "no_auth_user" };
        }
        await writeAdminAudit({
          adminUsername: opts.adminUsername,
          action: "suspend_user",
          targetId: id,
          beforeStatus: before,
          afterStatus: "suspended",
        });
        return { ok: true, message: "suspended" };
      }
      case "activate": {
        const upd = await db.query(`UPDATE auth.users SET banned_until = NULL WHERE id::text = $1`, [
          id,
        ]);
        if (!upd.rowCount) {
          return { ok: false, error: "no_auth_user" };
        }
        await writeAdminAudit({
          adminUsername: opts.adminUsername,
          action: "activate_user",
          targetId: id,
          beforeStatus: before,
          afterStatus: "active",
        });
        return { ok: true, message: "activated" };
      }
      case "verify": {
        await db.query(
          `UPDATE profiles
           SET phone_verified = true,
               email_verified = true,
               verification_method = COALESCE(verification_method, 'admin')
           WHERE id::text = $1`,
          [id]
        );
        await writeAdminAudit({
          adminUsername: opts.adminUsername,
          action: "verify_user",
          targetId: id,
          beforeStatus: before,
          afterStatus: "verified",
        });
        return { ok: true, message: "verified" };
      }
      case "unverify": {
        await db.query(
          `UPDATE profiles SET phone_verified = false, email_verified = false, verification_method = NULL WHERE id::text = $1`,
          [id]
        );
        await writeAdminAudit({
          adminUsername: opts.adminUsername,
          action: "unverify_user",
          targetId: id,
          beforeStatus: before,
          afterStatus: "unverified",
        });
        return { ok: true, message: "unverified" };
      }
      case "set_role": {
        const role = String(opts.role || "").toLowerCase().trim();
        if (!["customer", "provider", "admin"].includes(role)) {
          return { ok: false, error: "invalid_role" };
        }
        await db.query(`UPDATE profiles SET role = $2 WHERE id::text = $1`, [id, role]);
        await writeAdminAudit({
          adminUsername: opts.adminUsername,
          action: "set_role",
          targetId: id,
          beforeStatus: before,
          afterStatus: role,
        });
        return { ok: true, message: "role_updated" };
      }
      case "reset_password": {
        const email = snap?.email;
        if (!email) return { ok: false, error: "no_email" };
        const { data, error } = await supabaseServer.auth.admin.generateLink({
          type: "recovery",
          email,
        });
        if (error) {
          console.error("generateLink failed:", error.message);
          return { ok: false, error: error.message || "reset_failed" };
        }
        const link =
          (data as { properties?: { action_link?: string } } | null)?.properties?.action_link ||
          undefined;
        // Mark reset token fields if present (legacy columns)
        try {
          const token = `admin-reset-${Date.now()}`;
          await db.query(
            `UPDATE profiles SET reset_token = $2, reset_token_expiry = NOW() + INTERVAL '24 hours' WHERE id::text = $1`,
            [id, token]
          );
        } catch {
          /* optional columns already exist but ignore failures */
        }
        await writeAdminAudit({
          adminUsername: opts.adminUsername,
          action: "force_password_reset",
          targetId: id,
          beforeStatus: before,
          afterStatus: link ? "link_generated" : "requested",
        });
        return { ok: true, recoveryLink: link, message: "reset_link" };
      }
      case "delete": {
        // Prefer Auth delete; then clean profiles row. Related content is left (FK may block).
        const { error } = await supabaseServer.auth.admin.deleteUser(id);
        if (error) {
          // Fallback: suspend + wipe profile PII-ish markers
          console.error("deleteUser failed, suspending instead:", error.message);
          await db.query(`UPDATE auth.users SET banned_until = $2::timestamptz WHERE id::text = $1`, [
            id,
            FAR_BAN,
          ]);
          await writeAdminAudit({
            adminUsername: opts.adminUsername,
            action: "delete_user_fallback_suspend",
            targetId: id,
            beforeStatus: before,
            afterStatus: error.message,
          });
          return { ok: false, error: `delete_failed_suspended: ${error.message}` };
        }
        try {
          await db.query(`DELETE FROM profiles WHERE id::text = $1`, [id]);
        } catch (e) {
          console.error("profiles delete after auth delete:", e);
        }
        await writeAdminAudit({
          adminUsername: opts.adminUsername,
          action: "delete_user",
          targetId: id,
          beforeStatus: before,
          afterStatus: "deleted",
        });
        return { ok: true, message: "deleted" };
      }
      default:
        return { ok: false, error: "unknown_action" };
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("applyProfileAction", opts.action, msg);
    return { ok: false, error: msg };
  }
}

export async function applyBulkProfileAction(opts: {
  ids: string[];
  action: Exclude<ProfileAction, "set_role" | "reset_password">;
  adminUsername: string;
}): Promise<{ ok: boolean; done: number; errors: string[] }> {
  const ids = Array.from(new Set(opts.ids.map((x) => String(x || "").trim()).filter(Boolean)));
  let done = 0;
  const errors: string[] = [];
  for (const id of ids) {
    const res = await applyProfileAction({
      id,
      action: opts.action,
      adminUsername: opts.adminUsername,
    });
    if (res.ok) done++;
    else errors.push(`${id}: ${res.error || "failed"}`);
  }
  return { ok: errors.length === 0, done, errors };
}
