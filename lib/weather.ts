export type WeatherLocale = "ar" | "en";

type CityInfo = { nameAr: string; nameEn: string; lat: number; lng: number };

const CITIES: CityInfo[] = [
  { nameAr: "مكة", nameEn: "Makkah", lat: 21.4225, lng: 39.8262 },
  { nameAr: "المدينة", nameEn: "Madinah", lat: 24.5247, lng: 39.5692 },
  { nameAr: "الرياض", nameEn: "Riyadh", lat: 24.7136, lng: 46.6753 },
  { nameAr: "القصيم", nameEn: "Qassim", lat: 26.2389, lng: 43.9470 },
  { nameAr: "حائل", nameEn: "Hail", lat: 27.5114, lng: 41.7208 },
  { nameAr: "الحدود الشمالية", nameEn: "Northern Borders", lat: 30.9753, lng: 41.0207 },
  { nameAr: "الجوف", nameEn: "Al Jouf", lat: 29.9720, lng: 40.9570 },
  { nameAr: "تبوك", nameEn: "Tabuk", lat: 28.3838, lng: 36.5662 },
  { nameAr: "جدة", nameEn: "Jeddah", lat: 21.4858, lng: 39.1925 },
  { nameAr: "نجران", nameEn: "Najran", lat: 17.5650, lng: 44.2230 },
  { nameAr: "عسير", nameEn: "Asir", lat: 18.2164, lng: 42.5046 },
];

function descAr(code: number) {
  if (code <= 1) return "صافي";
  if (code <= 3) return "غائم جزئياً";
  if (code <= 67) return "مطر";
  if (code <= 77) return "ثلوج خفيفة";
  if (code <= 86) return "ثلوج";
  return "عاصف";
}

function descEn(code: number) {
  if (code <= 1) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Light Snow";
  if (code <= 86) return "Snow";
  return "Windy";
}

export function findWeatherCity(q: string | null) {
  const v = String(q || "").trim();
  if (!v) return null;
  const norm = v.replace(/\s+/g, "").toLowerCase();
  return (
    CITIES.find(
      (c) =>
        c.nameAr.replace(/\s+/g, "").toLowerCase() === norm ||
        c.nameEn.replace(/\s+/g, "").toLowerCase() === norm
    ) || null
  );
}

export type WeatherPayload = {
  ok: boolean;
  city: string;
  temp?: number;
  description?: string;
  code?: number;
  text: string;
  error?: string;
};

/** Direct Open-Meteo fetch — safe for SSR (no self-HTTP / production round-trip). */
export async function fetchWeather(opts: {
  lang: WeatherLocale;
  city?: string | null;
  timeoutMs?: number;
}): Promise<WeatherPayload> {
  const lang = opts.lang === "en" ? "en" : "ar";
  const city = findWeatherCity(opts.city ?? null) || CITIES[2];
  const cityName = lang === "ar" ? city.nameAr : city.nameEn;
  const timeoutMs = opts.timeoutMs ?? 2500;

  try {
    const api = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current_weather=true`;
    const res = await fetch(api, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const j = await res.json().catch(() => null);
    const cw = j?.current_weather;
    if (!cw) throw new Error("weather_unavailable");

    const temp = Math.round(Number(cw.temperature) || 0);
    const code = Number(cw.weathercode) || 0;
    const description = lang === "ar" ? descAr(code) : descEn(code);
    const text = `${cityName} • ${temp}° • ${description}`;

    return { ok: true, city: cityName, temp, description, code, text };
  } catch (e: any) {
    const text =
      lang === "ar" ? `${cityName} • الطقس غير متاح الآن` : `${cityName} • Weather unavailable`;
    return { ok: false, city: cityName, text, error: e?.message || "error" };
  }
}
