import { revalidatePath } from "next/cache";
import {
  AdminPageShell,
  AdminEmptyState,
  adminTableStyle,
  adminThStyle,
  adminTdStyle,
} from "@/components/AdminPageShell";
import { requireAdminLocale, fmtAdminDate } from "@/lib/admin-auth-page";
import { safeRows } from "@/lib/admin-portal-data";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string | null;
  moderation_status: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

export default async function AdminModerationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);

  const rows = await safeRows<Row>(
    `SELECT id::text AS id, title, moderation_status, is_active, created_at::text AS created_at
     FROM provider_services
     WHERE lower(COALESCE(moderation_status, 'pending')) IN ('pending','new','review','awaiting')
        OR moderation_status IS NULL
     ORDER BY created_at DESC NULLS LAST
     LIMIT 100`
  );

  async function setModeration(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim();
    if (!id || !["approved", "rejected", "pending"].includes(status)) return;
    try {
      await db.query(
        `UPDATE provider_services
         SET moderation_status = $2,
             is_active = CASE WHEN $2 = 'approved' THEN true ELSE is_active END
         WHERE id::text = $1`,
        [id, status]
      );
    } catch (e) {
      console.error("moderation update failed:", e);
    }
    revalidatePath("/admin/moderation");
    revalidatePath("/ar/admin/moderation");
    revalidatePath("/en/admin/moderation");
    revalidatePath("/admin/portal");
    revalidatePath("/ar/admin/portal");
    revalidatePath("/en/admin/portal");
  }

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "مراجعة الخدمات قبل النشر" : "Service moderation"}
      subtitle={
        isAr
          ? "اعتماد أو رفض الخدمات قبل ظهورها للمستخدمين"
          : "Approve or reject services before they appear to users"
      }
    >
      {rows.length === 0 ? (
        <AdminEmptyState isAr={isAr} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "العنوان" : "Title"}</th>
                <th style={adminThStyle}>{isAr ? "الحالة" : "Status"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
                <th style={adminThStyle}>{isAr ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={adminTdStyle}>{r.title || r.id}</td>
                  <td style={adminTdStyle}>{r.moderation_status || "pending"}</td>
                  <td style={adminTdStyle}>{fmtAdminDate(locale, r.created_at)}</td>
                  <td style={adminTdStyle}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <form action={setModeration}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button
                          type="submit"
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid #166534",
                            background: "#166534",
                            color: "#fff",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          {isAr ? "اعتماد" : "Approve"}
                        </button>
                      </form>
                      <form action={setModeration}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button
                          type="submit"
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid #b91c1c",
                            background: "#b91c1c",
                            color: "#fff",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          {isAr ? "رفض" : "Reject"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageShell>
  );
}
