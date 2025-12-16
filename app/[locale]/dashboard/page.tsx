import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string | number;
  name: string | null;
  phone: string | null;
  service_type: string | null;
  city: string | null;
  status: string | null;
  created_at: string | null;
};

export default async function DashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params?.locale === "en" ? "en" : "ar";
  const isAr = locale === "ar";

  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  async function updateStatus(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim().toLowerCase();

    if (!id) return;
    if (!["approved", "rejected", "pending"].includes(status)) return;

    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    await sb.from("provider_requests").update({ status }).eq("id", id);

    revalidatePath(`/${locale}/dashboard`);
  }

  const { data } = await supabase
    .from("provider_requests")
    .select("id,name,phone,service_type,city,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Row[];

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1100, width: "100%" }}>
        <div style={headerRowStyle}>
          <div>
            <h1 style={titleStyle}>{isAr ? "لوحة الطلبات" : "Requests Dashboard"}</h1>
            <p style={mutedStyle}>
              {isAr
                ? "عرض آخر 200 طلب مع قبول/رفض."
                : "Showing latest 200 requests with approve/reject."}
            </p>
          </div>

          <a href={`/${locale}/provider-signup`} style={linkButtonStyle}>
            {isAr ? "فتح صفحة التسجيل" : "Open Signup"}
          </a>
        </div>

        <div style={cardStyle}>
          <div style={tableWrapStyle}>
            <table style={tableStyle} dir={isAr ? "rtl" : "ltr"}>
              <thead>
                <tr>
                  <Th>{isAr ? "الاسم" : "Name"}</Th>
                  <Th>{isAr ? "رقم الجوال" : "Phone"}</Th>
                  <Th>{isAr ? "نوع الخدمة" : "Service Type"}</Th>
                  <Th>{isAr ? "المدينة" : "City"}</Th>
                  <Th>{isAr ? "الحالة" : "Status"}</Th>
                  <Th>{isAr ? "الإجراء" : "Action"}</Th>
                  <Th>{isAr ? "التاريخ" : "Created"}</Th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td style={emptyCellStyle} colSpan={7}>
                      {isAr ? "لا يوجد طلبات." : "No requests."}
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => {
                    const id = String(r.id ?? idx);
                    const st = String((r.status ?? "pending")).trim().toLowerCase(); // ✅ NULL يعتبر pending
                    const isPending = st === "pending";

                    return (
                      <tr key={id} style={rowStyle}>
                        <Td>{safe(r.name)}</Td>
                        <Td>{safe(r.phone)}</Td>
                        <Td>{safe(r.service_type)}</Td>
                        <Td>{safe(r.city)}</Td>
                        <Td>
                          <span style={badgeStyle}>{st || "pending"}</span>
                        </Td>

                        <Td>
                          {isPending ? (
                            <div style={actionsStyle}>
                              <form action={updateStatus}>
                                <input type="hidden" name="id" value={id} />
                                <input type="hidden" name="status" value="approved" />
                                <button type="submit" style={okBtn}>
                                  {isAr ? "قبول" : "Approve"}
                                </button>
                              </form>

                              <form action={updateStatus}>
                                <input type="hidden" name="id" value={id} />
                                <input type="hidden" name="status" value="rejected" />
                                <button type="submit" style={noBtn}>
                                  {isAr ? "رفض" : "Reject"}
                                </button>
                              </form>
                            </div>
                          ) : (
                            <span style={mutedSmallStyle}>
                              {isAr ? "تمت المعالجة" : "Processed"}
                            </span>
                          )}
                        </Td>

                        <Td>{formatDate(r.created_at, locale)}</Td>
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

function Th({ children }: { children: React.ReactNode }) {
  return <th style={thStyle}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={tdStyle}>{children}</td>;
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
  fontWeight: 900,
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
  fontWeight: 900,
  fontSize: 13,
  background: "#fff",
  whiteSpace: "nowrap",
};

const tableWrapStyle: React.CSSProperties = { width: "100%", overflowX: "auto" };

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  minWidth: 980,
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

const rowStyle: React.CSSProperties = { background: "#fff" };

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

const mutedSmallStyle: React.CSSProperties = {
  color: "#666",
  fontSize: 12,
  fontWeight: 800,
};
