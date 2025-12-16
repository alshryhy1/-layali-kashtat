import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

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

export default async function DashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params?.locale === "en" ? "en" : "ar";
  const isAr = locale === "ar";

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  async function updateStatus(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    const status = String(formData.get("status"));

    await supabase
      .from("provider_requests")
      .update({ status })
      .eq("id", id);

    revalidatePath(`/${locale}/dashboard`);
  }

  const { data } = await supabase
    .from("provider_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  return (
    <main style={{ padding: 24 }}>
      <h1>{isAr ? "لوحة الطلبات" : "Requests Dashboard"}</h1>

      <table dir={isAr ? "rtl" : "ltr"} style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>{isAr ? "الاسم" : "Name"}</th>
            <th>{isAr ? "الجوال" : "Phone"}</th>
            <th>{isAr ? "نوع الخدمة" : "Service"}</th>
            <th>{isAr ? "المدينة" : "City"}</th>
            <th>{isAr ? "الحالة" : "Status"}</th>
            <th>{isAr ? "الإجراء" : "Action"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const status = r.status ?? "pending"; // 🔑 الحل هنا

            return (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.phone}</td>
                <td>{r.service_type}</td>
                <td>{r.city}</td>
                <td>{status}</td>
                <td>
                  {status === "pending" ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <form action={updateStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button>قبول</button>
                      </form>
                      <form action={updateStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button>رفض</button>
                      </form>
                    </div>
                  ) : (
                    "تم"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
