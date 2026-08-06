import {
  AdminPageShell,
  AdminStubBanner,
  adminCardStyle,
} from "@/components/AdminPageShell";
import { requireAdminLocale } from "@/lib/admin-auth-page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CITIES = [
  { nameAr: "مكة", nameEn: "Makkah" },
  { nameAr: "المدينة", nameEn: "Madinah" },
  { nameAr: "الرياض", nameEn: "Riyadh" },
  { nameAr: "القصيم", nameEn: "Qassim" },
  { nameAr: "حائل", nameEn: "Hail" },
  { nameAr: "الحدود الشمالية", nameEn: "Northern Borders" },
  { nameAr: "الجوف", nameEn: "Al Jouf" },
  { nameAr: "تبوك", nameEn: "Tabuk" },
  { nameAr: "جدة", nameEn: "Jeddah" },
  { nameAr: "نجران", nameEn: "Najran" },
  { nameAr: "عسير", nameEn: "Asir" },
];

export default async function AdminWeatherPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, isAr } = await requireAdminLocale(params);

  const samples: Array<{ city: string; text: string }> = [];
  for (const c of CITIES.slice(0, 4)) {
    try {
      const q = encodeURIComponent(c.nameEn);
      const base = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000";
      const res = await fetch(`${base}/api/weather?lang=${locale}&city=${q}`, {
        cache: "no-store",
      });
      const j = (await res.json().catch(() => null)) as { text?: string; ok?: boolean } | null;
      samples.push({
        city: isAr ? c.nameAr : c.nameEn,
        text: j?.text || (isAr ? "تعذر الجلب" : "Unavailable"),
      });
    } catch {
      samples.push({
        city: isAr ? c.nameAr : c.nameEn,
        text: isAr ? "تعذر الجلب" : "Unavailable",
      });
    }
  }

  return (
    <AdminPageShell
      locale={locale}
      title={isAr ? "الطقس والمدن" : "Weather & cities"}
      subtitle={
        isAr
          ? "المدن المستخدمة في /api/weather (المصدر: Open-Meteo)"
          : "Cities used by /api/weather (source: Open-Meteo)"
      }
    >
      <AdminStubBanner
        isAr={isAr}
        note={
          isAr
            ? "قيد الربط — تعديل قائمة المدن من لوحة الإدارة غير مفعّل بعد؛ القائمة ثابتة في كود /api/weather."
            : "Pending wiring — editing the city list from admin is not enabled yet; list is hardcoded in /api/weather."
        }
      />

      <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>
        {isAr ? "المدن المعرّفة" : "Configured cities"}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 10,
          marginBottom: 28,
        }}
      >
        {CITIES.map((c) => (
          <div key={c.nameEn} style={{ ...adminCardStyle, padding: 14 }}>
            <div style={{ fontWeight: 900 }}>{isAr ? c.nameAr : c.nameEn}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{isAr ? c.nameEn : c.nameAr}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>
        {isAr ? "عينة حيّة" : "Live sample"}
      </h2>
      <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        {samples.map((s) => (
          <div
            key={s.city}
            style={{
              padding: 14,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              fontWeight: 700,
            }}
          >
            {s.city}: <span style={{ fontWeight: 600, color: "#475569" }}>{s.text}</span>
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}
