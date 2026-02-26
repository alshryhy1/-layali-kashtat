import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      ".well-known",
      "apple-developer-merchantid-domain-association"
    );

    const content = fs.readFileSync(filePath, "utf8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=300, must-revalidate",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
