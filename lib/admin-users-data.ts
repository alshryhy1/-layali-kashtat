import { db } from "@/lib/db";
import { safeRows } from "@/lib/admin-portal-data";
import type { AdminUserListFilters, AdminUserRow } from "@/lib/admin-users-shared";
import { sqlIsUnverified, sqlIsVerified } from "@/lib/admin-users-shared";

export type { AdminUserListFilters, AdminUserRow };
export {
  isSuspended,
  isVerified,
  parseVerifiedFilter,
  roleLabel,
  statusLabel,
  membershipId,
  sqlIsUnverified,
  sqlIsVerified,
} from "@/lib/admin-users-shared";

const LIST_SELECT = `
  SELECT
    p.id::text AS id,
    p.name::text AS name,
    p.phone::text AS phone,
    p.email::text AS email,
    p.role::text AS role,
    p.phone_verified,
    p.email_verified,
    p.created_at::text AS created_at,
    u.last_sign_in_at::text AS last_login,
    u.banned_until::text AS banned_until,
    (
      SELECT COUNT(*)::int FROM provider_services ps
      WHERE ps.user_id = p.id OR ps.provider_id = p.id
    ) AS services_count,
    (
      SELECT COUNT(*)::int FROM bookings b
      WHERE b.customer_id = p.id OR b.provider_id = p.id
    ) AS bookings_count,
    (
      SELECT COUNT(*)::int FROM haraj_items h WHERE h.user_id = p.id
    ) AS haraj_count,
    (
      SELECT COUNT(*)::int FROM ads a WHERE a.user_id = p.id
    ) AS ads_count,
    (
      SELECT c.name::text
      FROM provider_services ps
      LEFT JOIN cities c ON c.id = ps.city_id
      WHERE (ps.user_id = p.id OR ps.provider_id = p.id) AND c.name IS NOT NULL
      ORDER BY ps.created_at DESC NULLS LAST
      LIMIT 1
    ) AS city
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
`;

export async function listAdminUsers(filters: AdminUserListFilters = {}): Promise<AdminUserRow[]> {
  const where: string[] = ["1=1"];
  const params: unknown[] = [];
  let i = 1;

  const q = String(filters.q || "").trim();
  if (q) {
    const qCompact = q.replace(/-/g, "");
    where.push(
      `(p.name ILIKE $${i} OR p.phone ILIKE $${i} OR p.email ILIKE $${i}
        OR p.id::text ILIKE $${i} OR REPLACE(p.id::text, '-', '') ILIKE $${i + 1})`
    );
    params.push(`%${q}%`);
    params.push(`%${qCompact}%`);
    i += 2;
  }

  const verified = filters.verified || "all";
  if (verified === "verified") {
    where.push(sqlIsVerified("p"));
  } else if (verified === "unverified") {
    where.push(sqlIsUnverified("p"));
  }

  const role = filters.role || "all";
  if (role === "customer") {
    where.push(`(lower(COALESCE(p.role, 'customer')) = 'customer')`);
  } else if (role === "provider") {
    where.push(
      `(lower(COALESCE(p.role, '')) = 'provider' OR EXISTS (
         SELECT 1 FROM provider_services ps WHERE ps.user_id = p.id OR ps.provider_id = p.id
       ))`
    );
  } else if (role === "admin") {
    where.push(`lower(COALESCE(p.role, '')) = 'admin'`);
  }

  const status = filters.status || "all";
  if (status === "suspended") {
    where.push(`(u.banned_until IS NOT NULL AND u.banned_until > NOW())`);
  } else if (status === "active") {
    where.push(`(u.banned_until IS NULL OR u.banned_until <= NOW())`);
  }

  const limit = Math.min(Math.max(Number(filters.limit) || 200, 1), 1000);
  const sql = `${LIST_SELECT}
    WHERE ${where.join(" AND ")}
    ORDER BY p.created_at DESC NULLS LAST
    LIMIT ${limit}`;

  return safeRows<AdminUserRow>(sql, params);
}

export async function getAdminUser(id: string): Promise<AdminUserRow | null> {
  const rows = await safeRows<AdminUserRow>(`${LIST_SELECT} WHERE p.id::text = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function getUserRelated(id: string) {
  const [services, bookings, haraj, ads, reports, activity] = await Promise.all([
    safeRows<{
      id: string;
      title: string | null;
      moderation_status: string | null;
      is_active: boolean | null;
      created_at: string | null;
    }>(
      `SELECT id::text AS id, title, moderation_status, is_active, created_at::text AS created_at
       FROM provider_services
       WHERE user_id::text = $1 OR provider_id::text = $1
       ORDER BY created_at DESC NULLS LAST LIMIT 50`,
      [id]
    ),
    safeRows<{
      id: string;
      booking_number: string | null;
      status: string | null;
      created_at: string | null;
      scheduled_at: string | null;
    }>(
      `SELECT id::text AS id, booking_number::text AS booking_number, status,
              created_at::text AS created_at, scheduled_at::text AS scheduled_at
       FROM bookings
       WHERE customer_id::text = $1 OR provider_id::text = $1
       ORDER BY created_at DESC NULLS LAST LIMIT 50`,
      [id]
    ),
    safeRows<{
      id: string;
      title: string | null;
      price: string | null;
      city: string | null;
      created_at: string | null;
    }>(
      `SELECT id::text AS id, title, price::text AS price, city::text AS city, created_at::text AS created_at
       FROM haraj_items WHERE user_id::text = $1
       ORDER BY created_at DESC NULLS LAST LIMIT 50`,
      [id]
    ),
    safeRows<{
      id: string;
      title: string | null;
      status: string | null;
      city: string | null;
      created_at: string | null;
    }>(
      `SELECT id::text AS id, title, status, city::text AS city, created_at::text AS created_at
       FROM ads WHERE user_id::text = $1
       ORDER BY created_at DESC NULLS LAST LIMIT 50`,
      [id]
    ),
    safeRows<{
      id: string;
      target_type: string | null;
      target_id: string | null;
      reason: string | null;
      status: string | null;
      created_at: string | null;
      as_reporter: boolean;
    }>(
      `SELECT * FROM (
         SELECT id::text AS id, target_type, target_id::text AS target_id, reason, status,
                created_at::text AS created_at, true AS as_reporter
         FROM content_reports WHERE reporter_id::text = $1
         UNION ALL
         SELECT id::text AS id, target_type, target_id::text AS target_id, reason, status,
                created_at::text AS created_at, false AS as_reporter
         FROM content_reports
         WHERE target_id::text = $1
       ) r
       ORDER BY created_at DESC NULLS LAST
       LIMIT 50`,
      [id]
    ),
    safeRows<{
      id: string;
      action: string | null;
      target_table: string | null;
      before_status: string | null;
      after_status: string | null;
      admin_username: string | null;
      created_at: string | null;
    }>(
      `SELECT id::text AS id, action, target_table, before_status, after_status,
              admin_username, created_at::text AS created_at
       FROM admin_audit_log
       WHERE target_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [id]
    ),
  ]);

  return { services, bookings, haraj, ads, reports, activity };
}

export async function writeAdminAudit(input: {
  adminUsername?: string | null;
  action: string;
  targetTable?: string;
  targetId?: string;
  beforeStatus?: string | null;
  afterStatus?: string | null;
  ip?: string | null;
}) {
  try {
    await db.query(
      `INSERT INTO admin_audit_log (admin_username, action, target_table, target_id, before_status, after_status, ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.adminUsername || "admin",
        input.action,
        input.targetTable || "profiles",
        input.targetId || null,
        input.beforeStatus ?? null,
        input.afterStatus ?? null,
        input.ip || null,
      ]
    );
  } catch (e) {
    console.error("admin_audit_log write failed:", e);
  }
}
