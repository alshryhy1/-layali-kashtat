import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Dashboard({ params }: { params: { locale: string } }) {
  const locale = params.locale === "en" ? "en" : "ar";
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
    await supabase.from("provider_requests").update({ status }).eq("id", id);
    revalidatePath(`/${locale}/dashboard`);
  }

  const { data } = await supabase
    .from("provider_requests")
    .select("id,name,phone,service_type,city,status")
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: 24 }}>
      <h1>{isAr ? "لوحة الطلبات" : "Requests"}</h1>

      <table dir={isAr ? "rtl" : "ltr"} border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>{isAr ? "الاسم" : "Name"}</th>
            <th>{isAr ? "الجوال" : "Phone"}</th>
            <th>{isAr ? "الخدمة" : "Service"}</th>
            <th>{isAr ? "المدينة" : "City"}</th>
            <th>{isAr ? "الحالة" : "Status"}</th>
            <th>{isAr ? "إجراء" : "Action"}</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((r: any) => {
            const status = r.status ?? "pending";
            return (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.phone}</td>
                <td>{r.service_type}</td>
                <td>{r.city}</td>
                <td>{status}</td>
                <td>
                  {status === "pending" ? (
                    <>
                      <form action={updateStatus} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button>قبول</button>
                      </form>
                      <form action={updateStatus} style={{ display: "inline", marginLeft: 8 }}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button>رفض</button>
                      </form>
                    </>
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
