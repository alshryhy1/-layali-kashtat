"use client";

import React, { useTransition } from "react";

type Props = {
  id: string;
  status?: string | null;
};

export default function DashboardRequestActions({ id, status }: Props) {
  const [pending, startTransition] = useTransition();

  const canAct = !status || status === "pending";

  async function setStatus(next: "approved" | "rejected") {
    startTransition(async () => {
      const res = await fetch("/api/provider-requests/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        alert(data?.error || "تعذر تحديث الحالة");
        return;
      }

      // تحديث سريع بدون تعقيد
      window.location.reload();
    });
  }

  if (!canAct) {
    return (
      <span style={{ fontSize: 12, opacity: 0.8 }}>
        {status === "approved" ? "تم القبول" : status === "rejected" ? "مرفوض" : status}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      <button
        disabled={pending}
        onClick={() => setStatus("approved")}
        style={{
          padding: "6px 10px",
          borderRadius: 10,
          border: "1px solid #16a34a",
          background: "white",
          cursor: pending ? "not-allowed" : "pointer",
          fontWeight: 700,
        }}
      >
        قبول
      </button>

      <button
        disabled={pending}
        onClick={() => setStatus("rejected")}
        style={{
          padding: "6px 10px",
          borderRadius: 10,
          border: "1px solid #dc2626",
          background: "white",
          cursor: pending ? "not-allowed" : "pointer",
          fontWeight: 700,
        }}
      >
        رفض
      </button>
    </div>
  );
}
