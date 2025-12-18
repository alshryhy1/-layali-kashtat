import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const cookieStore = cookies();
  const admin = cookieStore.get("admin_auth")?.value;

  if (!admin || admin !== process.env.ADMIN_PASSWORD) {
    redirect("/admin");
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: requests } = await supabase
    .from("provider_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const card: React.CSSProperties = {
    padding: "20px",
    background: "rgba(255,255,255,0.9)",
    borderRadius: "12px",
    marginTop: "20px",
  };

  const table: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse" as const,
  };

  const th: React.CSSProperties = {
    border: "1px solid #000",
    padding: "8px",
    background: "#eee",
  };

  const td: React.CSSProperties = {
    border: "1px solid #000",
    padding: "8px",
  };

  return (
    <div style={card}>
      <h2>طلبات مقدمي الخدمات</h2>

      <table style={table} dir="rtl">
        <thead>
          <tr>
            <th style={th}>الاسم</th>
            <th style={th}>الجوال</th>
            <th style={th}>نوع الخدمة</th>
            <th style={th}>المدينة</th>
            <th style={th}>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {requests?.map((r) => (
            <tr key={r.id}>
              <td style={td}>{r.name}</td>
              <td style={td}>{r.phone}</td>
              <td style={td}>{r.service_type}</td>
              <td style={td}>{r.city}</td>
              <td style={td}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
