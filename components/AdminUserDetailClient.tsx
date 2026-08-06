"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  adminTableStyle,
  adminThStyle,
  adminTdStyle,
} from "@/components/AdminPageShell";
import {
  type AdminUserRow,
  isSuspended,
  isVerified,
  membershipId,
  roleLabel,
  statusLabel,
} from "@/lib/admin-users-shared";
import { localeHref } from "@/lib/locales";

type Locale = "ar" | "en";

type Related = {
  services: Array<{
    id: string;
    title: string | null;
    moderation_status: string | null;
    is_active: boolean | null;
    created_at: string | null;
  }>;
  bookings: Array<{
    id: string;
    booking_number: string | null;
    status: string | null;
    created_at: string | null;
    scheduled_at: string | null;
  }>;
  haraj: Array<{
    id: string;
    title: string | null;
    price: string | null;
    city: string | null;
    created_at: string | null;
  }>;
  ads: Array<{
    id: string;
    title: string | null;
    status: string | null;
    city: string | null;
    created_at: string | null;
  }>;
  reports: Array<{
    id: string;
    target_type: string | null;
    target_id: string | null;
    reason: string | null;
    status: string | null;
    created_at: string | null;
    as_reporter: boolean;
  }>;
  activity: Array<{
    id: string;
    action: string | null;
    target_table: string | null;
    before_status: string | null;
    after_status: string | null;
    admin_username: string | null;
    created_at: string | null;
  }>;
};

function fmtDate(locale: string, v: string | null | undefined) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
  } catch {
    return String(v);
  }
}

const btn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};

const btnDanger: React.CSSProperties = {
  ...btn,
  border: "1px solid #b91c1c",
  background: "#b91c1c",
  color: "#fff",
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  border: "1px solid #166534",
  background: "#166534",
  color: "#fff",
};

const btnWarn: React.CSSProperties = {
  ...btn,
  border: "1px solid #b45309",
  background: "#fffbeb",
  color: "#92400e",
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16,
};

function Section({
  title,
  children,
  empty,
  isAr,
}: {
  title: string;
  children: React.ReactNode;
  empty: boolean;
  isAr: boolean;
}) {
  return (
    <section style={card}>
      <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 900 }}>{title}</h2>
      {empty ? (
        <p style={{ margin: 0, color: "#64748b", fontWeight: 600 }}>
          {isAr ? "لا توجد عناصر." : "No items."}
        </p>
      ) : (
        children
      )}
    </section>
  );
}

export default function AdminUserDetailClient({
  locale,
  user,
  related,
}: {
  locale: Locale;
  user: AdminUserRow;
  related: Related;
}) {
  const isAr = locale === "ar";
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [flash, setFlash] = React.useState("");
  const [role, setRole] = React.useState(
    String(user.role || "customer").toLowerCase() || "customer"
  );

  const suspended = isSuspended(user.banned_until);
  const verified = isVerified(user);

  async function runAction(action: string, extra?: { role?: string }) {
    if (action === "delete") {
      const ok = window.confirm(
        isAr
          ? "تأكيد حذف هذا الحساب؟ قد يفشل الحذف إن وُجدت بيانات مرتبطة — سيتم الإيقاف كبديل."
          : "Delete this account? If related rows block delete, it will suspend instead."
      );
      if (!ok) return;
    }
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch("/api/admin/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, action, role: extra?.role }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      if (json.recoveryLink) {
        setFlash(
          isAr
            ? `رابط استعادة كلمة المرور (نُسخ إن أمكن): ${json.recoveryLink}`
            : `Password recovery link (copied if possible): ${json.recoveryLink}`
        );
        try {
          await navigator.clipboard.writeText(String(json.recoveryLink));
        } catch {
          /* ignore */
        }
      } else if (action === "delete") {
        setFlash(isAr ? "تم الحذف — العودة للقائمة…" : "Deleted — returning…");
        router.push(localeHref(locale, "/admin/users"));
        router.refresh();
        return;
      } else {
        setFlash(isAr ? "تم التحديث" : "Updated");
      }
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setFlash(isAr ? `فشل: ${msg}` : `Failed: ${msg}`);
    } finally {
      setBusy(false);
      window.setTimeout(() => setFlash(""), 8000);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ ...card, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
              {isAr ? "رقم العضوية" : "Membership #"} · {membershipId(user.id)}
            </div>
            <h2 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 900 }}>
              {user.name || "—"}
            </h2>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 4, fontFamily: "monospace" }}>
              {user.id}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 12,
                background: suspended ? "#fef2f2" : "#ecfdf5",
                color: suspended ? "#991b1b" : "#065f46",
              }}
            >
              {statusLabel(isAr, user.banned_until)}
            </span>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{roleLabel(isAr, user.role)}</span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 10,
          }}
        >
          {[
            { k: isAr ? "الجوال" : "Phone", v: user.phone || "—" },
            { k: isAr ? "البريد" : "Email", v: user.email || "—" },
            { k: isAr ? "المدينة" : "City", v: user.city || "—" },
            {
              k: isAr ? "التحقق" : "Verified",
              v: verified ? (isAr ? "موثّق" : "Yes") : isAr ? "غير موثّق" : "No",
            },
            { k: isAr ? "آخر دخول" : "Last login", v: fmtDate(locale, user.last_login) },
            { k: isAr ? "تاريخ الإنشاء" : "Created", v: fmtDate(locale, user.created_at) },
            { k: isAr ? "خدمات" : "Services", v: String(user.services_count ?? 0) },
            { k: isAr ? "حجوزات" : "Bookings", v: String(user.bookings_count ?? 0) },
            { k: isAr ? "حراج" : "Haraj", v: String(user.haraj_count ?? 0) },
            { k: isAr ? "إعلانات" : "Ads", v: String(user.ads_count ?? 0) },
          ].map((item) => (
            <div
              key={item.k}
              style={{
                padding: 10,
                background: "#f8fafc",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>{item.k}</div>
              <div style={{ fontWeight: 800, marginTop: 4, wordBreak: "break-word" }}>{item.v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            style={suspended ? btnPrimary : btnWarn}
            disabled={busy}
            onClick={() => runAction(suspended ? "activate" : "suspend")}
          >
            {suspended ? (isAr ? "تفعيل الحساب" : "Activate") : isAr ? "إيقاف الحساب" : "Suspend"}
          </button>
          <button
            type="button"
            style={btn}
            disabled={busy}
            onClick={() => runAction(verified ? "unverify" : "verify")}
          >
            {verified
              ? isAr
                ? "إلغاء التوثيق"
                : "Unverify"
              : isAr
                ? "توثيق الحساب"
                : "Verify"}
          </button>
          <button
            type="button"
            style={btn}
            disabled={busy}
            onClick={() => runAction("reset_password")}
          >
            {isAr ? "رابط استعادة كلمة المرور" : "Password reset link"}
          </button>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontWeight: 700,
              }}
            >
              <option value="customer">{isAr ? "عميل" : "Customer"}</option>
              <option value="provider">{isAr ? "مزوّد" : "Provider"}</option>
              <option value="admin">{isAr ? "مشرف (profiles.role)" : "Admin (profiles.role)"}</option>
            </select>
            <button
              type="button"
              style={btnPrimary}
              disabled={busy}
              onClick={() => runAction("set_role", { role })}
            >
              {isAr ? "تغيير النوع" : "Change role"}
            </button>
          </div>
          <button type="button" style={btnDanger} disabled={busy} onClick={() => runAction("delete")}>
            {isAr ? "حذف الحساب" : "Delete"}
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 13, fontWeight: 700 }}>
          <Link href={localeHref(locale, "/admin/services")} style={{ color: "#334155" }}>
            {isAr ? "← خدمات الإدارة" : "← Admin services"}
          </Link>
          <Link href={localeHref(locale, "/admin/haraj")} style={{ color: "#334155" }}>
            {isAr ? "← الحراج" : "← Haraj"}
          </Link>
          <Link href={localeHref(locale, "/admin/requests")} style={{ color: "#334155" }}>
            {isAr ? "← الطلبات" : "← Requests"}
          </Link>
          <Link href={localeHref(locale, "/admin/flags")} style={{ color: "#334155" }}>
            {isAr ? "← البلاغات" : "← Reports"}
          </Link>
        </div>

        {flash ? (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              fontWeight: 700,
              fontSize: 13,
              wordBreak: "break-all",
            }}
          >
            {flash}
          </div>
        ) : null}
      </div>

      <Section
        title={isAr ? "الخدمات" : "Services"}
        empty={related.services.length === 0}
        isAr={isAr}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "العنوان" : "Title"}</th>
                <th style={adminThStyle}>{isAr ? "المراجعة" : "Moderation"}</th>
                <th style={adminThStyle}>{isAr ? "نشط" : "Active"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {related.services.map((s) => (
                <tr key={s.id}>
                  <td style={adminTdStyle}>{s.title || s.id}</td>
                  <td style={adminTdStyle}>{s.moderation_status || "—"}</td>
                  <td style={adminTdStyle}>
                    {s.is_active ? (isAr ? "نعم" : "Yes") : isAr ? "لا" : "No"}
                  </td>
                  <td style={adminTdStyle}>{fmtDate(locale, s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title={isAr ? "الحجوزات" : "Bookings"}
        empty={related.bookings.length === 0}
        isAr={isAr}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "رقم" : "#"}</th>
                <th style={adminThStyle}>{isAr ? "الحالة" : "Status"}</th>
                <th style={adminThStyle}>{isAr ? "الموعد" : "Scheduled"}</th>
                <th style={adminThStyle}>{isAr ? "أُنشئ" : "Created"}</th>
              </tr>
            </thead>
            <tbody>
              {related.bookings.map((b) => (
                <tr key={b.id}>
                  <td style={adminTdStyle}>{b.booking_number || b.id.slice(0, 8)}</td>
                  <td style={adminTdStyle}>{b.status || "—"}</td>
                  <td style={adminTdStyle}>{fmtDate(locale, b.scheduled_at)}</td>
                  <td style={adminTdStyle}>{fmtDate(locale, b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title={isAr ? "إعلانات الحراج" : "Haraj ads"}
        empty={related.haraj.length === 0}
        isAr={isAr}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "العنوان" : "Title"}</th>
                <th style={adminThStyle}>{isAr ? "السعر" : "Price"}</th>
                <th style={adminThStyle}>{isAr ? "المدينة" : "City"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
                <th style={adminThStyle}>{isAr ? "رابط" : "Link"}</th>
              </tr>
            </thead>
            <tbody>
              {related.haraj.map((h) => (
                <tr key={h.id}>
                  <td style={adminTdStyle}>{h.title || "—"}</td>
                  <td style={adminTdStyle}>{h.price || "—"}</td>
                  <td style={adminTdStyle}>{h.city || "—"}</td>
                  <td style={adminTdStyle}>{fmtDate(locale, h.created_at)}</td>
                  <td style={adminTdStyle}>
                    <Link href={localeHref(locale, `/haraj/${h.id}`)} style={{ fontWeight: 700 }}>
                      {isAr ? "فتح" : "Open"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={isAr ? "الإعلانات" : "Ads"} empty={related.ads.length === 0} isAr={isAr}>
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "العنوان" : "Title"}</th>
                <th style={adminThStyle}>{isAr ? "الحالة" : "Status"}</th>
                <th style={adminThStyle}>{isAr ? "المدينة" : "City"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {related.ads.map((a) => (
                <tr key={a.id}>
                  <td style={adminTdStyle}>{a.title || "—"}</td>
                  <td style={adminTdStyle}>{a.status || "—"}</td>
                  <td style={adminTdStyle}>{a.city || "—"}</td>
                  <td style={adminTdStyle}>{fmtDate(locale, a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title={isAr ? "البلاغات" : "Reports"}
        empty={related.reports.length === 0}
        isAr={isAr}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "الدور" : "Role"}</th>
                <th style={adminThStyle}>{isAr ? "النوع" : "Type"}</th>
                <th style={adminThStyle}>{isAr ? "السبب" : "Reason"}</th>
                <th style={adminThStyle}>{isAr ? "الحالة" : "Status"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {related.reports.map((r) => (
                <tr key={`${r.id}-${r.as_reporter}`}>
                  <td style={adminTdStyle}>
                    {r.as_reporter
                      ? isAr
                        ? "مبلّغ"
                        : "Reporter"
                      : isAr
                        ? "هدف"
                        : "Target"}
                  </td>
                  <td style={adminTdStyle}>{r.target_type || "—"}</td>
                  <td style={adminTdStyle}>
                    <Link
                      href={localeHref(locale, `/admin/flags/${r.id}`)}
                      style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}
                    >
                      {(r.reason || "—").slice(0, 80)}
                    </Link>
                  </td>
                  <td style={adminTdStyle}>{r.status || "—"}</td>
                  <td style={adminTdStyle}>{fmtDate(locale, r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title={isAr ? "سجل نشاط الإدارة" : "Admin activity log"}
        empty={related.activity.length === 0}
        isAr={isAr}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>{isAr ? "الإجراء" : "Action"}</th>
                <th style={adminThStyle}>{isAr ? "المشرف" : "Admin"}</th>
                <th style={adminThStyle}>{isAr ? "قبل" : "Before"}</th>
                <th style={adminThStyle}>{isAr ? "بعد" : "After"}</th>
                <th style={adminThStyle}>{isAr ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {related.activity.map((a) => (
                <tr key={a.id}>
                  <td style={adminTdStyle}>{a.action || "—"}</td>
                  <td style={adminTdStyle}>{a.admin_username || "—"}</td>
                  <td style={adminTdStyle}>{a.before_status || "—"}</td>
                  <td style={adminTdStyle}>{a.after_status || "—"}</td>
                  <td style={adminTdStyle}>{fmtDate(locale, a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
