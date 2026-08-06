import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import {
  AdminPageShell,
  AdminEmptyState,
} from "@/components/AdminPageShell";
import { requireAdminLocale } from "@/lib/admin-auth-page";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);

  async function addAdmin(formData: FormData) {
    "use server";
    const username = String(formData.get("username") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "").trim();
    if (!username || !password) return;
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO admins (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING",
      [username, hash]
    );
    revalidatePath("/admin/settings");
    revalidatePath("/ar/admin/settings");
    revalidatePath("/en/admin/settings");
  }

  let admins: Array<{ id: number; username: string; created_at: string }> = [];
  try {
    const a1 = await db.query("SELECT id, username, created_at FROM admins ORDER BY created_at DESC");
    admins = a1.rows || [];
  } catch {}

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "إعدادات الموقع" : "Site settings"}
      subtitle={
        isAr
          ? "إدارة مشرفي kashtat_admin (نفس /api/admin/users)"
          : "Manage kashtat_admin users (same /api/admin/users)"
      }
    >
      <div style={{ padding: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, maxWidth: 560 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>
          {isAr ? "إضافة مشرف" : "Add admin"}
        </h2>
        <form action={addAdmin}>
          <div style={{ display: "grid", gap: 10 }}>
            <input
              name="username"
              placeholder={isAr ? "اسم المستخدم" : "Username"}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e2e8f0" }}
            />
            <input
              name="password"
              type="password"
              placeholder={isAr ? "كلمة المرور" : "Password"}
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
            {isAr ? "قائمة المشرفين" : "Admins list"}
          </h3>
          {admins.length === 0 ? (
            <AdminEmptyState isAr={isAr} />
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {admins.map((a) => (
                <li
                  key={a.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{a.username}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    {a.created_at ? new Date(a.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US") : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
}
