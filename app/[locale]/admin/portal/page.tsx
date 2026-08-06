import Link from "next/link";
import { AdminPageShell, adminCardStyle } from "@/components/AdminPageShell";
import { requireAdminLocale, fmtAdminDate } from "@/lib/admin-auth-page";
import { localeHref } from "@/lib/locales";
import { ADMIN_SECTIONS } from "@/lib/admin-sections";
import {
  loadPortalActionCounts,
  loadPortalActionFeed,
  type PortalFeedItem,
} from "@/lib/admin-portal-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECTIONS = ADMIN_SECTIONS;

function kindLabel(isAr: boolean, kind: PortalFeedItem["kind"]) {
  if (!isAr) {
    const map = {
      request: "Request",
      report: "Report",
      moderation: "Moderation",
      help: "Help",
      history: "History",
      alert: "Alert",
    } as const;
    return map[kind];
  }
  const map = {
    request: "طلب",
    report: "بلاغ",
    moderation: "مراجعة",
    help: "فزعة",
    history: "عملية",
    alert: "تنبيه",
  } as const;
  return map[kind];
}

export default async function AdminPortalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);

  let counts = {
    pendingCustomerRequests: 0,
    pendingProviderRequests: 0,
    pendingReports: 0,
    pendingServiceModeration: 0,
    pendingHelpPosts: 0,
    unverifiedProfiles: 0,
  };
  let feed: PortalFeedItem[] = [];

  if (process.env.DATABASE_URL) {
    try {
      [counts, feed] = await Promise.all([loadPortalActionCounts(), loadPortalActionFeed(locale)]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[admin] Failed to load portal action data:", msg);
    }
  }

  const attentionCards = [
    {
      href: "/admin/requests",
      icon: "🛒",
      labelAr: "الطلبات الجديدة التي تحتاج مراجعة",
      labelEn: "New requests needing review",
      value: counts.pendingCustomerRequests + counts.pendingProviderRequests,
    },
    {
      href: "/admin/flags?status=pending",
      icon: "🚩",
      labelAr: "البلاغات الجديدة",
      labelEn: "New reports",
      value: counts.pendingReports,
    },
    {
      href: "/admin/moderation",
      icon: "⭐",
      labelAr: "خدمات بانتظار المراجعة",
      labelEn: "Services awaiting review",
      value: counts.pendingServiceModeration,
    },
    {
      href: "/admin/users?verified=unverified",
      icon: "✅",
      labelAr: "طلبات تحقق معلقة",
      labelEn: "Pending verification requests",
      value: counts.unverifiedProfiles,
    },
  ];

  const alerts: Array<{ ar: string; en: string; href: string }> = [];
  if (counts.pendingReports > 0) {
    alerts.push({
      ar: `هناك ${counts.pendingReports} بلاغًا مفتوحًا يحتاج مراجعة.`,
      en: `${counts.pendingReports} open report(s) need review.`,
      href: "/admin/flags?status=pending",
    });
  }
  if (counts.pendingServiceModeration > 0) {
    alerts.push({
      ar: `${counts.pendingServiceModeration} خدمة بانتظار الاعتماد قبل النشر.`,
      en: `${counts.pendingServiceModeration} service(s) awaiting approval.`,
      href: "/admin/moderation",
    });
  }
  if (counts.pendingCustomerRequests > 0) {
    alerts.push({
      ar: `${counts.pendingCustomerRequests} طلب عميل بانتظار المعالجة.`,
      en: `${counts.pendingCustomerRequests} customer request(s) pending.`,
      href: "/admin/requests",
    });
  }
  if (counts.pendingHelpPosts > 0) {
    alerts.push({
      ar: `${counts.pendingHelpPosts} فزعة بانتظار المراجعة.`,
      en: `${counts.pendingHelpPosts} help post(s) awaiting review.`,
      href: "/admin/fazaa",
    });
  }

  return (
    <AdminPageShell
      locale={locale}
      showBackToPortal={false}
      title={isAr ? "بوابة الإدارة" : "Admin Portal"}
      subtitle={
        isAr
          ? "وحدة إدارة تشغيلية — راجع ما يحتاج إجراءً ثم افتح القسم المناسب."
          : "Operational management console — review what needs action, then open the right section."
      }
    >
      {/* Action overview */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1e293b", marginBottom: 12 }}>
          {isAr ? "ما يحتاج إجراءً الآن" : "Needs action now"}
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {attentionCards.map((c) => (
            <Link
              key={c.href + c.labelEn}
              href={localeHref(locale, c.href)}
              style={{
                ...adminCardStyle,
                flex: "1 1 200px",
                minWidth: 180,
                maxWidth: 280,
              }}
            >
              <div style={{ fontSize: 28 }}>{c.icon}</div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>
                {isAr ? c.labelAr : c.labelEn}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: c.value > 0 ? "#b45309" : "#0f172a" }}>
                {c.value.toLocaleString(isAr ? "ar-SA" : "en-US")}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Alerts */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1e293b", marginBottom: 12 }}>
          {isAr ? "التنبيهات المهمة" : "Important alerts"}
        </h2>
        {alerts.length === 0 ? (
          <div
            style={{
              padding: 16,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: 12,
              color: "#065f46",
              fontWeight: 700,
            }}
          >
            {isAr ? "لا توجد تنبيهات عاجلة حالياً." : "No urgent alerts right now."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {alerts.map((a) => (
              <Link
                key={a.href + a.en}
                href={localeHref(locale, a.href)}
                style={{
                  display: "block",
                  padding: 14,
                  background: "#fff7ed",
                  border: "1px solid #fdba74",
                  borderRadius: 12,
                  color: "#9a3412",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                {isAr ? a.ar : a.en}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent operations / feed */}
      <section style={{ marginBottom: 36 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1e293b", margin: 0 }}>
            {isAr ? "آخر العمليات والطابور" : "Recent activity & queue"}
          </h2>
          <Link
            href={localeHref(locale, "/admin/history")}
            style={{ fontSize: 13, color: "#64748b", fontWeight: 700, textDecoration: "none" }}
          >
            {isAr ? "سجل الحالة ←" : "Status history →"}
          </Link>
        </div>
        {feed.length === 0 ? (
          <div
            style={{
              padding: 20,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            {isAr ? "لا توجد عناصر حديثة في الطابور." : "No recent queue items."}
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {feed.map((item) => (
              <Link
                key={item.id}
                href={localeHref(locale, item.href)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "14px 16px",
                  borderBottom: "1px solid #f1f5f9",
                  textDecoration: "none",
                  color: "inherit",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#f1f5f9",
                        color: "#475569",
                      }}
                    >
                      {kindLabel(isAr, item.kind)}
                    </span>
                    <span style={{ fontWeight: 800, color: "#0f172a" }}>
                      {isAr ? item.titleAr : item.titleEn}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    {isAr ? item.metaAr : item.metaEn}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
                  {fmtAdminDate(locale, item.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Management hubs */}
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1e293b", marginBottom: 12 }}>
          {isAr ? "أقسام الإدارة" : "Management sections"}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {SECTIONS.map((s) => (
            <Link key={s.href} href={localeHref(locale, s.href)} style={adminCardStyle}>
              <div style={{ fontSize: 32 }}>{s.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{isAr ? s.titleAr : s.titleEn}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{isAr ? s.descAr : s.descEn}</div>
            </Link>
          ))}
        </div>
        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link
            href={localeHref(locale, "/admin/requests")}
            style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}
          >
            {isAr ? "لوحة طلبات العملاء (مباشر)" : "Customer requests (direct)"}
          </Link>
          <span style={{ color: "#cbd5e1" }}>·</span>
          <Link
            href={localeHref(locale, "/admin/history")}
            style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}
          >
            {isAr ? "سجل الحالة" : "Status history"}
          </Link>
        </div>
      </section>
    </AdminPageShell>
  );
}
