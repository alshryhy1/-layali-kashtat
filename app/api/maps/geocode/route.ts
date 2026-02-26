 import { NextResponse } from "next/server";
 
 export const dynamic = "force-dynamic";
 
export async function GET(req: Request) {
   const { searchParams } = new URL(req.url);
   const q = String(searchParams.get("q") || "").trim();
   if (!q) return NextResponse.json({ ok: false, error: "Missing q" }, { status: 400 });
 
   try {
    const mapboxToken = (process.env.MAPBOX_TOKEN || "").trim();
    const googleKey = (process.env.GOOGLE_MAPS_KEY || "").trim();
    if (mapboxToken) {
      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`);
      url.searchParams.set("access_token", mapboxToken);
      url.searchParams.set("limit", "1");
      const res = await fetch(url.toString(), { cache: "no-store" });
      const j = await res.json().catch(() => null);
      const feat = Array.isArray(j?.features) ? j.features[0] : null;
      const center = Array.isArray(feat?.center) ? feat.center : null;
      if (!center) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true, lat: Number(center[1]), lng: Number(center[0]), display_name: String(feat?.place_name || q) });
    } else if (googleKey) {
      const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      url.searchParams.set("address", q);
      url.searchParams.set("key", googleKey);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const j = await res.json().catch(() => null);
      const r = Array.isArray(j?.results) ? j.results[0] : null;
      const loc = r?.geometry?.location;
      if (!loc) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true, lat: Number(loc.lat), lng: Number(loc.lng), display_name: String(r?.formatted_address || q) });
    } else {
      // Fallback to OpenStreetMap Nominatim (public)
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", q);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "1");
      const res = await fetch(url.toString(), { headers: { "user-agent": "Layali-Kashtat-App/1.0" } });
      const j = await res.json().catch(() => []);
      if (!Array.isArray(j) || j.length === 0) {
        return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      }
      const item = j[0];
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      return NextResponse.json({ ok: true, lat, lng, display_name: item.display_name });
    }
   } catch (e: any) {
     return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
   }
 }
