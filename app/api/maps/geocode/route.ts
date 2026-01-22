import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeText(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = safeText(url.searchParams.get("q") || "");
  const lang = safeText(url.searchParams.get("lang") || "");

  if (!q) {
    return NextResponse.json({ ok: false, error: "missing_q" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}${
        lang ? `&accept-language=${encodeURIComponent(lang)}` : ""
      }`,
      {
        headers: {
          "User-Agent": "layali-kashtat/1.0",
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "geocode_failed" }, { status: 502 });
    }

    const data = (await res.json()) as Array<any>;
    const hit = data?.[0];
    const lat = hit?.lat ? Number(hit.lat) : null;
    const lng = hit?.lon ? Number(hit.lon) : null;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      lat,
      lng,
      display_name: safeText(hit?.display_name || ""),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server_error" }, { status: 500 });
  }
}

