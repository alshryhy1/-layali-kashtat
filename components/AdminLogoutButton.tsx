"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

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
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #111",
        background: "#111",
        color: "#fff",
        fontWeight: 900,
        fontSize: 13,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.75 : 1,
        whiteSpace: "nowrap",
      }}
    >
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
