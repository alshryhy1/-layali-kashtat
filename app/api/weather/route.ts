import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OWResp = {
  name?: string;
  main?: { temp?: number };
  weather?: Array<{ description?: string; icon?: string }>;
};

function cap(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function GET(req: Request) {
  try {
    const key = process.env.OPENWEATHER_API_KEY;

    if (!key) {
      return NextResponse.json(
        { ok: false, error: "missing_api_key" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") === "en" ? "en" : "ar";

    // 📍 الرياض (ثابت حاليًا)
    const lat = 24.7136;
    const lon = 46.6753;
    const units = "metric";

    const url =
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}` +
      `&appid=${encodeURIComponent(key)}&units=${units}&lang=${lang}`;

    const r = await fetch(url, {
      // لا نخزن نتيجة قديمة
      cache: "no-store",
    });

    const data = (await r.json().catch(() => null)) as OWResp | null;

    if (!r.ok || !data) {
      return NextResponse.json(
        { ok: false, error: "weather_fetch_failed" },
        { status: 500 }
      );
    }

    const city = String(data.name || (lang === "ar" ? "الرياض" : "Riyadh")).trim();
    const tempRaw = data.main?.temp;
    const temp = typeof tempRaw === "number" ? Math.round(tempRaw) : null;

    const descRaw = String(data.weather?.[0]?.description || "").trim();
    const desc = lang === "ar" ? descRaw : cap(descRaw);

    // نص جاهز للعرض في الشريط
    const text =
      lang === "ar"
        ? `🌤️ ${city}${temp !== null ? `: ${temp}°C` : ""}${desc ? ` — ${desc}` : ""}`
        : `🌤️ ${city}${temp !== null ? `: ${temp}°C` : ""}${desc ? ` — ${desc}` : ""}`;

    return NextResponse.json({
      ok: true,
      city,
      temp,
      desc,
      text,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
