import * as React from "react";

type Locale = "ar" | "en";

export type Row = {
  id: string;
  ref_code?: string | null;
  name?: string | null;
  phone?: string | null;
  service_type?: string | null;
  city?: string | null;
  status?: string | null; // pending | approved | rejected
  created_at?: string | null;
};

function normStatus(v: any): "pending" | "approved" | "rejected" {
  const s = String(v || "").trim().toLowerCase();
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  return "pending";
}

function statusLabel(locale: Locale, st: "pending" | "approved" | "rejected") {
  if (locale === "ar") {
    if (st === "approved") return "مقبول";
    if (st === "rejected") return "مرفوض";
    return "انتظار";
  }
  if (st === "approved") return "Approved";
  if (st === "rejected") return "Rejected";
  return "Pending";
}

function formatDate(v?: string | null, locale: Locale = "ar") {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
  } catch {
    return "—";
  }
}

export default function RequestsTable(props: {
  locale?: Locale;
  rows?: Row[];
  renderActions?: (row: Row) => React.ReactNode;
}) {
  const locale: Locale = props.locale === "en" ? "en" : "ar";
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const rows: Row[] = Array.isArray(props.rows) ? props.rows : [];
  const hasActions = typeof props.renderActions === "function";

  return (
    <div style={{ width: "100%" }} dir={dir}>
      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1080 }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={thStyle}>{isAr ? "الاسم" : "Name"}</th>
              <th style={thStyle}>{isAr ? "رقم الجوال" : "Phone"}</th>
              <th style={thStyle}>{isAr ? "نوع الخدمة" : "Service type"}</th>
              <th style={thStyle}>{isAr ? "المدينة" : "City"}</th>
              <th style={thStyle}>{isAr ? "الحالة" : "Status"}</th>
              <th style={thStyle}>{isAr ? "الرقم المرجعي" : "Reference"}</th>
              <th style={thStyle}>{isAr ? "التاريخ" : "Date"}</th>
              {hasActions ? (
                <th style={thStyle}>
                  {isAr ? "قبول/رفض/انتظار" : "Approve/Reject/Pending"}
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td style={tdStyle} colSpan={hasActions ? 8 : 7}>
                  {isAr ? "لا توجد طلبات." : "No requests found."}
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const st = normStatus(r.status);
                return (
                  <tr key={r.id}>
                    <td style={tdStyle}>{r.name || "—"}</td>
                    <td style={tdStyle}>{r.phone || "—"}</td>
                    <td style={tdStyle}>{r.service_type || "—"}</td>
                    <td style={tdStyle}>{r.city || "—"}</td>
                    <td style={tdStyle}>
                      <span style={{ ...badgeStyle, ...badgeByStatus(st) }}>
                        {statusLabel(locale, st)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <code style={refCode}>{r.ref_code || "—"}</code>
                    </td>
                    <td style={tdStyle}>{formatDate(r.created_at, locale)}</td>
                    {hasActions ? (
                      <td style={tdStyle}>{props.renderActions?.(r) ?? null}</td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "start",
  padding: "10px 12px",
  borderBottom: "1px solid #eee",
  fontWeight: 900,
  fontSize: 13,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #f1f1f1",
  fontSize: 13,
  whiteSpace: "nowrap",
  verticalAlign: "top",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #e7e7e7",
  fontWeight: 900,
  fontSize: 12,
};

function badgeByStatus(st: "pending" | "approved" | "rejected"): React.CSSProperties {
  if (st === "approved") {
    return { background: "rgba(0,160,0,0.08)", borderColor: "rgba(0,160,0,0.25)" };
  }
  if (st === "rejected") {
    return { background: "rgba(176,0,0,0.06)", borderColor: "rgba(176,0,0,0.22)" };
  }
  return { background: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.12)" };
}

const refCode: React.CSSProperties = {
  display: "inline-block",
  padding: "3px 8px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(0,0,0,0.03)",
  fontWeight: 800,
  fontSize: 12,
};
