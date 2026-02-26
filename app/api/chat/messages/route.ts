import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-customer";
import { getProviderSession } from "@/lib/auth-provider";
import { supabaseServer } from "@/lib/supabaseServer";

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
    const res = await db.query(
      "SELECT id, conversation_id, sender_role, content, media_url, media_type, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 200",
      [conversationId]
    );
    const rows = Array.isArray(res.rows) ? res.rows : [];
    const mapped = await Promise.all(
      rows.map(async (m) => {
        if (m.media_type === "image" && m.media_url) {
          try {
            const { data, error } = await supabaseServer.storage.from("images").createSignedUrl(String(m.media_url), 900);
            if (!error && data?.signedUrl) {
              return { ...m, media_url: data.signedUrl };
            }
          } catch {}
        }
        return m;
      })
    );
    return json(true, { messages: mapped }, 200);
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const conversationId = clean(body?.conversation_id);
    const senderRole = clean(body?.sender_role).toLowerCase();
    const content = clean(body?.content);
    const mediaUrl = clean(body?.media_url);
    const mediaType = clean(body?.media_type).toLowerCase() || "text";
    if (!conversationId) return json(false, { error: "missing_conversation_id" }, 400);
    if (!["customer", "provider"].includes(senderRole)) return json(false, { error: "invalid_sender" }, 400);
    if (mediaType === "text" && !content) return json(false, { error: "missing_content" }, 400);
    if (mediaType !== "text" && !mediaUrl) return json(false, { error: "missing_media_url" }, 400);

    const access = await canAccessConversation(conversationId);
    if (!access.ok) return json(false, { error: "forbidden" }, 403);
    if (access.role !== senderRole) return json(false, { error: "role_mismatch" }, 403);

    await db.query(
      "INSERT INTO messages (conversation_id, sender_role, content, media_url, media_type) VALUES ($1,$2,$3,$4,$5)",
      [conversationId, senderRole, content || null, mediaUrl || null, mediaType]
    );

    return json(true, { sent: true }, 200);
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}
