import { NextResponse } from "next/server";
import {
  requireAdminApi,
  applyProfileAction,
  applyBulkProfileAction,
  type ProfileAction,
} from "@/lib/admin-profiles-api";
import { listAdminUsers, membershipId, isVerified, isSuspended } from "@/lib/admin-users-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status });
}

/** GET — list users (JSON) or CSV export (?format=csv) */
export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const verified = (url.searchParams.get("verified") || "all") as "all" | "verified" | "unverified";
  const role = (url.searchParams.get("role") || "all") as "all" | "customer" | "provider" | "admin";
  const status = (url.searchParams.get("status") || "all") as "all" | "active" | "suspended";
  const format = url.searchParams.get("format") || "json";

  const rows = await listAdminUsers({
    q,
    verified,
    role,
    status,
    limit: format === "csv" ? 2000 : 500,
  });

  if (format === "csv") {
    const headers = [
      "membership_id",
      "id",
      "name",
      "phone",
      "email",
      "role",
      "city",
      "verified",
      "status",
      "last_login",
      "services_count",
      "bookings_count",
      "haraj_count",
      "ads_count",
      "created_at",
    ];
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push(
        [
          membershipId(r.id),
          r.id,
          r.name,
          r.phone,
          r.email,
          r.role || "",
          r.city,
          isVerified(r) ? "yes" : "no",
          isSuspended(r.banned_until) ? "suspended" : "active",
          r.last_login,
          r.services_count,
          r.bookings_count,
          r.haraj_count,
          r.ads_count,
          r.created_at,
        ]
          .map(escape)
          .join(",")
      );
    }
    const bom = "\uFEFF";
    return new NextResponse(bom + lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="layali-users-${Date.now()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return json({ ok: true, users: rows });
}

/** Shared single/bulk action handler (POST used by admin UI; PATCH kept as alias). */
async function handleAction(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const body = (await req.json().catch(() => null)) as {
    id?: string;
    ids?: string[];
    action?: ProfileAction;
    role?: string;
  } | null;

  const action = body?.action;
  if (!action) return json({ ok: false, error: "missing_action" }, 400);

  const ids = Array.isArray(body?.ids) ? body!.ids! : body?.id ? [body.id] : [];
  if (ids.length === 0) return json({ ok: false, error: "missing_ids" }, 400);

  if (
    ids.length === 1 &&
    (action === "set_role" ||
      action === "reset_password" ||
      action === "delete" ||
      action === "suspend" ||
      action === "activate" ||
      action === "verify" ||
      action === "unverify")
  ) {
    const res = await applyProfileAction({
      id: ids[0],
      action,
      role: body?.role,
      adminUsername: auth.username,
    });
    return json(res, res.ok ? 200 : 400);
  }

  if (action === "set_role" || action === "reset_password") {
    return json({ ok: false, error: "action_not_bulk" }, 400);
  }

  const bulk = await applyBulkProfileAction({
    ids,
    action: action as "suspend" | "activate" | "verify" | "unverify" | "delete",
    adminUsername: auth.username,
  });
  return json({ ok: bulk.ok, done: bulk.done, errors: bulk.errors }, bulk.ok ? 200 : 207);
}

export async function POST(req: Request) {
  return handleAction(req);
}

export async function PATCH(req: Request) {
  return handleAction(req);
}
