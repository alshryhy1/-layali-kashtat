import { NextResponse } from "next/server";
import { fetchWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = (url.searchParams.get("lang") || "ar").toLowerCase() === "en" ? "en" : "ar";
  const cityQ = url.searchParams.get("city");
  const data = await fetchWeather({ lang, city: cityQ, timeoutMs: 8000 });
  return NextResponse.json(data, { status: 200 });
}
