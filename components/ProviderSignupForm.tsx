"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { createProviderRequest } from "@/app/actions/providerRequests";

type ActionType = typeof createProviderRequest;
type State = { ok: boolean; message: string } | null;

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: pending ? "#f3f3f3" : "#111",
        color: pending ? "#666" : "#fff",
        fontWeight: 700,
        cursor: pending ? "not-allowed" : "pointer",
      }}
    >
      {pending ? "جاري الإرسال..." : "إرسال الطلب"}
    </button>
  );
}

export default function ProviderSignupForm({
  action,
}: {
  action: ActionType;
}) {
  const [state, formAction] = useFormState<State, FormData>(action as any, null);

  return (
    <form
      action={formAction}
      style={{
        maxWidth: 520,
        margin: "24px auto",
        padding: 16,
        border: "1px solid #e5e5e5",
        borderRadius: 14,
      }}
    >
      <div style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>الاسم</span>
          <input
            name="name"
            required
            placeholder="اسم مقدم الخدمة"
            style={{
              padding: "12px",
              borderRadius: 10,
              border: "1px solid #ddd",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>رقم الجوال</span>
          <input
            name="phone"
            required
            inputMode="tel"
            placeholder="05xxxxxxxx"
            style={{
              padding: "12px",
              borderRadius: 10,
              border: "1px solid #ddd",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>نوع الخدمة</span>
          <input
            name="service_type"
            required
            placeholder="مثال: شاليه / مخيم / تجهيزات"
            style={{
              padding: "12px",
              borderRadius: 10,
              border: "1px solid #ddd",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>المدينة</span>
          <input
            name="city"
            required
            placeholder="الرياض / جدة ..."
            style={{
              padding: "12px",
              borderRadius: 10,
              border: "1px solid #ddd",
            }}
          />
        </label>

        <SubmitBtn />

        {state?.message ? (
          <div
            style={{
              marginTop: 8,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: state.ok ? "#f0fff4" : "#fff5f5",
              color: "#111",
              fontWeight: 600,
            }}
          >
            {state.message}
          </div>
        ) : null}
      </div>
    </form>
  );
}
