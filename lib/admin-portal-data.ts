import { db } from "@/lib/db";
import { sqlIsUnverified } from "@/lib/admin-users-shared";
import { parseReportReason, reportTypeLabel } from "@/lib/admin-flags-shared";

function quietAdminDbFail(label: string, e: unknown) {
  // Prefer warn over error: Next.js dev overlay treats console.error during RSC as a crash.
  const msg = e instanceof Error ? e.message : String(e);
  console.warn(`[admin] ${label}:`, msg);
}

export async function safeCount(sql: string, params: unknown[] = []): Promise<number> {
  try {
    const res = await db.query(sql, params);
    return Number(res.rows[0]?.c || 0);
  } catch (e) {
    quietAdminDbFail("safeCount failed", e);
    return 0;
  }
}

export async function safeRows<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const res = await db.query(sql, params);
    return (res.rows || []) as T[];
  } catch (e) {
    quietAdminDbFail("safeRows failed", e);
    return [];
  }
}

export type PortalActionCounts = {
  pendingCustomerRequests: number;
  pendingProviderRequests: number;
  pendingReports: number;
  pendingServiceModeration: number;
  pendingHelpPosts: number;
  unverifiedProfiles: number;
};

export type PortalFeedItem = {
  kind: "request" | "report" | "moderation" | "help" | "history" | "alert";
  id: string;
  titleAr: string;
  titleEn: string;
  metaAr: string;
  metaEn: string;
  href: string;
  createdAt: string | null;
};

export async function loadPortalActionCounts(): Promise<PortalActionCounts> {
  const [
    pendingCustomerRequests,
    // Live DB has no provider_requests table; pending providers are profiles/services instead.
    pendingProviderRequests,
    pendingReports,
    pendingServiceModeration,
    pendingHelpPosts,
    unverifiedProfiles,
  ] = await Promise.all([
    safeCount(
      `SELECT COUNT(*)::int AS c FROM customer_requests
       WHERE lower(COALESCE(status, 'pending')) IN ('pending','new','open')`
    ),
    // Count provider profiles still unverified (closest live substitute for provider_requests).
    safeCount(
      `SELECT COUNT(*)::int AS c FROM profiles
       WHERE lower(COALESCE(role, '')) = 'provider'
         AND ${sqlIsUnverified()}`
    ),
    safeCount(
      `SELECT COUNT(*)::int AS c FROM content_reports
       WHERE lower(COALESCE(status, 'open')) IN ('open','pending','new')`
    ),
    safeCount(
      `SELECT COUNT(*)::int AS c FROM provider_services
       WHERE lower(COALESCE(moderation_status, 'pending')) IN ('pending','new','review','awaiting')
          OR (moderation_status IS NULL AND COALESCE(is_active, false) = false)`
    ),
    safeCount(
      `SELECT COUNT(*)::int AS c FROM community_posts
       WHERE type = 'help_request'
         AND lower(COALESCE(moderation_status, 'pending')) IN ('pending','new','open','review')`
    ),
    // Same definition as /admin/users + Account isFullyVerified: neither phone nor email verified.
    safeCount(`SELECT COUNT(*)::int AS c FROM profiles WHERE ${sqlIsUnverified()}`),
  ]);

  return {
    pendingCustomerRequests,
    pendingProviderRequests,
    pendingReports,
    pendingServiceModeration,
    pendingHelpPosts,
    unverifiedProfiles,
  };
}

export async function loadPortalActionFeed(locale: string): Promise<PortalFeedItem[]> {
  const items: PortalFeedItem[] = [];

  // customer_requests has no name/ref columns — join profiles for display name.
  const requests = await safeRows<{
    id: string;
    name: string | null;
    service_type: string | null;
    status: string | null;
    created_at: string | null;
    ref: string | null;
  }>(
    `SELECT cr.id::text AS id,
            COALESCE(p.name, NULLIF(TRIM(COALESCE(cr.notes, '')), ''), cr.id::text) AS name,
            cr.service_type,
            cr.status,
            cr.created_at::text AS created_at,
            cr.id::text AS ref
     FROM customer_requests cr
     LEFT JOIN profiles p ON p.id = cr.customer_id
     WHERE lower(COALESCE(cr.status, 'pending')) IN ('pending','new','open')
     ORDER BY cr.created_at DESC LIMIT 8`
  );
  for (const r of requests) {
    items.push({
      kind: "request",
      id: `req-${r.id}`,
      titleAr: `طلب عميل: ${r.name || "—"}`,
      titleEn: `Customer request: ${r.name || "—"}`,
      metaAr: `${r.service_type || "—"} · ${r.ref || r.id}`,
      metaEn: `${r.service_type || "—"} · ${r.ref || r.id}`,
      href: "/admin/requests",
      createdAt: r.created_at,
    });
  }

  const reports = await safeRows<{
    id: string;
    target_type: string | null;
    reason: string | null;
    created_at: string | null;
  }>(
    `SELECT id::text AS id, target_type, reason, created_at::text AS created_at
     FROM content_reports
     WHERE lower(COALESCE(status, 'open')) IN ('open','pending','new')
     ORDER BY created_at DESC LIMIT 8`
  );
  for (const r of reports) {
    const human = parseReportReason(r.reason).humanReason;
    items.push({
      kind: "report",
      id: `flag-${r.id}`,
      titleAr: `بلاغ جديد: ${reportTypeLabel(true, r.target_type)}`,
      titleEn: `New report: ${reportTypeLabel(false, r.target_type)}`,
      metaAr: human.slice(0, 80) || "—",
      metaEn: human.slice(0, 80) || "—",
      href: `/admin/flags/${r.id}`,
      createdAt: r.created_at,
    });
  }

  const mods = await safeRows<{
    id: string;
    title: string | null;
    moderation_status: string | null;
    created_at: string | null;
  }>(
    `SELECT id::text AS id, title, moderation_status, created_at::text AS created_at
     FROM provider_services
     WHERE lower(COALESCE(moderation_status, 'pending')) IN ('pending','new','review','awaiting')
     ORDER BY created_at DESC NULLS LAST LIMIT 8`
  );
  for (const r of mods) {
    items.push({
      kind: "moderation",
      id: `mod-${r.id}`,
      titleAr: `خدمة بانتظار المراجعة: ${r.title || r.id}`,
      titleEn: `Service awaiting review: ${r.title || r.id}`,
      metaAr: r.moderation_status || "pending",
      metaEn: r.moderation_status || "pending",
      href: "/admin/moderation",
      createdAt: r.created_at,
    });
  }

  const help = await safeRows<{
    id: string;
    title: string | null;
    city_label: string | null;
    created_at: string | null;
  }>(
    `SELECT id::text AS id, title, city_label, created_at::text AS created_at
     FROM community_posts
     WHERE type = 'help_request'
     ORDER BY created_at DESC LIMIT 5`
  );
  for (const r of help) {
    items.push({
      kind: "help",
      id: `help-${r.id}`,
      titleAr: `فزعة: ${r.title || "—"}`,
      titleEn: `Help: ${r.title || "—"}`,
      metaAr: r.city_label || "—",
      metaEn: r.city_label || "—",
      href: "/admin/fazaa",
      createdAt: r.created_at,
    });
  }

  const history = await safeRows<{
    id: string;
    event: string | null;
    ref: string | null;
    note: string | null;
    created_at: string | null;
  }>(
    `SELECT id::text AS id, event, ref, note, created_at::text AS created_at
     FROM status_history
     ORDER BY created_at DESC LIMIT 8`
  );
  for (const r of history) {
    items.push({
      kind: "history",
      id: `hist-${r.id}`,
      titleAr: `عملية: ${r.event || "—"}`,
      titleEn: `Event: ${r.event || "—"}`,
      metaAr: `${r.ref || "—"} · ${(r.note || "").slice(0, 60)}`,
      metaEn: `${r.ref || "—"} · ${(r.note || "").slice(0, 60)}`,
      href: "/admin/history",
      createdAt: r.created_at,
    });
  }

  void locale;
  return items
    .filter((x) => x.createdAt)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 20);
}

export type PortalKpis = {
  accounts: number;
  activeBookings: number;
  publishedServices: number;
  harajAds: number;
  pendingReports: number;
};

export async function loadPortalKpis(): Promise<PortalKpis> {
  const [accounts, activeBookings, publishedServices, harajAds, pendingReports] = await Promise.all([
    safeCount("SELECT COUNT(*)::int AS c FROM profiles"),
    safeCount(
      `SELECT COUNT(*)::int AS c FROM bookings
       WHERE lower(COALESCE(status, '')) IN ('pending','confirmed','accepted','in_progress','active','paid')`
    ),
    safeCount("SELECT COUNT(*)::int AS c FROM provider_services WHERE is_active = true"),
    safeCount("SELECT COUNT(*)::int AS c FROM haraj_items"),
    safeCount(
      `SELECT COUNT(*)::int AS c FROM content_reports
       WHERE lower(COALESCE(status, 'open')) IN ('open','pending','new')`
    ),
  ]);
  return { accounts, activeBookings, publishedServices, harajAds, pendingReports };
}
