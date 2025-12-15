import { createClient } from "@supabase/supabase-js";
import RequestsTable from "@/components/RequestsTable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string | null;
  phone: string | null;
  service_type: string | null;
  city: string | null;
  status: string | null;
  created_at: string | null;
};

export default async function RequestsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params?.locale === "en" ? "en" : "ar";
  const isAr = locale === "ar";

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={h1Style}>{isAr ? "طلبات مقدّمي الخدمة" : "Provider Requests"}</h1>
          <p style={mutedStyle}>
            {isAr
              ? "مشكلة إعدادات: متغيرات Supabase غير موجودة على السيرفر."
              : "Config error: Supabase env vars are missing on the server."}
          </p>
        </div>
      </main>
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("provider_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = ((data ?? []) as any[]).map((r) => ({
    id: String(r.id ?? ""),
    name: r.name ?? null,
    phone: r.phone ?? null,
    service_type: r.service_type ?? null,
    city: r.city ?? null,
    status: r.status ?? null,
    created_at: r.created_at ?? null,
  })) as Row[];

  return (
    <main style={pageStyle}>
      <div style={{ width: "100%", maxWidth: 1100 }}>
        <div style={headStyle}>
          <div>
            <h1 style={h1Style}>{isAr ? "طلبات مقدّمي الخدمة" : "Provider Requests"}</h1>
            <p style={mutedStyle}>
              {isAr ? "قبول / رفض الطلبات وتغيير الحالة." : "Approve/Reject requests and update status."}
            </p>
          </div>

          <a href={`/${locale}/provider-signup`} style={btnStyle}>
            {isAr ? "فتح صفحة التسجيل" : "Open Signup"}
          </a>
        </div>

        {error ? (
          <div style={cardStyle}>
            <h2 style={h2Style}>{isAr ? "خطأ" : "Error"}</h2>
            <pre style={preStyle}>{String(error.message || error)}</pre>
          </div>
        ) : (
          <RequestsTable locale={locale} rows={rows} />
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "24px 16px",
  background: "#f6f7f9",
  display: "flex",
  justifyContent: "center",
};

const headStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 12,
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e7e7",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
};

const h1Style: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 900,
  color: "#111",
};

const h2Style: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 16,
  fontWeight: 900,
  color: "#111",
};

const mutedStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#666",
  fontSize: 13,
  lineHeight: 1.6,
};

const btnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #111",
  textDecoration: "none",
  color: "#111",
  fontWeight: 900,
  fontSize: 13,
  background: "#fff",
  whiteSpace: "nowrap",
};

const preStyle: React.CSSProperties = {
  marginTop: 10,
  padding: 12,
  background: "#0b0b0b",
  color: "#eaeaea",
  borderRadius: 12,
  overflowX: "auto",
  fontSize: 12,
  lineHeight: 1.6,
};
