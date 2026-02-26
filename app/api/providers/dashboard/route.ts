 import { NextResponse } from "next/server";
 import { db } from "@/lib/db";
 import { getProviderSession } from "@/lib/auth-provider";
 
 export const dynamic = "force-dynamic";
 
 export async function GET() {
   try {
     const session = await getProviderSession();
     if (!session) {
       return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
     }
 
     const providerCity = String(session.city || "").trim();
     const services = String(session.service || "")
       .split(",")
       .map((s) => s.trim())
       .filter(Boolean);
 
     let requests: any[] = [];
     if (providerCity && services.length > 0) {
       try {
         const res = await db.query(
           "SELECT * FROM customer_requests WHERE city = $1 AND service_type = ANY($2) AND status IN ('new','pending','accepted','en_route','arrived','in_trip') ORDER BY created_at DESC LIMIT 50",
           [providerCity, services]
         );
         requests = res.rows;
       } catch {
         requests = [];
       }
     }
 
     const provider = {
       id: session.id,
       name: session.name,
       email: session.email,
       phone: session.phone,
       city: providerCity,
       service_type: services.join(", "),
       status: session.status,
     };
 
     return NextResponse.json({
       ok: true,
       provider,
       requests,
     });
   } catch (e: any) {
     return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
   }
 }
