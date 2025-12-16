import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Body = {
  id: string;
  status: "approved" | "rejected";
};

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing env: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set them in Vercel Production).",
        },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body || !body.id || !body.status) {
      return NextResponse.json(
        { ok: false, error: "Missing body: id, status" },
        { status: 400 }
      );
    }

    if (body.status !== "approved" && body.status !== "rejected") {
      return NextResponse.json(
        { ok: false, error: "Invalid status (use approved/rejected)" },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { error } = await supabase
      .from("provider_requests")
      .update({ status: body.status })
      .eq("id", body.id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
