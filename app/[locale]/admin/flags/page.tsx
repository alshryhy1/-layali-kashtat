import Link from "next/link";
import {
  AdminPageShell,
  AdminEmptyState,
  adminTableStyle,
  adminThStyle,
  adminTdStyle,
} from "@/components/AdminPageShell";
import { requireAdminLocale, fmtAdminDate } from "@/lib/admin-auth-page";
import { listAdminFlags } from "@/lib/admin-flags-data";
import { localeHref } from "@/lib/locales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminFlagsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ status?: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);
  const sp = (await searchParams) || {};
  const statusRaw = String(sp.status || "all").toLowerCase();
  const statusFilter =
    statusRaw === "pending" || statusRaw === "open" || statusRaw === "new"
      ? "pending"
      : statusRaw === "closed" || statusRaw === "resolved"
        ? "closed"
        : "all";

  let rows: Awaited<ReturnType<typeof listAdminFlags>> = [];
  try {
    rows = await listAdminFlags({ status: statusFilter, limit: 100 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[admin] listAdminFlags failed:", msg);
    rows = [];
  }

  const filters: Array<{ key: "all" | "pending" | "closed"; ar: string; en: string }> = [
    { key: "all", ar: "الكل", en: "All" },
    { key: "pending", ar: "جديد / معلّق", en: "New / pending" },
    { key: "closed", ar: "مُعالَج", en: "Resolved" },
  ];

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "إدارة البلاغات" : "Content reports"}
      subtitle={
        isAr
          ? "مراجعة بلاغات المحتوى بواجهة مشرف — أسماء وأسباب واضحة، لا معرفات خام."
          : "Moderator-friendly report queue — human labels, not raw UUIDs."
      }
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {filters.map((f) => {
          const active = statusFilter === f.key;
          const href =
            f.key === "all"
              ? localeHref(locale, "/admin/flags")
              : localeHref(locale, `/admin/flags?status=${f.key}`);
          return (
            <Link
              key={f.key}
              href={href}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: `1px solid ${active ? "#0f172a" : "#e2e8f0"}`,
                background: active ? "#0f172a" : "#fff",
                color: active ? "#fff" : "#334155",
                fontWeight: 800,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              {isAr ? f.ar : f.en}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <AdminEmptyState isAr={isAr} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "البلاغ" : "Report"}</th>
                <th style={adminThStyle}>{isAr ? "المبلّغ" : "Reporter"}</th>
                <th style={adminThStyle}>{isAr ? "المبلّغ عليه" : "Reported"}</th>
                <th style={adminThStyle}>{isAr ? "السبب" : "Reason"}</th>
                <th style={adminThStyle}>{isAr ? "الحالة" : "Status"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
                <th style={adminThStyle}>{isAr ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={adminTdStyle}>
                    <div style={{ fontWeight: 900 }}>
                      {isAr ? r.targetTypeLabelAr : r.targetTypeLabelEn}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                      #{r.shortId}
                    </div>
                  </td>
                  <td style={adminTdStyle}>
                    {r.reporter?.name || (isAr ? "غير معروف" : "Unknown")}
                    {r.reporter ? (
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {r.reporter.membership}
                      </div>
                    ) : null}
                  </td>
                  <td style={adminTdStyle}>
                    {r.reported?.name || (isAr ? "غير معروف" : "Unknown")}
                    {r.reported ? (
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {r.reported.membership}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ ...adminTdStyle, maxWidth: 280 }}>
                    <span title={r.reasonRaw || undefined}>
                      {(r.reasonHuman || "—").slice(0, 120)}
                    </span>
                  </td>
                  <td style={adminTdStyle}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 900,
                        background:
                          r.statusLabelAr === "جديد" || r.statusLabelEn === "New"
                            ? "#fff7ed"
                            : "#f1f5f9",
                        color:
                          r.statusLabelAr === "جديد" || r.statusLabelEn === "New"
                            ? "#9a3412"
                            : "#475569",
                      }}
                    >
                      {isAr ? r.statusLabelAr : r.statusLabelEn}
                    </span>
                  </td>
                  <td style={adminTdStyle}>{fmtAdminDate(locale, r.createdAt)}</td>
                  <td style={adminTdStyle}>
                    <Link
                      href={localeHref(locale, `/admin/flags/${r.id}`)}
                      style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "#0f172a",
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: 13,
                        textDecoration: "none",
                      }}
                    >
                      {isAr ? "عرض" : "View"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageShell>
  );
}
