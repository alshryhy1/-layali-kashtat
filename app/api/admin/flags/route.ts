import { NextResponse } from "next/server";
import { requireAdminApi, applyProfileAction } from "@/lib/admin-profiles-api";
import { writeAdminAudit } from "@/lib/admin-users-data";
import { db } from "@/lib/db";
import { getAdminFlagDetail, markReportReviewed } from "@/lib/admin-flags-data";
import type { FlagAction } from "@/lib/admin-flags-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const body = (await req.json().catch(() => null)) as {
    id?: string;
    action?: FlagAction;
  } | null;

  const id = String(body?.id || "").trim();
  const action = body?.action;
  if (!id || !action) return json({ ok: false, error: "missing_id_or_action" }, 400);

  const detail = await getAdminFlagDetail(id);
  if (!detail) return json({ ok: false, error: "not_found" }, 404);

  const before = `status=${detail.status || "open"}`;

  try {
    switch (action) {
      case "dismiss": {
        await markReportReviewed({
          id,
          status: "dismissed",
          adminUsername: auth.username,
          note: "dismissed",
        });
        await writeAdminAudit({
          adminUsername: auth.username,
          action: "flag_dismiss",
          targetTable: "content_reports",
          targetId: id,
          beforeStatus: before,
          afterStatus: "dismissed",
        });
        return json({ ok: true, message: "dismissed" });
      }

      case "delete_message": {
        if (!detail.capabilities.canDeleteMessage) {
          return json(
            {
              ok: false,
              error:
                detail.capabilities.deleteMessageDisabledReasonEn ||
                "delete_message_unavailable",
            },
            400
          );
        }
        const targetId = detail.targetId!;
        await db.query(
          `UPDATE messages
           SET content = $2,
               media_url = NULL,
               moderation_status = 'removed',
               moderation_reason = 'admin_removed',
               moderated_at = NOW()
           WHERE id::text = $1`,
          [targetId, "[تم حذف هذه الرسالة بواسطة الإدارة]"]
        );
        await markReportReviewed({
          id,
          status: "actioned",
          adminUsername: auth.username,
          note: "message_removed",
        });
        await writeAdminAudit({
          adminUsername: auth.username,
          action: "flag_delete_message",
          targetTable: "messages",
          targetId,
          beforeStatus: before,
          afterStatus: "removed",
        });
        return json({ ok: true, message: "message_removed" });
      }

      case "warn": {
        const reportedId = detail.reported?.id;
        if (!reportedId) {
          return json(
            {
              ok: false,
              error:
                detail.capabilities.reportedAccountDisabledReasonEn ||
                "reported_user_unknown",
            },
            400
          );
        }
        await writeAdminAudit({
          adminUsername: auth.username,
          action: "flag_warn_user",
          targetTable: "profiles",
          targetId: reportedId,
          beforeStatus: before,
          afterStatus: `warned_via_report:${id}`,
        });
        await markReportReviewed({
          id,
          status: "warned",
          adminUsername: auth.username,
          note: "warned",
        });
        return json({
          ok: true,
          message: "warned",
          note:
            "Warning recorded in admin audit log (no user-facing warnings table in schema).",
        });
      }

      case "mute_conversation": {
        if (!detail.capabilities.canMuteConversation || !detail.conversationId) {
          return json(
            {
              ok: false,
              error:
                detail.capabilities.muteDisabledReasonEn || "mute_unavailable",
            },
            400
          );
        }
        await db.query(
          `UPDATE conversations
           SET status = 'muted_by_admin',
               updated_at = NOW()
           WHERE id::text = $1`,
          [detail.conversationId]
        );
        await markReportReviewed({
          id,
          status: "actioned",
          adminUsername: auth.username,
          note: "conversation_muted",
        });
        await writeAdminAudit({
          adminUsername: auth.username,
          action: "flag_mute_conversation",
          targetTable: "conversations",
          targetId: detail.conversationId,
          beforeStatus: before,
          afterStatus: "muted_by_admin",
        });
        return json({ ok: true, message: "conversation_muted" });
      }

      case "suspend_account":
      case "permanent_ban": {
        const reportedId = detail.reported?.id;
        if (!reportedId) {
          return json(
            {
              ok: false,
              error:
                detail.capabilities.reportedAccountDisabledReasonEn ||
                "reported_user_unknown",
            },
            400
          );
        }
        const res = await applyProfileAction({
          id: reportedId,
          action: "suspend",
          adminUsername: auth.username,
        });
        if (!res.ok) {
          return json({ ok: false, error: res.error || "suspend_failed" }, 400);
        }
        // Extra audit marker distinguishing permanent ban intent (same banned_until mechanism).
        if (action === "permanent_ban") {
          await writeAdminAudit({
            adminUsername: auth.username,
            action: "flag_permanent_ban",
            targetTable: "profiles",
            targetId: reportedId,
            beforeStatus: before,
            afterStatus: "banned_until_far_future",
          });
        } else {
          await writeAdminAudit({
            adminUsername: auth.username,
            action: "flag_suspend_account",
            targetTable: "profiles",
            targetId: reportedId,
            beforeStatus: before,
            afterStatus: "suspended",
          });
        }
        await markReportReviewed({
          id,
          status: "actioned",
          adminUsername: auth.username,
          note: action,
        });
        return json({
          ok: true,
          message: action === "permanent_ban" ? "permanently_banned" : "suspended",
        });
      }

      default:
        return json({ ok: false, error: "unknown_action" }, 400);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("admin flags action failed:", action, msg);
    return json({ ok: false, error: msg }, 500);
  }
}
