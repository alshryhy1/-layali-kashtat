"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

type Props = {
  locale: "ar" | "en";
};

export default function AdminLogoutButton({ locale }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/admin/logout", {
        method: "POST",
        headers: { "cache-control": "no-store" },
        cache: "no-store",
      });

      // حتى لو رجع 200/غيره: المطلوب خروج + توجيه صريح للدخول
      if (!res.ok) {
        // لا نعرض أخطاء للمستخدم هنا — فقط نضمن التوجيه للدخول
      }

      // ✅ Redirect نهائي وصريح إلى صفحة الدخول
      router.replace(`/${locale}/admin/login`);
      router.refresh();
    } catch {
      // ✅ حتى مع أي خطأ شبكي: نوجّه لصفحة الدخول
      router.replace(`/${locale}/admin/login`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="p-2 transition flex items-center gap-2 px-3"
      style={{
        height: "42px",
        minWidth: "140px",
        justifyContent: "center",
        padding: "0 16px",
        borderRadius: "8px",
        border: "1px solid #000",
        background: "#ef4444",
        color: "#fff",
        fontWeight: "bold",
        fontSize: 13,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.75 : 1,
        whiteSpace: "nowrap",
      }}
    >
      <LogOut size={18} />
      {loading
        ? locale === "ar"
          ? "جاري تسجيل الخروج..."
          : "Logging out..."
        : locale === "ar"
        ? "تسجيل خروج"
        : "Logout"}
    </button>
  );
}
