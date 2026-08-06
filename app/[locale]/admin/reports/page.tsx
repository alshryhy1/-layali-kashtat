import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  AdminPageShell,
  adminStatCardStyle,
} from "@/components/AdminPageShell";
import { requireAdminLocale } from "@/lib/admin-auth-page";
import { db } from "@/lib/db";
import { loadPortalKpis } from "@/lib/admin-portal-data";
import { localeHref } from "@/lib/locales";
import {
  IOS_DOWNLOADS_ANALYTICS_KEY,
  allowManualDownloadsFallback,
  resolveIosAppDownloads,
  type DownloadsResult,
} from "@/lib/app-downloads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);

  let totalViews = 0;
  let downloads: DownloadsResult = {
    count: null,
    source: "unavailable",
    sourceLabelAr: "التحديث التلقائي متوقف — ينقص ASC_ISSUER_ID",
    sourceLabelEn: "Auto-update stopped — ASC_ISSUER_ID missing",
    ascConfigured: false,
    ascKeyMaterialPresent: false,
    missing: ["ASC_ISSUER_ID"],
    ascAppId: "6771470757",
    lastUpdatedAt: null,
    cacheHit: false,
  };
  const showManualFallback = allowManualDownloadsFallback();
  let kpis = {
    accounts: 0,
    activeBookings: 0,
    publishedServices: 0,
    harajAds: 0,
    pendingReports: 0,
  };

  try {
    if (process.env.DATABASE_URL) {
      const viewsRes = await db.query("SELECT value FROM site_analytics WHERE key = 'total_views'");
      if (viewsRes.rows.length > 0) {
        totalViews = Number(viewsRes.rows[0].value || 0);
      }
      downloads = await resolveIosAppDownloads(db);
      kpis = await loadPortalKpis();
    }
  } catch (e) {
    console.error("Failed to fetch reports metrics:", e);
  }

  async function updateAppDownloads(formData: FormData) {
    "use server";
    if (process.env.ALLOW_MANUAL_APP_DOWNLOADS !== "1") return;
    const raw = String(formData.get("downloads") || "").trim();
    if (raw === "") return;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return;
    await db.query(
      `
      INSERT INTO site_analytics (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
      [IOS_DOWNLOADS_ANALYTICS_KEY, Math.floor(n)]
    );
    revalidatePath("/ar/admin/reports");
    revalidatePath("/en/admin/reports");
    revalidatePath("/admin/reports");
  }

  async function refreshAscDownloads() {
    "use server";
    await resolveIosAppDownloads(db, { forceRefresh: true });
    revalidatePath("/ar/admin/reports");
    revalidatePath("/en/admin/reports");
    revalidatePath("/admin/reports");
  }

  const kpiItems: Array<{
    labelAr: string;
    labelEn: string;
    value: number;
    icon: string;
    href?: string;
  }> = [
    { labelAr: "عدد الحسابات", labelEn: "Accounts", value: kpis.accounts, icon: "👤" },
    { labelAr: "حجوزات نشطة", labelEn: "Active bookings", value: kpis.activeBookings, icon: "📅" },
    { labelAr: "خدمات منشورة", labelEn: "Published services", value: kpis.publishedServices, icon: "🏕️" },
    { labelAr: "إعلانات الحراج", labelEn: "Haraj listings", value: kpis.harajAds, icon: "🏷️" },
    {
      labelAr: "بلاغات معلّقة",
      labelEn: "Open reports",
      value: kpis.pendingReports,
      icon: "🚩",
      href: "/admin/flags?status=pending",
    },
  ];

  const downloadsUnavailable = downloads.count == null;
  const downloadsNote = isAr ? downloads.sourceLabelAr : downloads.sourceLabelEn;

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "التقارير / الإحصائيات" : "Reports / Analytics"}
      subtitle={
        isAr
          ? "مؤشرات الأداء، زيارات الموقع، وتحميلات App Store Connect."
          : "KPIs, site visits, and App Store Connect downloads."
      }
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "center",
          width: "100%",
          marginBottom: 28,
        }}
      >
        <div style={adminStatCardStyle}>
          <div
            style={{
              fontSize: 13,
              color: "#64748b",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {isAr ? "إجمالي زيارات الموقع" : "Total Site Views"}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#0f172a" }}>
            👁️ {totalViews.toLocaleString(isAr ? "ar-SA" : "en-US")}
          </div>
        </div>

        <div
          style={{
            ...adminStatCardStyle,
            minWidth: 280,
            flex: "1 1 280px",
            textAlign: isAr ? "right" : "left",
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#64748b",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 1,
              textAlign: "center",
            }}
          >
            {isAr ? "تحميلات التطبيق (أول مرة)" : "First-Time Downloads"}
          </div>
          {downloadsUnavailable ? (
            <>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#94a3b8", marginBottom: 8, textAlign: "center" }}>
                —
              </div>
              <div style={{ fontSize: 13, color: "#b45309", fontWeight: 800, marginBottom: 10, textAlign: "center" }}>
                {downloadsNote}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#0f172a", marginBottom: 6, textAlign: "center" }}>
                ⬇️ {(downloads.count ?? 0).toLocaleString(isAr ? "ar-SA" : "en-US")}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, textAlign: "center" }}>
                {downloadsNote}
                {downloads.lastUpdatedAt
                  ? ` · ${isAr ? "آخر تحديث" : "Updated"} ${new Date(downloads.lastUpdatedAt).toLocaleString(
                      isAr ? "ar-SA" : "en-US"
                    )}`
                  : ""}
              </div>
            </>
          )}

          {downloads.ascConfigured ? (
            <form action={refreshAscDownloads} style={{ marginTop: 8, textAlign: "center" }}>
              <button
                type="submit"
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #0f172a",
                  background: "#0f172a",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {isAr ? "تحديث من App Store Connect الآن" : "Refresh from App Store Connect"}
              </button>
            </form>
          ) : (
            <div
              style={{
                marginTop: 10,
                padding: 12,
                background: "#fffbeb",
                border: "1px solid #fcd34d",
                borderRadius: 10,
                fontSize: 12,
                color: "#92400e",
                lineHeight: 1.55,
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 6 }}>
                {isAr ? "لتفعيل التحديث التلقائي:" : "To enable automatic updates:"}
              </div>
              <ol style={{ margin: 0, paddingInlineStart: 18 }}>
                {(downloads.setupStepsAr || []).slice(0, 6).map((s) => (
                  <li key={s} style={{ marginBottom: 4 }}>
                    {s}
                  </li>
                ))}
              </ol>
              {downloads.jwtError ? (
                <div style={{ marginTop: 8, fontWeight: 700, color: "#9a3412" }}>
                  {isAr ? "خطأ التوقيع الأصلي:" : "Original signing error:"}
                  <div style={{ fontWeight: 600, marginTop: 4, wordBreak: "break-word" }}>
                    {downloads.jwtError}
                  </div>
                </div>
              ) : downloads.ascKeyMaterialPresent && downloads.missing.includes("ASC_ISSUER_ID") ? (
                <div style={{ marginTop: 8, fontWeight: 700 }}>
                  {isAr
                    ? "✓ ملف المفتاح (.p8) موجود — ينقص فقط ASC_ISSUER_ID"
                    : "✓ .p8 key found — only ASC_ISSUER_ID is missing"}
                </div>
              ) : null}
            </div>
          )}

          {showManualFallback && (
            <form action={updateAppDownloads} style={{ display: "grid", gap: 8, marginTop: 12 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
                {isAr ? "طوارئ فقط (ALLOW_MANUAL_APP_DOWNLOADS=1)" : "Emergency only"}
              </div>
              <input
                name="downloads"
                type="number"
                min={0}
                step={1}
                defaultValue={downloads.count != null ? String(downloads.count) : ""}
                style={{ padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", textAlign: "center" }}
              />
              <button
                type="submit"
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #64748b",
                  background: "#64748b",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {isAr ? "حفظ يدوي" : "Save manually"}
              </button>
            </form>
          )}

          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 10, lineHeight: 1.4, textAlign: "center" }}>
            {isAr
              ? `ليالي كشتات · App ID ${downloads.ascAppId || "6771470757"}`
              : `Layali Kashtat · App ID ${downloads.ascAppId || "6771470757"}`}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1e293b", marginBottom: 12 }}>
        {isAr ? "مؤشرات من قاعدة البيانات" : "Database KPIs"}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {kpiItems.map((item) => {
          const inner = (
            <>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>
                {isAr ? item.labelAr : item.labelEn}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: item.href && item.value > 0 ? "#b45309" : "#0f172a",
                }}
              >
                {item.icon} {item.value.toLocaleString(isAr ? "ar-SA" : "en-US")}
              </div>
            </>
          );
          if (item.href) {
            return (
              <Link
                key={item.labelEn}
                href={localeHref(locale, item.href)}
                style={{
                  ...adminStatCardStyle,
                  marginBottom: 0,
                  padding: 18,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {inner}
              </Link>
            );
          }
          return (
            <div key={item.labelEn} style={{ ...adminStatCardStyle, marginBottom: 0, padding: 18 }}>
              {inner}
            </div>
          );
        })}
      </div>
    </AdminPageShell>
  );
}
