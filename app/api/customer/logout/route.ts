 import { NextResponse } from "next/server";
 import { clearSession } from "@/lib/auth-customer";
 
 export const dynamic = "force-dynamic";
 
 export async function POST() {
   try {
     await clearSession();
     return NextResponse.json({ ok: true });
   } catch (e: any) {
     return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
   }
 }
