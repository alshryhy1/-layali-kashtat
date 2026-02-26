import { NextResponse } from "next/server";

export default function proxy(req: Request) {
  const url = new URL(req.url);
  if (url.pathname === "/.well-known/apple-developer-merchantid-domain-association") {
    url.pathname = "/api/apple-domain-association";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/.well-known/apple-developer-merchantid-domain-association"],
};
