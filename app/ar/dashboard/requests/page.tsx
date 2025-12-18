"use client";

import { useEffect, useState } from "react";

type Req = {
  id: number;
  name: string;
  phone: string;
  service_type: string;
  city: string;
  status: "pending" | "approved" | "rejected";
};

export default function RequestsPage() {
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/requests");
    const data = await res.json();
    setItems(data || []);
    setLoading(false);
  }

  async function setStatus(id: number, status: "approved" | "rejected") {
    await fetch("/api/provider-request/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p style={{ padding: 20 }}>تحميل...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>طلبات مقدمي الخدمات</h1>

      <table width="100%" border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الجوال</th>
            <th>نوع الخدمة</th>
            <th>المدينة</th>
            <th>الحالة</th>
            <th>الإجراء</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.phone}</td>
              <td>{r.service_type}</td>
              <td>{r.city}</td>
              <td>{r.status}</td>
              <td>
                {r.status === "pending" ? (
                  <>
                    <button onClick={() => setStatus(r.id, "approved")}>
                      قبول
                    </button>{" "}
                    <button onClick={() => setStatus(r.id, "rejected")}>
                      رفض
                    </button>
                  </>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
