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

function sbAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function AdminRequestsPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale === "en" ? "en" : "ar";
  const supabase = sbAdmin();

  async function updateStatus(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim().toLowerCase();
    if (!id) return;
    if (!["approved", "rejected", "pending"].includes(status)) return;
    const admin = sbAdmin();
    await admin.from("provider_requests").update({ status }).eq("id", id);
    revalidatePath(`/${locale}/admin/requests`);
  }

  const { data } = await supabase
    .from("provider_requests")
    .select("id,name,phone,service_type,city,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Row[];

  return (
    <main>
      <div style={{ background: "#111", color: "#fff", padding: 12, borderRadius: 12 }}>
        ADMIN-REQUESTS OK
      </div>
      <pre>{JSON.stringify(rows, null, 2)}</pre>
    </main>
  );
}
