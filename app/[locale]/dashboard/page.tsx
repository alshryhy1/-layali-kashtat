// app/[locale]/dashboard/page.tsx
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProviderRequestRow = {
  id?: string | number;
  name?: string | null;
  phone?: string | null;
  service_type?: string | null;
  city?: string | null;
  category?: string | null;
  notes?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export default async function DashboardPage({
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
        <Card>
          <h1 style={titleStyle}>{isAr ? "لوحة الطلبات" : "Requests Dashboard"}</h1>
          <p style={mutedStyle}>
            {isAr
              ? "مشكلة إعدادات: متغيرات Supabase غير موجودة على السيرفر."
              : "Config error: Supabase env vars are missing on the server."}
          </p>
          <pre style={preStyle}>
            Missing env: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
          </pre>
        </Card>
      </main>
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("provider_requests")
    .select("*")
    .limit(200);

  const rows = (data ?? []) as ProviderRequestRow[];

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1100, width: "100%" }}>
        <div style={headerRowStyle}>
          <div>
            <h1 style={titleStyle}>{isAr ? "لوحة الطلبات" : "Requests Dashboard"}</h1>
            <p style={mutedStyle}>
              {isAr
                ? "عرض آخر 200 طلب من جدول provider_requests."
                : "Showing the latest 200 rows from provider_requests."}
            </p>
          </div>

          <a
            href={`/${locale}/provider-signup`}
            style={linkButtonStyle}
          >
            {isAr ? "فتح صفحة التسجيل" : "Open Signup Page"}
          </a>
        </div>

        {error ? (
          <Card>
            <h2 style={sectionTitleStyle}>{isAr ? "خطأ" : "Error"}</h2>
            <p style={mutedStyle}>
              {isAr
                ? "فشل جلب الطلبات من Supabase."
                : "Failed to fetch requests from Supabase."}
            </p>
            <pre style={preStyle}>{String(error.message || error)}</pre>
          </Card>
        ) : (
          <Card>
            <div style={tableWrapStyle}>
              <table style={tableStyle} dir={isAr ? "rtl" : "ltr"}>
                <thead>
                  <tr>
                    <Th>{isAr ? "الاسم" : "Name"}</Th>
                    <Th>{isAr ? "رقم الجوال" : "Phone"}</Th>
                    <Th>{isAr ? "نوع الخدمة" : "Service Type"}</Th>
                    <Th>{isAr ? "المدينة" : "City"}</Th>
                    <Th>{isAr ? "الحالة" : "Status"}</Th>
                    <Th>{isAr ? "التاريخ" : "Created"}</Th>
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td style={emptyCellStyle} colSpan={6}>
                        {isAr ? "لا يوجد طلبات حتى الآن." : "No requests yet."}
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr key={String(r.id ?? idx)} style={rowStyle}>
                        <Td>{safe(r.name)}</Td>
                        <Td>{safe(r.phone)}</Td>
                        <Td>{safe(r.service_type)}</Td>
                        <Td>{safe(r.city)}</Td>
                        <Td>
                          <Badge text={safe(r.status) || (isAr ? "—" : "—")} />
                        </Td>
                        <Td>{formatDate(r.created_at, locale)}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

function safe(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function formatDate(v: string | null | undefined, locale: "ar" | "en") {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
  } catch {
    return d.toISOString();
  }
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={cardStyle}>
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={thStyle}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={tdStyle}>{children}</td>;
}

function Badge({ text }: { text: string }) {
  const t = text?.trim() || "—";
  return (
    <span style={badgeStyle}>
      {t}
    </span>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "24px 16px",
  background: "#f6f7f9",
  display: "flex",
  justifyContent: "center",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: 12,
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e7e7",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  color: "#111",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 16,
  fontWeight: 800,
  color: "#111",
};

const mutedStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#666",
  fontSize: 13,
  lineHeight: 1.6,
};

const linkButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #111",
  textDecoration: "none",
  color: "#111",
  fontWeight: 800,
  fontSize: 13,
  background: "#fff",
  whiteSpace: "nowrap",
};

const tableWrapStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  minWidth: 820,
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

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #e7e7e7",
  background: "#fff",
  fontSize: 12,
  fontWeight: 800,
};
