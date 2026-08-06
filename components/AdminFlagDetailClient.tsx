"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/locales";
import { localeHref } from "@/lib/locales";
import { roleLabel } from "@/lib/admin-users-shared";
import type { FlagDetail } from "@/lib/admin-flags-shared";
import type { FlagAction } from "@/lib/admin-flags-shared";
import { adminTdStyle, adminThStyle, adminTableStyle } from "@/components/AdminPageShell";

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16,
};

function Section({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <section style={{ ...card, borderTop: accent ? `3px solid ${accent}` : undefined }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ minWidth: 140 }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", wordBreak: "break-word" }}>
        {value || "—"}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  disabledReason,
  busy,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string | null;
  busy?: boolean;
  variant: "neutral" | "danger" | "warn" | "primary";
}) {
  const colors = {
    neutral: { bg: "#f8fafc", border: "#cbd5e1", color: "#334155" },
    danger: { bg: "#b91c1c", border: "#b91c1c", color: "#fff" },
    warn: { bg: "#b45309", border: "#b45309", color: "#fff" },
    primary: { bg: "#0f172a", border: "#0f172a", color: "#fff" },
  }[variant];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 220 }}>
      <button
        type="button"
        disabled={disabled || busy}
        title={disabled ? disabledReason || undefined : undefined}
        onClick={onClick}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: `1px solid ${colors.border}`,
          background: disabled ? "#e2e8f0" : colors.bg,
          color: disabled ? "#94a3b8" : colors.color,
          fontWeight: 800,
          cursor: disabled || busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {label}
      </button>
      {disabled && disabledReason ? (
        <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{disabledReason}</span>
      ) : null}
    </div>
  );
}

function fmtDate(locale: string, v: string | null | undefined) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
  } catch {
    return String(v);
  }
}

export default function AdminFlagDetailClient({
  locale,
  detail,
}: {
  locale: Locale;
  detail: FlagDetail;
}) {
  const isAr = locale === "ar";
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [flash, setFlash] = React.useState("");

  async function run(action: FlagAction, confirmMsg?: string) {
    if (confirmMsg) {
      const ok = window.confirm(confirmMsg);
      if (!ok) return;
    }
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch("/api/admin/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: detail.id, action }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      setFlash(isAr ? "تم تنفيذ الإجراء" : "Action completed");
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setFlash(isAr ? `فشل: ${msg}` : `Failed: ${msg}`);
    } finally {
      setBusy(false);
      window.setTimeout(() => setFlash(""), 8000);
    }
  }

  const caps = detail.capabilities;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {flash ? (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: flash.startsWith("فشل") || flash.startsWith("Failed") ? "#fef2f2" : "#ecfdf5",
            color: flash.startsWith("فشل") || flash.startsWith("Failed") ? "#991b1b" : "#065f46",
            fontWeight: 800,
          }}
        >
          {flash}
        </div>
      ) : null}

      <Section title={isAr ? "معلومات البلاغ" : "Report info"} accent="#b45309">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          <Field label={isAr ? "رقم البلاغ" : "Report #"} value={`#${detail.shortId}`} />
          <Field label={isAr ? "التاريخ" : "Date"} value={fmtDate(locale, detail.createdAt)} />
          <Field
            label={isAr ? "الحالة" : "Status"}
            value={isAr ? detail.statusLabelAr : detail.statusLabelEn}
          />
          <Field
            label={isAr ? "الأولوية" : "Priority"}
            value={isAr ? detail.priorityLabelAr : detail.priorityLabelEn}
          />
          <Field
            label={isAr ? "نوع البلاغ" : "Type"}
            value={isAr ? detail.targetTypeLabelAr : detail.targetTypeLabelEn}
          />
          <Field label={isAr ? "السبب" : "Reason"} value={detail.reasonHuman} />
        </div>
      </Section>

      <Section title={isAr ? "المبلّغ" : "Reporter"}>
        {detail.reporter ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 12,
              }}
            >
              <Field label={isAr ? "الاسم" : "Name"} value={detail.reporter.name || "—"} />
              <Field
                label={isAr ? "رقم العضوية" : "Membership #"}
                value={detail.reporter.membership}
              />
              <Field
                label={isAr ? "نوع الحساب" : "Account type"}
                value={roleLabel(isAr, detail.reporter.role)}
              />
            </div>
            <Link
              href={localeHref(locale, `/admin/users/${detail.reporter.id}`)}
              style={{ fontWeight: 800, color: "#1d4ed8", textDecoration: "none" }}
            >
              {isAr ? "فتح حساب المبلّغ ←" : "Open reporter account →"}
            </Link>
          </div>
        ) : (
          <div style={{ color: "#64748b", fontWeight: 600 }}>
            {isAr ? "بيانات المبلّغ غير متوفرة." : "Reporter details unavailable."}
          </div>
        )}
      </Section>

      <Section title={isAr ? "المبلّغ عليه" : "Reported user"}>
        {detail.reported ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 12,
              }}
            >
              <Field label={isAr ? "الاسم" : "Name"} value={detail.reported.name || "—"} />
              <Field
                label={isAr ? "رقم العضوية" : "Membership #"}
                value={detail.reported.membership}
              />
              <Field
                label={isAr ? "نوع الحساب" : "Account type"}
                value={roleLabel(isAr, detail.reported.role)}
              />
            </div>
            <Link
              href={localeHref(locale, `/admin/users/${detail.reported.id}`)}
              style={{ fontWeight: 800, color: "#1d4ed8", textDecoration: "none" }}
            >
              {isAr ? "فتح حساب المبلّغ عليه ←" : "Open reported account →"}
            </Link>
          </div>
        ) : (
          <div style={{ color: "#64748b", fontWeight: 600 }}>
            {isAr
              ? "تعذر تحديد المبلّغ عليه — الرسالة أو الحجز المرتبط غير موجودين."
              : "Could not resolve the reported user — linked message/booking missing."}
          </div>
        )}
      </Section>

      {detail.booking ? (
        <Section title={isAr ? "الحجز المرتبط" : "Linked booking"}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 12,
            }}
          >
            <Field
              label={isAr ? "رقم الحجز" : "Booking #"}
              value={
                detail.booking.bookingNumber
                  ? `#${detail.booking.bookingNumber}`
                  : detail.booking.id.slice(0, 8)
              }
            />
            <Field
              label={isAr ? "الخدمة" : "Service"}
              value={detail.booking.serviceTitle || "—"}
            />
            <Field
              label={isAr ? "مقدّم الخدمة" : "Provider"}
              value={detail.booking.provider?.name || "—"}
            />
            <Field
              label={isAr ? "العميل" : "Customer"}
              value={detail.booking.customer?.name || "—"}
            />
            <Field label={isAr ? "حالة الحجز" : "Booking status"} value={detail.booking.status || "—"} />
          </div>
        </Section>
      ) : detail.conversationId || detail.reasonRaw?.includes("booking_id=") ? (
        <Section title={isAr ? "الحجز المرتبط" : "Linked booking"}>
          <div style={{ color: "#92400e", fontWeight: 700 }}>
            {isAr
              ? "يُشار إلى حجز في نص البلاغ، لكن سجل الحجز غير موجود حالياً."
              : "A booking is referenced in the report text, but the booking row is missing."}
          </div>
        </Section>
      ) : null}

      <Section title={isAr ? "الرسالة المبلّغ عنها" : "Reported message"} accent="#0f766e">
        {detail.messages.length === 0 ? (
          <div style={{ color: "#92400e", fontWeight: 700, lineHeight: 1.6 }}>
            {isAr
              ? "لا يمكن عرض نص الرسالة أو السياق — الرسالة/المحادثة غير موجودة في قاعدة البيانات (قد تكون حُذفت)."
              : "Message text/context unavailable — message/conversation not found (may have been deleted)."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
              {isAr
                ? "سياق المحادثة (± حوالي 4 رسائل حول الرسالة المبلّغ عنها)"
                : "Conversation context (± ~4 messages around the reported one)"}
            </div>
            <div
              style={{
                display: "grid",
                gap: 8,
                background: "#f8fafc",
                borderRadius: 10,
                padding: 12,
                border: "1px solid #e2e8f0",
              }}
            >
              {detail.messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: m.isTarget ? "#fff7ed" : "#fff",
                    border: m.isTarget ? "2px solid #ea580c" : "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      flexWrap: "wrap",
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: 13 }}>
                      {m.senderName || m.senderRole || (isAr ? "مرسل" : "Sender")}
                      {m.isTarget ? (
                        <span
                          style={{
                            marginInlineStart: 8,
                            fontSize: 11,
                            fontWeight: 900,
                            color: "#c2410c",
                          }}
                        >
                          {isAr ? "← المبلّغ عنها" : "← Reported"}
                        </span>
                      ) : null}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      {fmtDate(locale, m.createdAt)}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                    {m.moderationStatus === "removed"
                      ? isAr
                        ? "[تم حذف الرسالة]"
                        : "[Message removed]"
                      : m.content ||
                        (m.mediaType
                          ? isAr
                            ? `[مرفق: ${m.mediaType}]`
                            : `[Attachment: ${m.mediaType}]`
                          : isAr
                            ? "(فارغة)"
                            : "(empty)")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title={isAr ? "الأدلة" : "Evidence"}>
        {detail.evidence.length === 0 ? (
          <div style={{ color: "#64748b", fontWeight: 600 }}>
            {isAr
              ? "لا توجد صور/فيديو/تسجيلات مرتبطة بهذا البلاغ في السجلات الحالية."
              : "No images/video/audio attachments found for this report."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {detail.evidence.map((e, i) => (
              <div
                key={`${e.url}-${i}`}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  alignItems: "center",
                  padding: 10,
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                }}
              >
                <span style={{ fontWeight: 800 }}>{e.label}</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>({e.kind})</span>
                <code
                  style={{
                    fontSize: 11,
                    background: "#f1f5f9",
                    padding: "4px 8px",
                    borderRadius: 6,
                    wordBreak: "break-all",
                  }}
                >
                  {e.url}
                </code>
                {e.kind === "image" || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(e.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.url}
                    alt={e.label}
                    style={{
                      maxWidth: 220,
                      maxHeight: 160,
                      borderRadius: 8,
                      objectFit: "cover",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={isAr ? "الإجراءات" : "Actions"} accent="#7f1d1d">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <ActionButton
            label={isAr ? "تجاهل" : "Dismiss"}
            variant="neutral"
            busy={busy}
            onClick={() =>
              run(
                "dismiss",
                isAr ? "تجاهل هذا البلاغ؟" : "Dismiss this report?"
              )
            }
          />
          <ActionButton
            label={isAr ? "حذف الرسالة" : "Delete message"}
            variant="danger"
            busy={busy}
            disabled={!caps.canDeleteMessage}
            disabledReason={
              isAr
                ? caps.deleteMessageDisabledReasonAr
                : caps.deleteMessageDisabledReasonEn
            }
            onClick={() =>
              run(
                "delete_message",
                isAr
                  ? "حذف الرسالة المبلّغ عنها واستبدالها بنص إداري؟"
                  : "Remove the reported message and replace with an admin notice?"
              )
            }
          />
          <ActionButton
            label={isAr ? "تحذير" : "Warn"}
            variant="warn"
            busy={busy}
            disabled={!caps.canActOnReportedAccount}
            disabledReason={
              isAr
                ? caps.reportedAccountDisabledReasonAr
                : caps.reportedAccountDisabledReasonEn
            }
            onClick={() =>
              run(
                "warn",
                isAr
                  ? "تسجيل تحذير على حساب المبلّغ عليه في سجل الإدارة؟ (لا يوجد جدول تحذيرات موجّه للمستخدم)"
                  : "Record a warning on the reported account in the admin audit log? (No user-facing warnings table)"
              )
            }
          />
          <ActionButton
            label={isAr ? "كتم محادثة" : "Mute conversation"}
            variant="warn"
            busy={busy}
            disabled={!caps.canMuteConversation}
            disabledReason={
              isAr ? caps.muteDisabledReasonAr : caps.muteDisabledReasonEn
            }
            onClick={() =>
              run(
                "mute_conversation",
                isAr
                  ? "كتم المحادثة عبر تعيين status=muted_by_admin؟"
                  : "Mute conversation by setting status=muted_by_admin?"
              )
            }
          />
          <ActionButton
            label={isAr ? "إيقاف حساب" : "Suspend account"}
            variant="danger"
            busy={busy}
            disabled={!caps.canActOnReportedAccount}
            disabledReason={
              isAr
                ? caps.reportedAccountDisabledReasonAr
                : caps.reportedAccountDisabledReasonEn
            }
            onClick={() =>
              run(
                "suspend_account",
                isAr
                  ? "إيقاف حساب المبلّغ عليه عبر auth.users.banned_until؟"
                  : "Suspend the reported account via auth.users.banned_until?"
              )
            }
          />
          <ActionButton
            label={isAr ? "حظر دائم" : "Permanent ban"}
            variant="danger"
            busy={busy}
            disabled={!caps.canActOnReportedAccount}
            disabledReason={
              isAr
                ? caps.reportedAccountDisabledReasonAr
                : caps.reportedAccountDisabledReasonEn
            }
            onClick={() =>
              run(
                "permanent_ban",
                isAr
                  ? "حظر دائم لنفس آلية الإيقاف (banned_until بعيد) مع تسجيله كحظر دائم؟"
                  : "Permanent ban uses the same banned_until far-future mechanism, logged as permanent ban?"
              )
            }
          />
        </div>
        <p style={{ margin: "14px 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
          {isAr
            ? "ملاحظة: التحذير يُسجَّل في admin_audit_log فقط (لا عمود تحذيرات للمستخدم). الإيقاف/الحظر عبر auth.users.banned_until. كتم المحادثة عبر conversations.status."
            : "Note: warnings are recorded in admin_audit_log only (no user warnings column). Suspend/ban use auth.users.banned_until. Mute sets conversations.status."}
        </p>
      </Section>

      <details
        style={{
          ...card,
          background: "#f8fafc",
        }}
      >
        <summary style={{ cursor: "pointer", fontWeight: 900, color: "#475569" }}>
          {isAr ? "معلومات تقنية" : "Technical details"}
        </summary>
        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "الحقل" : "Field"}</th>
                <th style={adminThStyle}>{isAr ? "القيمة" : "Value"}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["report_id", detail.id],
                ["target_type", detail.targetType],
                ["target_id", detail.targetId],
                ["reporter_id", detail.reporter?.id],
                ["reported_id", detail.reported?.id],
                ["booking_id", detail.booking?.id],
                ["conversation_id", detail.conversationId],
                ["status_raw", detail.status],
                ["reviewed_at", detail.reviewedAt],
                ["auto_hidden", detail.autoHidden == null ? null : String(detail.autoHidden)],
                ["reason_raw", detail.reasonRaw],
              ].map(([k, v]) => (
                <tr key={String(k)}>
                  <td style={{ ...adminTdStyle, fontFamily: "monospace", fontSize: 12 }}>{k}</td>
                  <td
                    style={{
                      ...adminTdStyle,
                      fontFamily: "monospace",
                      fontSize: 12,
                      wordBreak: "break-all",
                    }}
                  >
                    {v || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
