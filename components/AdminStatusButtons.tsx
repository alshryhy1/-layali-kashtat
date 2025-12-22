"use client";

import * as React from "react";

type Locale = "ar" | "en";
type Status = "pending" | "approved" | "rejected";

type Props = {
  locale: Locale;
  id: string;
  currentStatus: string;
  action: (formData: FormData) => void | Promise<void>;
};

function normalizeStatus(v: string): Status {
  const s = String(v || "").trim().toLowerCase();
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  return "pending";
}

function confirmMsg(locale: Locale, to: Status) {
  const isAr = locale === "ar";
  if (!isAr) {
    if (to === "approved") return "Confirm: change status to APPROVED?";
    if (to === "rejected") return "Confirm: change status to REJECTED?";
    return "Confirm: change status back to PENDING?";
  }
  if (to === "approved") return "تأكيد: تغيير الحالة إلى (مقبول)؟";
  if (to === "rejected") return "تأكيد: تغيير الحالة إلى (مرفوض)؟";
  return "تأكيد: إعادة الحالة إلى (انتظار)؟";
}

function ButtonForm({
  action,
  id,
  locale,
  to,
  label,
  style,
}: {
  action: Props["action"];
  id: string;
  locale: Locale;
  to: Status;
  label: string;
  style: React.CSSProperties;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const ok = window.confirm(confirmMsg(locale, to));
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={to} />
      <button type="submit" style={style}>
        {label}
      </button>
    </form>
  );
}

export default function AdminStatusButtons({ locale, id, currentStatus, action }: Props) {
  const st = normalizeStatus(currentStatus);

  const isAr = locale === "ar";

  const wrap: React.CSSProperties = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  };

  const okBtn: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #0a0",
    background: "#0a0",
    color: "#fff",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const noBtn: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #b00",
    background: "#fff",
    color: "#b00",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const neutralBtn: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #999",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  if (st === "pending") {
    return (
      <div style={wrap}>
        <ButtonForm
          action={action}
          id={id}
          locale={locale}
          to="approved"
          label={isAr ? "قبول" : "Approve"}
          style={okBtn}
        />
        <ButtonForm
          action={action}
          id={id}
          locale={locale}
          to="rejected"
          label={isAr ? "رفض" : "Reject"}
          style={noBtn}
        />
      </div>
    );
  }

  if (st === "approved") {
    return (
      <div style={wrap}>
        <ButtonForm
          action={action}
          id={id}
          locale={locale}
          to="rejected"
          label={isAr ? "تحويل لمرفوض" : "Set Rejected"}
          style={noBtn}
        />
        <ButtonForm
          action={action}
          id={id}
          locale={locale}
          to="pending"
          label={isAr ? "إرجاع لانتظار" : "Back to Pending"}
          style={neutralBtn}
        />
      </div>
    );
  }

  return (
    <div style={wrap}>
      <ButtonForm
        action={action}
        id={id}
        locale={locale}
        to="approved"
        label={isAr ? "تحويل لمقبول" : "Set Approved"}
        style={okBtn}
      />
      <ButtonForm
        action={action}
        id={id}
        locale={locale}
        to="pending"
        label={isAr ? "إرجاع لانتظار" : "Back to Pending"}
        style={neutralBtn}
      />
    </div>
  );
}
