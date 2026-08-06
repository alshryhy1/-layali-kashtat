import { db } from "@/lib/db";
import { parseReportReason, reportTypeLabel } from "@/lib/admin-flags-shared";

function quietAdminDbFail(label: string, e: unknown) {
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
  recentOps: number;
};

export type ActionItem = {
  kind: string;
  titleAr: string;
  titleEn: string;
  metaAr: string;
  metaEn: string;
  href: string;
  createdAt: string | null;
};

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

export async function loadActionCounts(): Promise<PortalActionCounts> {
  const [
    pendingCustomerRequests,
    pendingProviderRequests,
    pendingReports,
    pendingServiceModeration,
    pendingHelpPosts,
    recentOps,
  ] = await Promise.all([
    safeCount(
      `SELECT COUNT(*)::int AS c FROM customer_requests
       WHERE lower(COALESCE(status, 'pending')) IN ('pending','new','open')`
    ),
    // Live DB has no provider_requests — use unverified provider profiles instead.
    safeCount(
      `SELECT COUNT(*)::int AS c FROM profiles
       WHERE lower(COALESCE(role, '')) = 'provider'
         AND (COALESCE(phone_verified, false) = false AND COALESCE(email_verified, false) = false)`
    ),
    safeCount(
      `SELECT COUNT(*)::int AS c FROM content_reports
       WHERE lower(COALESCE(status, 'open')) IN ('open','pending','new')`
    ),
    safeCount(
      `SELECT COUNT(*)::int AS c FROM provider_services
       WHERE lower(COALESCE(moderation_status, 'pending')) IN ('pending','new','review','submitted')`
    ),
    safeCount(
      `SELECT COUNT(*)::int AS c FROM community_posts
       WHERE type = 'help_request'
         AND lower(COALESCE(moderation_status, 'approved')) NOT IN ('rejected','removed')
         AND created_at > NOW() - INTERVAL '7 days'`
    ),
    safeCount(`SELECT COUNT(*)::int AS c FROM status_history WHERE created_at > NOW() - INTERVAL '7 days'`),
  ]);
  return {
    pendingCustomerRequests,
    pendingProviderRequests,
    pendingReports,
    pendingServiceModeration,
    pendingHelpPosts,
    recentOps,
  };
}

/** Build actionable feed rows for the admin home. */
export async function loadActionFeed(locale: string): Promise<ActionItem[]> {
  const items: ActionItem[] = [];
  const isAr = locale !== "en";

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
      titleAr: `بلاغ جديد · ${reportTypeLabel(true, r.target_type)}`,
      titleEn: `New report · ${reportTypeLabel(false, r.target_type)}`,
      metaAr: human.slice(0, 80) || "بدون تفاصيل",
      metaEn: human.slice(0, 80) || "No details",
      href: `/admin/flags/${r.id}`,
      createdAt: r.created_at,
    });
  }

  const pendingServices = await safeRows<{
    id: string;
    title: string | null;
    created_at: string | null;
  }>(
    `SELECT id::text AS id, title, created_at::text AS created_at
     FROM provider_services
     WHERE lower(COALESCE(moderation_status, 'pending')) IN ('pending','new','review','submitted')
     ORDER BY created_at DESC NULLS LAST LIMIT 8`
  );
  for (const s of pendingServices) {
    items.push({
      kind: "moderation",
      titleAr: `خدمة بانتظار المراجعة · ${s.title || s.id}`,
      titleEn: `Service pending review · ${s.title || s.id}`,
      metaAr: "مراجعة قبل النشر",
      metaEn: "Pre-publish review",
      href: "/admin/moderation",
      createdAt: s.created_at,
    });
  }

  const customerReqs = await safeRows<{
    id: string;
    name: string | null;
    service_type: string | null;
    created_at: string | null;
    ref: string | null;
  }>(
    `SELECT cr.id::text AS id,
            COALESCE(p.name, NULLIF(TRIM(COALESCE(cr.notes, '')), ''), cr.id::text) AS name,
            cr.service_type,
            cr.created_at::text AS created_at,
            cr.id::text AS ref
     FROM customer_requests cr
     LEFT JOIN profiles p ON p.id = cr.customer_id
     WHERE lower(COALESCE(cr.status, 'pending')) IN ('pending','new','open')
     ORDER BY cr.created_at DESC LIMIT 8`
  );
  for (const c of customerReqs) {
    items.push({
      kind: "request",
      titleAr: `طلب عميل جديد · ${c.name || c.ref || c.id}`,
      titleEn: `New customer request · ${c.name || c.ref || c.id}`,
      metaAr: c.service_type || "طلب",
      metaEn: c.service_type || "request",
      href: "/admin/requests",
      createdAt: c.created_at,
    });
  }

  const helpPosts = await safeRows<{
    id: string;
    title: string | null;
    created_at: string | null;
  }>(
    `SELECT id::text AS id, title, created_at::text AS created_at
     FROM community_posts
     WHERE type = 'help_request'
       AND lower(COALESCE(moderation_status, 'approved')) NOT IN ('rejected','removed')
     ORDER BY created_at DESC LIMIT 5`
  );
  for (const h of helpPosts) {
    items.push({
      kind: "fazaa",
      titleAr: `فزعة / طلب مساعدة · ${h.title || h.id}`,
      titleEn: `Help request · ${h.title || h.id}`,
      metaAr: "منشور مجتمع",
      metaEn: "Community post",
      href: "/admin/community",
      createdAt: h.created_at,
    });
  }

  const ops = await safeRows<{
    event: string | null;
    ref: string | null;
    note: string | null;
    created_at: string | null;
  }>(
    `SELECT event, ref, note, created_at::text AS created_at
     FROM status_history
     ORDER BY created_at DESC LIMIT 8`
  );
  for (const o of ops) {
    items.push({
      kind: "history",
      titleAr: `عملية · ${o.event || "تحديث"} (${o.ref || "—"})`,
      titleEn: `Operation · ${o.event || "update"} (${o.ref || "—"})`,
      metaAr: (o.note || "").slice(0, 80) || "سجل الحالة",
      metaEn: (o.note || "").slice(0, 80) || "Status history",
      href: "/admin/history",
      createdAt: o.created_at,
    });
  }

  items.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  void isAr;
  return items.slice(0, 20);
}
