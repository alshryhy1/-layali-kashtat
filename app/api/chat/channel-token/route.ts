import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-customer";
import { getProviderSession } from "@/lib/auth-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}
function clean(v: unknown) {
  return String(v ?? "").trim();
}

async function canAccessConversation(conversationId: string) {
  const customer = await getSession().catch(() => null);
  const provider = await getProviderSession().catch(() => null);
  if (!customer && !provider) return { ok: false };
  try {
    const q = await db.query("SELECT id, request_id, provider_id FROM conversations WHERE id = $1 LIMIT 1", [conversationId]);
    if (q.rows.length === 0) return { ok: false };
    const conv = q.rows[0];
    if (provider && Number(conv.provider_id) === Number(provider.id)) {
      return { ok: true, role: "provider", providerId: provider.id };
    }
    if (customer) {
      const rq = await db.query("SELECT id FROM customer_requests WHERE id = $1 AND (email = $2 OR phone = $3) LIMIT 1", [conv.request_id, customer.email, customer.phone]);
      if (rq.rows.length > 0) return { ok: true, role: "customer" };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const conversationId = clean(url.searchParams.get("conversation_id"));
    if (!conversationId) return json(false, { error: "missing_conversation_id" }, 400);
    const access = await canAccessConversation(conversationId);
    if (!access.ok) return json(false, { error: "forbidden" }, 403);
    const token = crypto.randomBytes(8).toString("hex");
    const channel = `conv:${conversationId}:${token}`;
    return json(true, { token, channel }, 200);
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}
