"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  name: string | null;
  phone: string | null;
  service_type: string | null;
  city: string | null;
  status: string | null;
  created_at: string | null;
};

export default function RequestsTable({
  locale,
  rows,
}: {
  locale: "ar" | "en";
  rows: Row[];
}) {
  const isAr = locale === "ar";
  const router = useRouter();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const dir = isAr ? "rtl" : "ltr";

  const normalized = useMemo(() => {
    return (rows || []).filter((r) => r.id && r.id.trim().length > 0);
  }, [rows]);

  async function setStatus(id: string, status: "approved" | "rejected") {
    try {
      setError("");
      setBusyId(id);

      const res = await fetch("/api/provider-requests/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          data?.error ||
          (isAr ? "فشل تحديث الحالة." : "Failed to update status.");
        setError(msg);
        return;
      }

      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={cardStyle}>
      {error ? (
        <div style={errorBoxStyle} dir={dir}>
          {error}
        </div>
      ) : null}

      <div style={tableWrapStyle}>
        <table style={tableStyle} dir={dir}>
          <thead>
            <tr>
              <Th>{isAr ? "الاسم" : "Name"}</Th>
              <Th>{isAr ? "الجوال" : "Phone"}</Th>
              <Th>{isAr ? "نوع الخدمة" : "Service Type"}</Th>
              <Th>{isAr ? "المدينة" : "City"}</Th>
              <Th>{isAr ? "الحالة" : "Status"}</Th>
              <Th>{isAr ? "التحكم" : "Actions"}</Th>
            </tr>
          </thead>

          <tbody>
            {normalized.length === 0 ? (
              <tr>
                <td style={emptyCellStyle} colSpan={6}>
                  {isAr ? "لا يوجد طلبات." : "No requests."}
                </td>
              </tr>
            ) : (
              normalized.map((r) => {
                const s = (r.status || "pending").toLowerCase();
                const isPending = s === "pending" || s === "" || s === "null";
                const busy = busyId === r.id;

                return (
                  <tr key={r.id} style={rowStyle}>
                    <Td>{safe(r.name)}</Td>
                    <Td>{safe(r.phone)}</Td>
                    <Td>{safe(r.service_type)}</Td>
                    <Td>{safe(r.city)}</Td>
                    <Td>
                      <Badge text={safe(r.status) || (isAr ? "pending" : "pending")} />
                    </Td>
                    <Td>
                      {isPending ? (
                        <div style={actionsStyle}>
                          <button
                            style={primaryBtnStyle(busy)}
                            disabled={busy}
                            onClick={() => setStatus(r.id, "approved")}
                          >
                            {busy ? (isAr ? "..." : "...") : isAr ? "قبول" : "Approve"}
                          </button>
                          <button
                            style={dangerBtnStyle(busy)}
                            disabled={busy}
                            onClick={() => setStatus(r.id, "rejected")}
                          >
                            {busy ? (isAr ? "..." : "...") : isAr ? "رفض" : "Reject"}
                          </button>
                        </div>
                      ) : (
                        <span style={mutedSmallStyle}>
                          {isAr ? "تمت المعالجة" : "Processed"}
                        </span>
                      )}
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p style={hintStyle} dir={dir}>
        {isAr
          ? "ملاحظة: الأزرار تظهر فقط للحالة pending."
          : "Note: buttons show only for pending status."}
      </p>
    </div>
  );
}

function safe(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={thStyle}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={tdStyle}>{children}</td>;
}

function Badge({ text }: { text: string }) {
  const t = text?.trim() || "—";
  return <span style={badgeStyle}>{t}</span>;
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e7e7",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
};

const errorBoxStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ffd2d2",
  background: "#fff5f5",
  color: "#8a1f1f",
  fontWeight: 900,
  marginBottom: 10,
  fontSize: 13,
};

const tableWrapStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  minWidth: 860,
};

const thStyle: React.CSSProperties = {
  textAlign: "start",
  fontSize: 13,
  color: "#222",
  padding: "12px 10px",
  borderBottom: "1px solid #e7e7e7",
  background: "#fafafa",
  position: "sticky",
  top: 0,
};

const tdStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#111",
  padding: "12px 10px",
  borderBottom: "1px solid #f0f0f0",
  verticalAlign: "top",
};

const rowStyle: React.CSSProperties = {
  background: "#fff",
};

const emptyCellStyle: React.CSSProperties = {
  padding: 14,
  color: "#666",
  fontSize: 13,
  textAlign: "center",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #e7e7e7",
  background: "#fff",
  fontSize: 12,
  fontWeight: 900,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const mutedSmallStyle: React.CSSProperties = {
  color: "#666",
  fontSize: 12,
  fontWeight: 800,
};

const hintStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#666",
  fontSize: 12,
};

const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #111",
  background: disabled ? "#eee" : "#111",
  color: disabled ? "#666" : "#fff",
  fontWeight: 900,
  fontSize: 12,
  cursor: disabled ? "not-allowed" : "pointer",
});

const dangerBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #b00020",
  background: disabled ? "#eee" : "#fff",
  color: disabled ? "#666" : "#b00020",
  fontWeight: 900,
  fontSize: 12,
  cursor: disabled ? "not-allowed" : "pointer",
});
