"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  name: string | null;
  phone: string | null;
  service_type: string | null;
  city: string | null;
  status: string | null;
};

export default function RequestsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/provider-requests/list")
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []));
  }, []);

  async function setStatus(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    await fetch("/api/provider-requests/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    setBusyId(null);
  }

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1100, width: "100%" }}>
        <h1 style={h1}>Provider Requests</h1>

        <div style={card}>
          <table style={table} dir="ltr">
            <thead>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>Phone</th>
                <th style={th}>Service Type</th>
                <th style={th}>City</th>
                <th style={th}>Status</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{r.phone}</td>
                  <td style={td}>{r.service_type}</td>
                  <td style={td}>{r.city}</td>
                  <td style={td}>{r.status}</td>
                  <td style={td}>
                    {r.status === "pending" ? (
                      <>
                        <button
                          style={okBtn}
                          disabled={busyId === r.id}
                          onClick={() => setStatus(r.id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          style={noBtn}
                          disabled={busyId === r.id}
                          onClick={() => setStatus(r.id, "rejected")}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      "Done"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: 24,
  background: "#f6f7f9",
  display: "flex",
  justifyContent: "center",
};

const h1: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  marginBottom: 16,
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e7e7",
  borderRadius: 14,
  padding: 16,
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid #ddd",
  fontWeight: 800,
};

const td: React.CSSProperties = {
  padding: 10,
  borderBottom: "1px solid #eee",
};

const okBtn: React.CSSProperties = {
  padding: "6px 10px",
  marginRight: 6,
  borderRadius: 8,
  border: "1px solid #0a0",
  background: "#0a0",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const noBtn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #b00",
  background: "#fff",
  color: "#b00",
  fontWeight: 800,
  cursor: "pointer",
};
