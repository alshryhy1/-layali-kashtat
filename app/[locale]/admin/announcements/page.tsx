import { revalidatePath } from "next/cache";
import {
  AdminPageShell,
  AdminEmptyState,
} from "@/components/AdminPageShell";
import { requireAdminLocale } from "@/lib/admin-auth-page";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);

  async function addAnnouncement(formData: FormData) {
    "use server";
    const text = String(formData.get("text") || "").trim();
    if (!text) return;
    await db.query(`
      CREATE TABLE IF NOT EXISTS banner_announcements (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query("INSERT INTO banner_announcements (text, active) VALUES ($1, true)", [text]);
    revalidatePath("/admin/announcements");
    revalidatePath("/ar/admin/announcements");
    revalidatePath("/en/admin/announcements");
    revalidatePath("/admin/portal");
  }

  async function deleteAnnouncement(formData: FormData) {
    "use server";
    const id = Number(formData.get("id") || 0);
    if (!id) return;
    await db.query("DELETE FROM banner_announcements WHERE id = $1", [id]);
    revalidatePath("/admin/announcements");
    revalidatePath("/ar/admin/announcements");
    revalidatePath("/en/admin/announcements");
  }

  let announcements: Array<{ id: number; text: string; active: boolean; created_at: string }> = [];
  try {
    const a2 = await db.query(
      "SELECT id, text, active, created_at FROM banner_announcements ORDER BY created_at DESC"
    );
    announcements = a2.rows || [];
  } catch {}

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "الإشعارات / إعلانات البنر" : "Announcements"}
      subtitle={
        isAr
          ? "إدارة نص البنر العلوي في الموقع (نفس API /api/admin/announcements)"
          : "Manage the site top banner (same /api/admin/announcements API)"
      }
    >
      <div style={{ padding: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, maxWidth: 640 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>
          {isAr ? "إضافة إعلان" : "Add announcement"}
        </h2>
        <form action={addAnnouncement}>
          <div style={{ display: "grid", gap: 10 }}>
            <input
              name="text"
              placeholder={isAr ? "نص الإعلان" : "Announcement text"}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e2e8f0" }}
            />
            <button
              type="submit"
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #111",
                background: "#111",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {isAr ? "إضافة" : "Add"}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
            {isAr ? "النصوص الحالية" : "Current items"}
          </h3>
          {announcements.length === 0 ? (
            <AdminEmptyState isAr={isAr} />
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {announcements.map((a) => (
                <li
                  key={a.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    gap: 10,
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{a.text}</span>
                  <form action={deleteAnnouncement}>
                    <input type="hidden" name="id" value={String(a.id)} />
                    <button
                      type="submit"
                      style={{
                        padding: "6px 10px",
                        borderRadius: 10,
                        border: "1px solid #ef4444",
                        background: "#ef4444",
                        color: "#fff",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      {isAr ? "حذف" : "Delete"}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
}
