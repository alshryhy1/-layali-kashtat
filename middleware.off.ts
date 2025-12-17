import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  // تعطيل مؤقت للحماية للتأكد أن الموقع يفتح
  return NextResponse.next();
}

export const config = {
  matcher: ["/ar/admin/:path*", "/en/admin/:path*"],
};
