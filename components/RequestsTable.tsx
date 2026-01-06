"use client";

import * as React from "react";

export type Row = {
  id: string;
  ref_code?: string | null;
  name: string | null;
  phone: string | null;
  service_type: string | null;
  city: string | null;
  status: string | null;
  created_at: string | null;
};

type Locale = "ar" | "en";
type Status = "pending" | "approved" | "rejected";

function fmtDate(locale: Locale, iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function badgeStyle(status: string | null) {
  const s = String(status || "pending").toLowerCase();
  const base: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid #e7e7e7",
    background: "#f7f7f7",
    color: "#111",
    whiteSpace: "nowrap",
  };

  if (s === "approved")
    return { ...base, border: "1px solid #b7ebc6", background: "#f0fff4" };
  if (s === "rejected")
    return { ...base, border: "1px solid #ffd0d0", background: "#fff5f5" };
  return base;
}

function statusLabel(locale: Locale, status: string | null) {
  const isAr = locale === "ar";
  const s = String(status || "pending").toLowerCase();
  if (s === "approved") return isAr ? "مقبول" : "Approved";
  if (s === "rejected") return isAr ? "مرفوض" : "Rejected";
  return isAr ? "قيد الانتظار" : "Pending";
}

export default function RequestsTable({
  locale,
  rows,
  busyId,
  onUpdateStatus,
}: {
  locale: Locale;
  rows: Row[];
  busyId?: string | null;
  onUpdateStatus?: (id: string, status: Status) => void;
}) {
  const isAr = locale === "ar";
  const canAction = typeof onUpdateStatus === "function";

  const btnBase: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #111",
    background: "#fff",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    background: "#111",
    color: "#fff",
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e7e7e7",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ width: "100%", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={thStyle}>{isAr ? "رقم الطلب" : "Request #"}</th>
              <th style={thStyle}>{isAr ? "الاسم" : "Name"}</th>
              <th style={thStyle}>{isAr ? "الجوال" : "Phone"}</th>
              <th style={thStyle}>{isAr ? "نوع الخدمة" : "Service"}</th>
              <th style={thStyle}>{isAr ? "المدينة" : "City"}</th>
              <th style={thStyle}>{isAr ? "الحالة" : "Status"}</th>
              <th style={thStyle}>{isAr ? "التاريخ" : "Date"}</th>
              <th style={thStyle}>{isAr ? "إجراءات" : "Actions"}</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 16, textAlign: "center", color: "#666" }}>
                  {isAr ? "لا توجد نتائج" : "No results"}
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const id = String(r.id || "");
                const s = String(r.status || "pending").toLowerCase();
                const isBusy = Boolean(busyId && String(busyId) === id);

                return (
                  <tr key={id} style={{ borderTop: "1px solid #efefef" }}>
                    <td style={tdStyle}>{r.ref_code || "—"}</td>
                    <td style={tdStyle}>{r.name || "—"}</td>
                    <td style={{ ...tdStyle, direction: "ltr" }}>{r.phone || "—"}</td>
                    <td style={tdStyle}>{r.service_type || "—"}</td>
                    <td style={tdStyle}>{r.city || "—"}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(r.status)}>{statusLabel(locale, r.status)}</span>
                    </td>
                    <td style={tdStyle}>{fmtDate(locale, r.created_at)}</td>

                    <td style={tdStyle}>
                      {canAction ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            disabled={isBusy || s === "approved"}
                            onClick={() => onUpdateStatus?.(id, "approved")}
                            style={{
                              ...btnPrimary,
                              opacity: isBusy || s === "approved" ? 0.5 : 1,
                              cursor:
                                isBusy || s === "approved" ? "not-allowed" : "pointer",
                            }}
                            title={isBusy ? (isAr ? "جارٍ التحديث..." : "Updating...") : ""}
                          >
                            {isAr ? "قبول" : "Approve"}
                          </button>

                          <button
                            type="button"
                            disabled={isBusy || s === "rejected"}
                            onClick={() => onUpdateStatus?.(id, "rejected")}
                            style={{
                              ...btnBase,
                              opacity: isBusy || s === "rejected" ? 0.5 : 1,
                              cursor:
                                isBusy || s === "rejected" ? "not-allowed" : "pointer",
                            }}
                            title={isBusy ? (isAr ? "جارٍ التحديث..." : "Updating...") : ""}
                          >
                            {isAr ? "رفض" : "Reject"}
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
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
  textAlign: "right",
  padding: "12px 12px",
  fontSize: 12,
  fontWeight: 900,
  color: "#111",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  textAlign: "right",
  padding: "12px 12px",
  fontSize: 13,
  color: "#111",
  whiteSpace: "nowrap",
};

