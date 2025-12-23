import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: string | null): Locale {
  return v === "en" ? "en" : "ar";
}

function json(status: number, data: any) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

// خريطة أسماء المدن (Arabic/English) -> اسم مناسب لاستعلام OpenWeather (q=City,SA)
const CITY_TO_Q: Record<string, { q: string; ar: string }> = {
  // الأكثر شيوعًا
  "الرياض": { q: "Riyadh,SA", ar: "الرياض" },
  Riyadh: { q: "Riyadh,SA", ar: "الرياض" },

  "جدة": { q: "Jeddah,SA", ar: "جدة" },
  Jeddah: { q: "Jeddah,SA", ar: "جدة" },

  "مكة المكرمة": { q: "Mecca,SA", ar: "مكة المكرمة" },
  Mecca: { q: "Mecca,SA", ar: "مكة المكرمة" },
  Makkah: { q: "Mecca,SA", ar: "مكة المكرمة" },

  "المدينة المنورة": { q: "Medina,SA", ar: "المدينة المنورة" },
  Medina: { q: "Medina,SA", ar: "المدينة المنورة" },
  Madinah: { q: "Medina,SA", ar: "المدينة المنورة" },

  "الدمام": { q: "Dammam,SA", ar: "الدمام" },
  Dammam: { q: "Dammam,SA", ar: "الدمام" },

  "القصيم": { q: "Buraidah,SA", ar: "القصيم" },
  Qassim: { q: "Buraidah,SA", ar: "القصيم" },
  Buraidah: { q: "Buraidah,SA", ar: "القصيم" },

  "حائل": { q: "Hail,SA", ar: "حائل" },
  Hail: { q: "Hail,SA", ar: "حائل" },

  "عرعر": { q: "Arar,SA", ar: "عرعر" },
  Arar: { q: "Arar,SA", ar: "عرعر" },

  "طريف": { q: "Turaif,SA", ar: "طريف" },
  Turaif: { q: "Turaif,SA", ar: "طريف" },

  "القريات": { q: "Al Qurayyat,SA", ar: "القريات" },
  "Al Qurayyat": { q: "Al Qurayyat,SA", ar: "القريات" },

  "طبرجل": { q: "Tubarjal,SA", ar: "طبرجل" },
  Tubarjal: { q: "Tubarjal,SA", ar: "طبرجل" },

  "الجوف": { q: "Sakakah,SA", ar: "الجوف" },
  Jouf: { q: "Sakakah,SA", ar: "الجوف" },
  Sakakah: { q: "Sakakah,SA", ar: "الجوف" },

  "تبوك": { q: "Tabuk,SA", ar: "تبوك" },
  Tabuk: { q: "Tabuk,SA", ar: "تبوك" },

  "العلا": { q: "AlUla,SA", ar: "العلا" },
  AlUla: { q: "AlUla,SA", ar: "العلا" },

  "ينبع": { q: "Yanbu,SA", ar: "ينبع" },
  Yanbu: { q: "Yanbu,SA", ar: "ينبع" },

  "أملج": { q: "Umluj,SA", ar: "أملج" },
  Umluj: { q: "Umluj,SA", ar: "أملج" },

  "حقل": { q: "Haql,SA", ar: "حقل" },
  Haql: { q: "Haql,SA", ar: "حقل" },
};

function pickCity(cityParam: string | null) {
  const raw = String(cityParam || "").trim();
  if (!raw) return CITY_TO_Q["الرياض"];
  return CITY_TO_Q[raw] || CITY_TO_Q["الرياض"];
}

export async function GET(req: Request) {
  try {
    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) {
      return json(500, { ok: false, error: "missing_api_key" });
    }

    const { searchParams } = new URL(req.url);
    const lang = asLocale(searchParams.get("lang"));
    const cityParam = searchParams.get("city");
    const picked = pickCity(cityParam);

    const units = "metric";
    const url =
      `https://api.openweathermap.org/data/2.5/weather` +
      `?q=${encodeURIComponent(picked.q)}` +
      `&appid=${encodeURIComponent(key)}` +
      `&units=${encodeURIComponent(units)}` +
      `&lang=${encodeURIComponent(lang)}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return json(502, { ok: false, error: "weather_upstream_error", detail: text || String(res.status) });
    }

    const data: any = await res.json().catch(() => null);
    if (!data) return json(502, { ok: false, error: "bad_weather_response" });

    const temp = typeof data?.main?.temp === "number" ? Math.round(data.main.temp) : null;
    const desc = String(data?.weather?.[0]?.description || "").trim();

    const cityDisplay = lang === "ar" ? picked.ar : picked.q.split(",")[0];

    if (temp === null || !desc) {
      return json(502, { ok: false, error: "missing_fields" });
    }

    const text =
      lang === "ar"
        ? `🌤️ ${cityDisplay}: ${temp}°C — ${desc}`
        : `🌤️ ${cityDisplay}: ${temp}°C — ${desc}`;

    return json(200, {
      ok: true,
      city: cityDisplay,
      temp,
      desc,
      text,
    });
  } catch (e: any) {
    return json(500, { ok: false, error: "server_error", detail: e?.message || "error" });
  }
}
