 import { NextResponse } from "next/server";
 
 export const dynamic = "force-dynamic";
 
 function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
   const toRad = (v: number) => (v * Math.PI) / 180;
   const R = 6371e3; // meters
   const dLat = toRad(lat2 - lat1);
   const dLon = toRad(lon2 - lon1);
   const a =
     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
     Math.sin(dLon / 2) * Math.sin(dLon / 2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   return R * c;
 }
 
 export async function POST(req: Request) {
   try {
     const { startLat, startLng, endLat, endLng } = await req.json();
     const sLat = Number(startLat), sLng = Number(startLng), eLat = Number(endLat), eLng = Number(endLng);
     if (![sLat, sLng, eLat, eLng].every((v) => Number.isFinite(v))) {
       return NextResponse.json({ ok: false, error: "Invalid coords" }, { status: 400 });
     }
     const distMeters = haversine(sLat, sLng, eLat, eLng);
     const speedMps = 12; // ~43km/h average in city
     const etaSeconds = Math.round(distMeters / speedMps);
     const polyline = [
       [sLat, sLng],
       [eLat, eLng],
     ];
     return NextResponse.json({ ok: true, polyline, eta: etaSeconds });
   } catch (e: any) {
     return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
   }
 }
