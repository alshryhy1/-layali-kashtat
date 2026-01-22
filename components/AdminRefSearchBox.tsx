"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  locale: "ar" | "en";
};

export default function AdminRefSearchBox({ locale }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const initial = sp.get("ref") ?? "";
  const [value, setValue] = React.useState(initial);

  React.useEffect(() => {
    setValue(initial);
  }, [initial]);

  const base = React.useMemo(() => {
    // تثبيت المسار الصحيح دائمًا
    return `/${locale}/admin/requests`;
  }, [locale]);

  const apply = React.useCallback(
    (next: string) => {
      const v = next.trim();

      if (!v) {
        router.replace(base);
        router.refresh(); // ✅ مهم جدًا لإرجاع البيانات كاملة بعد مسح البحث
        return;
      }

      const qs = new URLSearchParams();
      qs.set("ref", v);
      router.replace(`${base}?${qs.toString()}`);
      router.refresh(); // ✅ لضمان تحديث النتائج فورًا
    },
    [base, router]
  );

  return (
    <input
      value={value}
      onChange={(e) => {
        const next = e.target.value;
        setValue(next);

        // ✅ عند المسح: رجّع الصفحة فورًا
        if (next.trim() === "") {
          apply("");
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          apply(value);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setValue("");
          apply("");
        }
      }}
      placeholder={
        locale === "ar"
          ? "بحث بالرقم المرجعي فقط (مثال: LK-000045 أو 45)"
          : "Search by reference only (e.g., LK-000045 or 45)"
      }
      style={{
        width: 320,
        maxWidth: "75vw",
        padding: "10px 12px",
        borderRadius: 12,
        border: "2px solid #111",
        background: "#fff",
        fontWeight: 800,
        fontSize: 13,
        outline: "none",
      }}
      dir={locale === "ar" ? "rtl" : "ltr"}
    />
  );
}
