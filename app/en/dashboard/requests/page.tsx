export const dynamic = "force-dynamic";

type RequestRow = {
  id: number;
  name: string;
  phone: string;
  service_type: string;
  city: string;
  status: string;
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.9)",
  padding: "20px",
  borderRadius: "12px",
  margin: "40px",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const th: React.CSSProperties = {
  border: "1px solid #000",
  padding: "8px",
  background: "#eee",
  textAlign: "center",
};

const td: React.CSSProperties = {
  border: "1px solid #000",
  padding: "8px",
  textAlign: "center",
};

export default async function RequestsPage() {
  let data: RequestRow[] = [];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/requests`,
      { cache: "no-store" }
    );
    const json = await res.json();
    data = json.data || [];
  } catch {
    data = [];
  }

  return (
    <div style={card}>
      <h2>Service Providers Requests</h2>

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
          {data.map((r) => (
            <tr key={r.id}>
              <td style={td}>{r.name}</td>
              <td style={td}>{r.phone}</td>
              <td style={td}>{r.service_type}</td>
              <td style={td}>{r.city}</td>
              <td style={td}>{r.status}</td>
              <td style={td}>—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
