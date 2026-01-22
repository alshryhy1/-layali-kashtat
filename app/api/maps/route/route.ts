import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { startLat, startLng, endLat, endLng } = await req.json();

    if (!startLat || !startLng || !endLat || !endLng) {
      return NextResponse.json({ ok: false, error: "Missing coordinates" }, { status: 400 });
    }

    // Use OSRM public API (Demo server - for production use a paid service or self-hosted OSRM)
    const url = `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      return NextResponse.json({ ok: false, error: "Route not found" }, { status: 404 });
    }

    const route = data.routes[0];
    // GeoJSON coordinates are [lng, lat], Leaflet wants [lat, lng]
    const polyline = route.geometry.coordinates.map((p: number[]) => [p[1], p[0]]);
    const durationSeconds = route.duration;
    const distanceMeters = route.distance;

    return NextResponse.json({
      ok: true,
      polyline,
      eta: Math.ceil(durationSeconds / 60), // minutes
      distance: (distanceMeters / 1000).toFixed(1) // km
    });

  } catch (e: any) {
    console.error("Route API Error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
