"use client";

import * as React from "react";
import RequestsTable, { Row } from "./RequestsTable";

type Locale = "ar" | "en";
type Status = "pending" | "approved" | "rejected";

export default function AdminRequestsClient({
  locale,
  rows,
}: {
  locale: Locale;
  rows: Row[];
}) {
  const isAr = locale === "ar";

  // نسخة محلية من الصفوف للتحديث الفوري بعد قبول/رفض
  const [items, setItems] = React.useState<Row[]>(rows);
  const [q, setQ] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [flash, setFlash] = React.useState<string>("");

  React.useEffect(() => {
    setItems(rows);
  }, [rows]);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;

    // البحث بالرقم المرجعي فقط
    return items.filter((r) => (r.ref_code || "").toLowerCase().includes(s));
  }, [q, items]);

  const updateStatus = React.useCallback(
    async (id: string, status: Status) => {
      if (!id) return;

      setBusyId(String(id));
      setFlash("");

      try {
        const res = await fetch("/api/admin/requests/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.ok) {
          const msg =
            (json?.message as string) ||
            (json?.error as string) ||
            `HTTP ${res.status}`;
          throw new Error(msg);
        }

        // تحديث محلي فوري
        setItems((prev) =>
          prev.map((r) =>
            String(r.id) === String(id) ? { ...r, status } : r
          )
        );

        setFlash(
          isAr
            ? status === "approved"
              ? "تم قبول الطلب ✅"
              : status === "rejected"
              ? "تم رفض الطلب ❌"
              : "تم تحديث الحالة"
            : status === "approved"
            ? "Request approved ✅"
            : status === "rejected"
            ? "Request rejected ❌"
            : "Status updated"
        );

        window.setTimeout(() => setFlash(""), 2000);
      } catch (e: any) {
        setFlash(
          isAr
            ? `تعذر تحديث الحالة: ${e?.message || "خطأ"}`
            : `Failed to update: ${e?.message || "Error"}`
        );
        window.setTimeout(() => setFlash(""), 3000);
      } finally {
        setBusyId(null);
      }
    },
    [isAr]
  );

  const btnBase: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const btnApprove: React.CSSProperties = {
    ...btnBase,
    border: "1px solid #0a0",
    background: "#0a0",
    color: "#fff",
  };

  const btnReject: React.CSSProperties = {
    ...btnBase,
    border: "1px solid #b00",
    background: "#fff",
    color: "#b00",
  };

  const btnPending: React.CSSProperties = {
    ...btnBase,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
  };

  const btnDisabled: React.CSSProperties = {
    opacity: 0.55,
    cursor: "not-allowed",
  };

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={isAr ? "بحث برقم الطلب" : "Search by request number"}
          style={{
            width: "100%",
            maxWidth: 360,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ccc",
            fontSize: 13,
          }}
        />

        {flash ? (
          <div
            style={{
              fontSize: 13,
              fontWeight: 900,
              color:
                flash.includes("تعذر") || flash.includes("Failed")
                  ? "#b00020"
                  : "#111",
              background: "#fff",
              border: "1px solid #e7e7e7",
              borderRadius: 10,
              padding: "8px 10px",
            }}
          >
            {flash}
          </div>
        ) : null}
      </div>

      <RequestsTable
        locale={locale}
        rows={filtered}
        renderActions={(row) => {
          const id = String(row.id || "");
          const isBusy = busyId !== null && String(busyId) === id;

          const mkDisabled = (disabled: boolean) =>
            disabled ? btnDisabled : null;

          return (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => updateStatus(id, "approved")}
                disabled={isBusy}
                style={{ ...btnApprove, ...(mkDisabled(isBusy) as any) }}
              >
                {isBusy ? (isAr ? "..." : "...") : isAr ? "قبول" : "Approve"}
              </button>

              <button
                type="button"
                onClick={() => updateStatus(id, "rejected")}
                disabled={isBusy}
                style={{ ...btnReject, ...(mkDisabled(isBusy) as any) }}
              >
                {isBusy ? (isAr ? "..." : "...") : isAr ? "رفض" : "Reject"}
              </button>

              <button
                type="button"
                onClick={() => updateStatus(id, "pending")}
                disabled={isBusy}
                style={{ ...btnPending, ...(mkDisabled(isBusy) as any) }}
              >
                {isBusy ? (isAr ? "..." : "...") : isAr ? "انتظار" : "Pending"}
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}
