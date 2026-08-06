"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { localeHref, type Locale } from "@/lib/locales";

const ACTIVE_STATUSES = ["confirmed", "in_progress"] as const;

async function resolveActiveBookingId(uid: string): Promise<string | null> {
  const rCustomer = await supabase
    .from("bookings")
    .select("id, end_at, scheduled_at")
    .eq("customer_id", uid)
    .in("status", [...ACTIVE_STATUSES])
    .order("created_at", { ascending: false })
    .limit(10);

  const pick = (rows: unknown): string | null => {
    const list = Array.isArray(rows) ? rows : [];
    for (const row of list as Array<{ id?: string; end_at?: string; scheduled_at?: string }>) {
      if (!row?.id) continue;
      const timeGuard = row.end_at ?? row.scheduled_at ?? null;
      if (!timeGuard) return String(row.id);
      const t = new Date(String(timeGuard)).getTime();
      if (Number.isFinite(t) && t >= Date.now()) return String(row.id);
    }
    return null;
  };

  const cid = pick(rCustomer.data);
  if (cid) return cid;

  const psRes = await supabase.from("provider_services").select("id").eq("user_id", uid);
  const serviceIds = ((psRes.data ?? []) as Array<{ id?: string }>)
    .map((r) => r.id)
    .filter((x): x is string => typeof x === "string");

  if (!serviceIds.length) return null;

  const rProvider = await supabase
    .from("bookings")
    .select("id, end_at, scheduled_at")
    .in("provider_service_id", serviceIds)
    .in("status", [...ACTIVE_STATUSES])
    .order("created_at", { ascending: false })
    .limit(10);

  return pick(rProvider.data);
}

async function getNoBookingMessage(uid: string): Promise<string> {
  const activeBookingId = await resolveActiveBookingId(uid);
  if (activeBookingId) return "لديك محادثة مرتبطة بحجز نشط";

  const profileRoleRes = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
  const rawRole =
    ((profileRoleRes.data as { role?: string } | null)?.role as string | null)?.toLowerCase() ?? null;

  const providerServicesRes = await supabase
    .from("provider_services")
    .select("id")
    .eq("user_id", uid)
    .limit(1);
  const providerServiceIds = ((providerServicesRes.data ?? []) as Array<{ id?: string }>)
    .map((r) => r.id)
    .filter((v): v is string => typeof v === "string");

  const isProviderRole =
    rawRole === "provider" ||
    rawRole === "vendor" ||
    rawRole === "service_provider" ||
    providerServiceIds.length > 0;

  const anyCustomerBooking = await supabase
    .from("bookings")
    .select("id")
    .eq("customer_id", uid)
    .limit(1)
    .maybeSingle();
  const hasCustomerBookings = !!anyCustomerBooking.data;

  const treatsAsCustomer =
    rawRole === "customer" || rawRole === "user" || !rawRole || hasCustomerBookings;

  const unified = isProviderRole && treatsAsCustomer && providerServiceIds.length > 0;
  if (unified) return "لا يوجد لديك طلب أو عرض نشط حالياً";
  if (isProviderRole) return "لا يوجد لديك عرض نشط حالياً";
  return "لا يوجد لديك طلب نشط حالياً";
}

/** Matches native ChatInboxScreen (UI + status). ConversationScreen is not on web yet. */
export default function ChatInboxClient({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [opening, setOpening] = React.useState(false);
  const [message, setMessage] = React.useState("جاري تجهيز المحادثات...");
  const [sessionUid, setSessionUid] = React.useState<string | null>(null);
  const [openNotice, setOpenNotice] = React.useState<string | null>(null);

  const loadState = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id ?? null;
    setSessionUid(uid);

    if (!uid) {
      setMessage("سجّل الدخول لعرض محادثاتك");
      setLoading(false);
      return;
    }

    const msg = await getNoBookingMessage(uid);
    setMessage(msg);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void loadState();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void loadState();
    });
    return () => sub.subscription.unsubscribe();
  }, [loadState]);

  const openActiveConversation = async () => {
    if (opening) return;
    setOpening(true);
    setOpenNotice(null);
    try {
      if (!sessionUid) {
        router.push(localeHref(locale, "/account?view=login"));
        return;
      }
      const bookingId = await resolveActiveBookingId(sessionUid);
      if (!bookingId) {
        // Same as native: button stays; flow no-ops when no booking.
        return;
      }
      // ConversationScreen غير موجود على الويب — لا نخترع واجهة محادثة.
      setOpenNotice(
        "تعذّر فتح شاشة المحادثة على الويب حالياً (ConversationScreen غير منقولة بعد). استخدم التطبيق."
      );
    } finally {
      setOpening(false);
    }
  };

  return (
    <div dir="rtl" style={S.page}>
      <div style={S.heroCard}>
        <h1 style={S.title}>المحادثات</h1>
        <p style={S.subtitle}>تابع محادثتك المرتبطة بالحجز النشط من مكان واحد.</p>

        <div style={S.activeChatCard}>
          <div style={S.activeChatIcon}>💬</div>
          <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
            <div style={S.activeChatTitle}>المحادثة النشطة</div>
            {loading ? (
              <div style={{ marginTop: 8, fontWeight: 800, color: "#102A43" }}>جاري التحقق...</div>
            ) : (
              <div style={S.message}>{message}</div>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={opening}
          onClick={() => void openActiveConversation()}
          style={{ ...S.button, opacity: opening ? 0.7 : 1 }}
        >
          {opening ? "..." : "فتح المحادثة النشطة"}
        </button>

        {openNotice ? <div style={S.notice}>{openNotice}</div> : null}
      </div>

      <div style={S.infoCard}>
        <div style={S.infoTitle}>متى تظهر المحادثة؟</div>
        <div style={S.infoText}>
          تظهر المحادثة عند وجود حجز مؤكد أو جارٍ، وتبقى مرتبطة بنفس رقم الحجز لتسهيل التواصل.
        </div>
      </div>

      <div style={S.featuresCard}>
        <div style={S.featuresTitle}>ماذا يمكنك داخل المحادثة؟</div>
        <div style={S.featureRow}>
          <span>💬</span>
          <span>إرسال رسائل نصية مرتبطة بالحجز.</span>
        </div>
        <div style={S.featureRow}>
          <span>📷</span>
          <span>إرفاق صور وتفاصيل عند الحاجة.</span>
        </div>
        <div style={S.featureRow}>
          <span>📍</span>
          <span>متابعة الحجز والتواصل من نفس المكان.</span>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 520,
    margin: "0 auto",
    paddingTop: 64,
    paddingRight: 18,
    paddingBottom: 24,
    paddingLeft: 18,
    background: "#EFE3D2",
    minHeight: "100vh",
    boxSizing: "border-box",
    display: "grid",
    gap: 14,
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  heroCard: {
    borderRadius: 24,
    background: "#F7EFE4",
    border: "1px solid #E2CFB7",
    padding: 20,
    boxShadow: "0 6px 14px rgba(61,41,24,0.08)",
  },
  title: { margin: 0, color: "#102A43", fontSize: 26, fontWeight: 900, textAlign: "right" },
  subtitle: {
    marginTop: 8,
    marginBottom: 0,
    color: "#52606D",
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.6,
    textAlign: "right",
  },
  activeChatCard: {
    marginTop: 22,
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    border: "1px solid #E2CFB7",
    background: "#FFF8EC",
    padding: 14,
  },
  activeChatIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    background: "#E8F3EF",
    display: "grid",
    placeItems: "center",
    fontSize: 24,
    flexShrink: 0,
  },
  activeChatTitle: { color: "#102A43", fontSize: 17, fontWeight: 900 },
  message: {
    marginTop: 8,
    color: "#102A43",
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.6,
  },
  button: {
    marginTop: 18,
    width: "100%",
    minHeight: 52,
    borderRadius: 18,
    background: "#0F7A3A",
    color: "#fff",
    fontSize: 16,
    fontWeight: 900,
    border: "none",
    cursor: "pointer",
  },
  notice: {
    marginTop: 12,
    background: "#FFF8E7",
    border: "1px solid #E6D6C4",
    borderRadius: 12,
    padding: 10,
    color: "#7A4E19",
    fontWeight: 700,
    fontSize: 13,
    lineHeight: 1.55,
  },
  infoCard: {
    borderRadius: 22,
    background: "#FBF3E8",
    border: "1px solid #E2CFB7",
    padding: 18,
  },
  infoTitle: { color: "#102A43", fontSize: 18, fontWeight: 900, textAlign: "right" },
  infoText: {
    marginTop: 8,
    color: "#52606D",
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.6,
    textAlign: "right",
  },
  featuresCard: {
    borderRadius: 22,
    background: "#FFF8EC",
    border: "1px solid #E2CFB7",
    padding: 18,
    display: "grid",
    gap: 12,
  },
  featuresTitle: { color: "#102A43", fontSize: 18, fontWeight: 900, textAlign: "right" },
  featureRow: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
    color: "#52606D",
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.55,
    textAlign: "right",
  },
};
