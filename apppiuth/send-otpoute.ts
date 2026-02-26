
import { NextResponse } from "next/server";
import { sendOTP } from "@/lib/authentica";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ ok: false, error: "Phone number is required" }, { status: 400 });
    }

    const result = await sendOTP(phone);
    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
