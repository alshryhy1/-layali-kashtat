"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  adminTableStyle,
  adminThStyle,
  adminTdStyle,
  AdminEmptyState,
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

function fmtDate(locale: string, v: string | null | undefined) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
  } catch {
    return String(v);
  }
}

function csvEscape(v: string | number | null | undefined) {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const btn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 800,
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
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

const selectStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  fontWeight: 700,
  fontSize: 13,
  background: "#fff",
};

const inputStyle: React.CSSProperties = {
  ...selectStyle,
  minWidth: 200,
  flex: "1 1 220px",
};

export default function AdminUsersClient({
  locale,
  initialUsers,
  initialQ = "",
  initialVerified = "all",
  initialRole = "all",
  initialStatus = "all",
}: {
  locale: Locale;
  initialUsers: AdminUserRow[];
  initialQ?: string;
  initialVerified?: string;
  initialRole?: string;
  initialStatus?: string;
}) {
  const isAr = locale === "ar";
  const router = useRouter();
  const [users, setUsers] = React.useState(initialUsers);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [busy, setBusy] = React.useState(false);
  const [flash, setFlash] = React.useState("");
  const [q, setQ] = React.useState(initialQ);
  const [verified, setVerified] = React.useState(initialVerified);
  const [role, setRole] = React.useState(initialRole);
  const [status, setStatus] = React.useState(initialStatus);

  React.useEffect(() => {
    setUsers(initialUsers);
    setSelected({});
  }, [initialUsers]);

  const selectedIds = React.useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected]
  );

  const allChecked = users.length > 0 && selectedIds.length === users.length;

  function pushFilters(next: { q?: string; verified?: string; role?: string; status?: string }) {
    const params = new URLSearchParams();
    const qq = next.q ?? q;
    const vv = next.verified ?? verified;
    const rr = next.role ?? role;
    const ss = next.status ?? status;
    if (qq.trim()) params.set("q", qq.trim());
    if (vv !== "all") params.set("verified", vv);
    if (rr !== "all") params.set("role", rr);
    if (ss !== "all") params.set("status", ss);
    const qs = params.toString();
    router.push(localeHref(locale, `/admin/users${qs ? `?${qs}` : ""}`));
  }

  async function runAction(
    action: string,
    ids: string[],
    extra?: { role?: string }
  ): Promise<boolean> {
    if (!ids.length) return false;
    if (action === "delete") {
      const ok = window.confirm(
        isAr
          ? `تأكيد حذف ${ids.length} حساب؟ هذا الإجراء غير قابل للتراجع بسهولة.`
          : `Delete ${ids.length} account(s)? This may be hard to undo.`
      );
      if (!ok) return false;
    }
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch("/api/admin/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids,
          action,
          role: extra?.role,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      if (json.recoveryLink) {
        setFlash(
          isAr
            ? `تم إنشاء رابط استعادة: ${json.recoveryLink}`
            : `Recovery link: ${json.recoveryLink}`
        );
        try {
          await navigator.clipboard.writeText(String(json.recoveryLink));
        } catch {
          /* ignore */
        }
      } else if (typeof json.done === "number") {
        setFlash(
          isAr
            ? `تم تنفيذ الإجراء على ${json.done} حساب`
            : `Action applied to ${json.done} account(s)`
        );
      } else {
        setFlash(isAr ? "تم التنفيذ" : "Done");
      }
      router.refresh();
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setFlash(isAr ? `فشل: ${msg}` : `Failed: ${msg}`);
      return false;
    } finally {
      setBusy(false);
      window.setTimeout(() => setFlash(""), 5000);
    }
  }

  function exportCsv(rows: AdminUserRow[]) {
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
      "services_count",
      "bookings_count",
      "haraj_count",
      "ads_count",
      "last_login",
      "created_at",
    ];
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
          r.services_count,
          r.bookings_count,
          r.haraj_count,
          r.ads_count,
          r.last_login,
          r.created_at,
        ]
          .map(csvEscape)
          .join(",")
      );
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `layali-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const exportRows =
    selectedIds.length > 0 ? users.filter((u) => selected[u.id]) : users;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") pushFilters({ q });
          }}
          placeholder={isAr ? "بحث بالاسم / الجوال / المعرف" : "Search name / phone / id"}
          style={inputStyle}
        />
        <select
          value={verified}
          onChange={(e) => {
            setVerified(e.target.value);
            pushFilters({ verified: e.target.value });
          }}
          style={selectStyle}
        >
          <option value="all">{isAr ? "الكل (تحقق)" : "All verification"}</option>
          <option value="verified">{isAr ? "موثّق" : "Verified"}</option>
          <option value="unverified">{isAr ? "غير موثّق" : "Unverified"}</option>
        </select>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            pushFilters({ role: e.target.value });
          }}
          style={selectStyle}
        >
          <option value="all">{isAr ? "كل الأنواع" : "All roles"}</option>
          <option value="customer">{isAr ? "عميل" : "Customer"}</option>
          <option value="provider">{isAr ? "مزوّد" : "Provider"}</option>
          <option value="admin">{isAr ? "مشرف" : "Admin"}</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            pushFilters({ status: e.target.value });
          }}
          style={selectStyle}
        >
          <option value="all">{isAr ? "كل الحالات" : "All statuses"}</option>
          <option value="active">{isAr ? "نشط" : "Active"}</option>
          <option value="suspended">{isAr ? "موقوف" : "Suspended"}</option>
        </select>
        <button type="button" style={btnPrimary} disabled={busy} onClick={() => pushFilters({})}>
          {isAr ? "تطبيق" : "Apply"}
        </button>
        <button type="button" style={btn} disabled={busy} onClick={() => exportCsv(exportRows)}>
          {isAr
            ? `تصدير CSV (${exportRows.length})`
            : `Export CSV (${exportRows.length})`}
        </button>
        <Link
          href={localeHref(locale, "/admin/settings")}
          style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}
        >
          {isAr ? "إدارة المشرفين ←" : "Manage admins →"}
        </Link>
      </div>

      {selectedIds.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            padding: 12,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 13 }}>
            {isAr ? `محدد: ${selectedIds.length}` : `Selected: ${selectedIds.length}`}
          </span>
          <button
            type="button"
            style={btnPrimary}
            disabled={busy}
            onClick={() => runAction("verify", selectedIds)}
          >
            {isAr ? "توثيق جماعي" : "Bulk verify"}
          </button>
          <button
            type="button"
            style={btnWarn}
            disabled={busy}
            onClick={() => runAction("suspend", selectedIds)}
          >
            {isAr ? "إيقاف جماعي" : "Bulk suspend"}
          </button>
          <button
            type="button"
            style={btn}
            disabled={busy}
            onClick={() => runAction("activate", selectedIds)}
          >
            {isAr ? "تفعيل جماعي" : "Bulk activate"}
          </button>
          <button
            type="button"
            style={btnDanger}
            disabled={busy}
            onClick={() => runAction("delete", selectedIds)}
          >
            {isAr ? "حذف جماعي" : "Bulk delete"}
          </button>
        </div>
      ) : null}

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

      {users.length === 0 ? (
        <AdminEmptyState isAr={isAr} />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={adminTableStyle}>
            <thead>
              <tr>
                <th style={adminThStyle}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const next: Record<string, boolean> = {};
                        for (const u of users) next[u.id] = true;
                        setSelected(next);
                      } else {
                        setSelected({});
                      }
                    }}
                  />
                </th>
                <th style={adminThStyle}>{isAr ? "عضوية" : "Member #"}</th>
                <th style={adminThStyle}>{isAr ? "الاسم" : "Name"}</th>
                <th style={adminThStyle}>{isAr ? "النوع" : "Type"}</th>
                <th style={adminThStyle}>{isAr ? "المدينة" : "City"}</th>
                <th style={adminThStyle}>{isAr ? "الجوال" : "Phone"}</th>
                <th style={adminThStyle}>{isAr ? "التحقق" : "Verified"}</th>
                <th style={adminThStyle}>{isAr ? "الحالة" : "Status"}</th>
                <th style={adminThStyle}>{isAr ? "خدمات" : "Services"}</th>
                <th style={adminThStyle}>{isAr ? "حجوزات" : "Bookings"}</th>
                <th style={adminThStyle}>{isAr ? "آخر دخول" : "Last login"}</th>
                <th style={adminThStyle}>{isAr ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((r) => {
                const suspended = isSuspended(r.banned_until);
                const verifiedRow = isVerified(r);
                return (
                  <tr key={r.id}>
                    <td style={adminTdStyle}>
                      <input
                        type="checkbox"
                        checked={!!selected[r.id]}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [r.id]: e.target.checked }))
                        }
                      />
                    </td>
                    <td style={{ ...adminTdStyle, fontFamily: "monospace", fontSize: 12 }}>
                      {membershipId(r.id)}
                    </td>
                    <td style={adminTdStyle}>
                      <Link
                        href={localeHref(locale, `/admin/users/${r.id}`)}
                        style={{ fontWeight: 800, color: "#0f172a", textDecoration: "underline" }}
                      >
                        {r.name || "—"}
                      </Link>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {r.email || "—"}
                      </div>
                    </td>
                    <td style={adminTdStyle}>{roleLabel(isAr, r.role)}</td>
                    <td style={adminTdStyle}>{r.city || "—"}</td>
                    <td style={adminTdStyle}>{r.phone || "—"}</td>
                    <td style={adminTdStyle}>
                      {verifiedRow ? (isAr ? "موثّق" : "Yes") : isAr ? "غير موثّق" : "No"}
                    </td>
                    <td style={adminTdStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 800,
                          background: suspended ? "#fef2f2" : "#ecfdf5",
                          color: suspended ? "#991b1b" : "#065f46",
                        }}
                      >
                        {statusLabel(isAr, r.banned_until)}
                      </span>
                    </td>
                    <td style={adminTdStyle}>{r.services_count ?? 0}</td>
                    <td style={adminTdStyle}>{r.bookings_count ?? 0}</td>
                    <td style={adminTdStyle}>{fmtDate(locale, r.last_login)}</td>
                    <td style={adminTdStyle}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <Link
                          href={localeHref(locale, `/admin/users/${r.id}`)}
                          style={{ ...btn, textDecoration: "none", display: "inline-block" }}
                        >
                          {isAr ? "عرض" : "View"}
                        </Link>
                        <button
                          type="button"
                          style={suspended ? btnPrimary : btnWarn}
                          disabled={busy}
                          onClick={() => runAction(suspended ? "activate" : "suspend", [r.id])}
                        >
                          {suspended
                            ? isAr
                              ? "تفعيل"
                              : "Activate"
                            : isAr
                              ? "إيقاف"
                              : "Suspend"}
                        </button>
                        <button
                          type="button"
                          style={btn}
                          disabled={busy}
                          onClick={() => runAction(verifiedRow ? "unverify" : "verify", [r.id])}
                        >
                          {verifiedRow
                            ? isAr
                              ? "إلغاء توثيق"
                              : "Unverify"
                            : isAr
                              ? "توثيق"
                              : "Verify"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
        {isAr
          ? "ملاحظة: رقم العضوية مشتق من معرّف الحساب (لا عمود membership منفصل). المدينة من آخر خدمة للمزوّد إن وُجدت. الإيقاف عبر auth.users.banned_until."
          : "Note: membership # is derived from UUID (no dedicated column). City comes from latest provider service when present. Suspend uses auth.users.banned_until."}
      </p>
    </div>
  );
}
