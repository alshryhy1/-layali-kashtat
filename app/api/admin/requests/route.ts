import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return NextResponse.json([], { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data } = await supabase
    .from("provider_requests")
    .select("*")
    .order("id", { ascending: false });

  return NextResponse.json(data || []);
}
