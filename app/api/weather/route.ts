import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      `https://api.openweathermap.org/data/2.5/weather` +
      `?lat=${lat}&lon=${lon}` +
      `&appid=${encodeURIComponent(key)}` +
      `&units=${units}` +
      `&lang=${lang}`;

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json(
        {
          ok: false,
          error: "openweather_error",
          status: res.status,
          details: txt,
        },
        { status: 500 }
      );
    }

    const json = await res.json();

    const temp = Math.round(Number(json?.main?.temp));
    const desc = String(json?.weather?.[0]?.description || "").trim();

    return NextResponse.json({
      ok: true,
      temp,
      desc,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "server_exception",
        details: e?.message || String(e),
      },
      { status: 500 }
    );
  }
}
