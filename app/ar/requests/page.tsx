"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  name: string | null;
  phone: string | null;
  service_type: string | null;
  city: string | null;
  status: string | null;
  created_at: string | null;
};

export default function RequestsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/provider-requests", { cache: "no-store" });
      const j = await res.json().catch(() => null);

      if (!res.ok || !j?.ok) {
        throw new Error(j?.error || `Failed (${res.status})`);
      }
      setRows((j.data ?? []) as Row[]);
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    setErr(null);
    try {
      const res = await fetch("/api/provider-requests/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error || `Update failed (${res.status})`);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Update error");
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main style={pageStyle} dir="rtl">
      <div style={{ maxWidth: 1100, width: "100%" }}>
        <h1 style={h1}>لوحة الطلبات</h1>
        <div style={sub}>
          {loading ? "جاري التحميل..." : `عرض ${rows.length} طلب`}
        </div>

        {err ? <div style={errBox}>{err}</div> : null}

        <div style={card}>
          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>الاسم</th>
                  <th style={th}>رقم الجوال</th>
                  <th style={th}>نوع الخدمة</th>
                  <th style={th}>المدينة</th>
                  <th style={th}>الحالة</th>
                  <th style={th}>قبول / رفض</th>
                  <th style={th}>التاريخ</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={7} style={empty}>
                      لا يوجد طلبات
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const st = (r.status ?? "pending").toLowerCase();
                    const pending = st === "pending";
                    const busy = busyId === r.id;

                    return (
                      <tr key={r.id}>
                        <td style={td}>{r.name ?? ""}</td>
                        <td style={td}>{r.phone ?? ""}</td>
                        <td style={td}>{r.service_type ?? ""}</td>
                        <td style={td}>{r.city ?? ""}</td>
                        <td style={td}>
                          <span style={badge}>{st}</span>
                        </td>
                        <td style={td}>
                          {pending ? (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button
                                style={okBtn}
                                disabled={busy}
                                onClick={() => setStatus(r.id, "approved")}
                              >
                                {busy ? "..." : "قبول"}
                              </button>
                              <button
                                style={noBtn}
                                disabled={busy}
                                onClick={() => setStatus(r.id, "rejected")}
                              >
                                {busy ? "..." : "رفض"}
                              </button>
                            </div>
                          ) : (
                            <span style={done}>تمت المعالجة</span>
                          )}
                        </td>
                        <td style={td}>{fmt(r.created_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function fmt(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleString("ar-SA");
  } catch {
    return d.toISOString();
  }
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: 24,
  background: "#f6f7f9",
  display: "flex",
  justifyContent: "center",
};

const h1: React.CSSProperties = { margin: 0, fontSize: 22, fontWeight: 900 };
const sub: React.CSSProperties = { marginTop: 6, color: "#666", fontSize: 13 };

const errBox: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  borderRadius: 10,
  background: "#fff3f3",
  border: "1px solid #ffd0d0",
  color: "#b00",
  fontSize: 13,
};

const card: React.CSSProperties = {
  marginTop: 12,
  background: "#fff",
  border: "1px solid #e7e7e7",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
};

const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", minWidth: 980 };

const th: React.CSSProperties = {
  textAlign: "right",
  padding: 10,
  borderBottom: "1px solid #ddd",
  background: "#fafafa",
  fontWeight: 900,
  fontSize: 13,
};

const td: React.CSSProperties = {
  padding: 10,
  borderBottom: "1px solid #eee",
  fontSize: 13,
  verticalAlign: "top",
};

const empty: React.CSSProperties = { padding: 14, textAlign: "center", color: "#666" };

const badge: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #e7e7e7",
  fontWeight: 900,
  fontSize: 12,
};

const okBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #0a0",
  background: "#0a0",
  color: "#fff",
  fontWeight: 900,
  fontSize: 12,
  cursor: "pointer",
};

const noBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #b00",
  background: "#fff",
  color: "#b00",
  fontWeight: 900,
  fontSize: 12,
  cursor: "pointer",
};

const done: React.CSSProperties = { color: "#666", fontWeight: 800, fontSize: 12 };
