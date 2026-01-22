import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const key = url.searchParams.get("key");
  
  // Simple security for email link
  if (key !== (process.env.ADMIN_SECRET || "lk_admin_secret_123")) {
     return new NextResponse("Unauthorized", { status: 401 });
  }
  
  if (!id) return new NextResponse("Missing ID", { status: 400 });

  try {
    await db.query("UPDATE provider_requests SET status = 'approved' WHERE id = $1", [id]);
    return new NextResponse("<h1>تم قبول مقدم الخدمة بنجاح</h1><p>يمكنك إغلاق هذه الصفحة.</p>", { 
      headers: { "content-type": "text/html; charset=utf-8" } 
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
