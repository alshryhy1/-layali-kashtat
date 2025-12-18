import * as React from "react";

type Locale = "ar" | "en";

export type Row = {
  id: string;
  name?: string | null;
  phone?: string | null;
  service_type?: string | null;
  city?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export default function RequestsTable(props: {
  locale?: Locale;
  rows?: Row[];
  renderActions?: (row: Row) => React.ReactNode;
}) {
  const locale: Locale = props.locale === "en" ? "en" : "ar";
  const rows: Row[] = Array.isArray(props.rows) ? props.rows : [];
  const hasActions = typeof props.renderActions === "function";

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          overflowX: "auto",
          border: "1px solid #eee",
          borderRadius: 12,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={thStyle}>{locale === "ar" ? "الاسم" : "Name"}</th>
              <th style={thStyle}>{locale === "ar" ? "الجوال" : "Phone"}</th>
              <th style={thStyle}>
                {locale === "ar" ? "نوع الخدمة" : "Service type"}
              </th>
              <th style={thStyle}>{locale === "ar" ? "المدينة" : "City"}</th>
              <th style={thStyle}>{locale === "ar" ? "الحالة" : "Status"}</th>
              <th style={thStyle}>{locale === "ar" ? "التاريخ" : "Date"}</th>
              {hasActions ? (
                <th style={thStyle}>{locale === "ar" ? "إجراءات" : "Actions"}</th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td style={tdStyle} colSpan={hasActions ? 7 : 6}>
                  {locale === "ar" ? "لا توجد طلبات." : "No requests found."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td style={tdStyle}>{r.name || "-"}</td>
                  <td style={tdStyle}>{r.phone || "-"}</td>
                  <td style={tdStyle}>{r.service_type || "-"}</td>
                  <td style={tdStyle}>{r.city || "-"}</td>
                  <td style={tdStyle}>{r.status || "-"}</td>
                  <td style={tdStyle}>{formatDate(r.created_at) || "-"}</td>
                  {hasActions ? (
                    <td style={tdStyle}>{props.renderActions?.(r) ?? null}</td>
                  ) : null}
                </tr>
              ))
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
};

function formatDate(v?: string | null) {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleString();
  } catch {
    return v;
  }
}
