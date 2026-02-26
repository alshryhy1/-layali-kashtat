import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-customer";
import { getProviderSession } from "@/lib/auth-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status, headers: { "Cache-Control": "no-store" } });
}

function extFromType(t: string) {
  const m = t.toLowerCase();
  if (m.includes("jpeg")) return "jpg";
  if (m.includes("jpg")) return "jpg";
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("gif")) return "gif";
  return "";
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const conversationId = String(form.get("conversation_id") || "").trim();
    const senderRole = String(form.get("sender_role") || "").trim().toLowerCase();
    if (!file || typeof file === "string") {
      return json(false, { error: "missing_file" }, 400);
    }
    if (!conversationId || !["customer", "provider"].includes(senderRole)) {
      return json(false, { error: "missing_context" }, 400);
    }

    const customer = await getSession().catch(() => null);
    const provider = await getProviderSession().catch(() => null);
    if (!customer && !provider) return json(false, { error: "unauthorized" }, 401);
    try {
      const q = await db.query("SELECT id, request_id, provider_id FROM conversations WHERE id = $1 LIMIT 1", [conversationId]);
      if (q.rows.length === 0) return json(false, { error: "forbidden" }, 403);
      const conv = q.rows[0];
      if (senderRole === "provider") {
        if (!provider || Number(conv.provider_id) !== Number(provider.id)) return json(false, { error: "forbidden" }, 403);
      } else {
        if (!customer) return json(false, { error: "forbidden" }, 403);
        const rq = await db.query("SELECT id FROM customer_requests WHERE id = $1 AND (email = $2 OR phone = $3) LIMIT 1", [conv.request_id, customer.email, customer.phone]);
        if (rq.rows.length === 0) return json(false, { error: "forbidden" }, 403);
      }
    } catch {
      return json(false, { error: "forbidden" }, 403);
    }

    const f = file as File;
    const type = String((f as any).type || "");
    const size = Number((f as any).size || 0);
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(type)) {
      return json(false, { error: "invalid_type" }, 400);
    }
    const maxBytes = 8 * 1024 * 1024;
    if (!Number.isFinite(size) || size <= 0 || size > maxBytes) {
      return json(false, { error: "file_too_large" }, 400);
    }

    const bytes = Buffer.from(await f.arrayBuffer());
    const bucket = "images";
    try {
      await supabaseServer.storage.createBucket(bucket, { public: false, fileSizeLimit: `${maxBytes}` });
    } catch {}
    const ext = extFromType(type) || "bin";
    const key = `${crypto.randomUUID()}.${ext}`;
    const res = await supabaseServer.storage.from(bucket).upload(key, bytes, { contentType: type, upsert: false });
    if (res.error) return json(false, { error: res.error.message }, 500);
    return json(true, { key }, 200);
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}
