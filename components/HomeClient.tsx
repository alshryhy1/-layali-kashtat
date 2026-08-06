"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { localeHref, type Locale } from "@/lib/locales";

type FeedItem = {
  serviceId: string;
  title: string | null;
  cityName: string | null;
  serviceTypeName: string | null;
  providerName: string | null;
  providerImageUrl: string | null;
  sameCity: boolean;
  distanceKm: number | null;
  bookingCount?: number;
};

type SmartResult = {
  provider_service?: { id?: string; title?: string };
  provider?: { name?: string; distance_km?: number };
  package?: { option_label?: string; price?: number; currency?: string };
};

const IDEA_CHIPS = [
  { key: "kashta", label: "كشتات", match: "كشت" },
  { key: "camp", label: "مخيمات", match: "مخيم" },
  { key: "farm", label: "مزارع", match: "مزرع" },
  { key: "event", label: "فعاليات", match: "فعال" },
] as const;

const TICKER_FALLBACKS = [
  "🎉 ابدأ رحلتك من هنا — اكتب نيتك ونطابقك بمزوّد",
  "📢 مزوّدون يستقبلون طلبات الآن",
  "⭐ اكتشف الأكثر طلبًا في منطقتك",
  "📢 نشاط حي على المنصة — تابع آخر الإضافات",
];

function toNum(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeRemoteUri(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/^[`'"]+/, "").replace(/[`'"]+$/, "").trim();
  if (!cleaned) return null;
  if (cleaned.startsWith("//")) return `https:${cleaned}`;
  if (cleaned.startsWith("http://")) return `https://${cleaned.slice("http://".length)}`;
  if (cleaned.startsWith("https://")) return cleaned;
  return null;
}

function hasBronzeMinPrice(
  service: { starting_price?: number | null; base_price?: number | null },
  packages: Array<{ price?: number | null; is_active?: boolean | null }>
): boolean {
  const fromService = toNum(service.starting_price) ?? toNum(service.base_price);
  if (fromService != null && fromService > 0) return true;
  for (const p of packages) {
    if (p.is_active === false) continue;
    const price = toNum(p.price);
    if (price != null && price > 0) return true;
  }
  return false;
}

function isBronzeMarketListable(input: {
  isActive: boolean;
  hasImage: boolean;
  hasTitle?: boolean;
  hasProviderImage?: boolean;
  service: { starting_price?: number | null; base_price?: number | null };
  packages: Array<{ price?: number | null; is_active?: boolean | null }>;
}): boolean {
  if (!input.isActive) return false;
  const hasTitle = input.hasTitle === true;
  const hasVisual = input.hasImage || input.hasProviderImage === true;
  if (!hasVisual && !hasTitle) return false;
  return hasBronzeMinPrice(input.service, input.packages);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function weatherIcon(line: string): string {
  const t = line.toLowerCase();
  if (t.includes("مطر") || t.includes("rain")) return "🌧️";
  if (t.includes("ثلج") || t.includes("snow")) return "❄️";
  if (t.includes("غائم") || t.includes("cloud")) return "☁️";
  if (t.includes("عاصف") || t.includes("wind")) return "💨";
  return "☀️";
}

function nameFromAuthUser(user: { user_metadata?: Record<string, unknown> } | null | undefined): string | null {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  for (const key of ["full_name", "name", "display_name"]) {
    const v = meta[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

type AuthSessionLike = {
  access_token?: string;
  user?: { id?: string; user_metadata?: Record<string, unknown> };
} | null;

const C = {
  bg: "#EFE3D2",
  navy: "#173B5B",
  muted: "#5B6774",
  clock: "#111827",
  avatarBg: "#D8C0A3",
  avatarBorder: "#C8954D",
  bannerBg: "#3B2513",
  bannerBorder: "#D6A21E",
  bannerText: "#E8D8B5",
  weatherTitle: "#8A6B3E",
  weatherBar: "#F7EFE5",
  weatherBorder: "#D9C49F",
  gold: "#B8860B",
  suggestion: "#173B5B",
  cardBg: "#FFFBF5",
  cardBorder: "#E8DCC8",
  inputBg: "#FFF8EC",
  inputBorder: "#E2CFB7",
};

/** Native HomeScreen V5 — guest + signed-in customer/provider layout. */
export default function HomeClient({
  locale,
  initialWeatherText,
}: {
  locale: Locale;
  initialWeatherText?: string | null;
}) {
  const router = useRouter();
  // null until mount — avoids SSR/client second mismatch on the live clock
  const [clock, setClock] = React.useState<Date | null>(null);
  const [sessionUid, setSessionUid] = React.useState<string | null>(null);
  const [displayName, setDisplayName] = React.useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | null>(null);
  const [feed, setFeed] = React.useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = React.useState(true);
  const [feedEmptyHint, setFeedEmptyHint] = React.useState("حاول لاحقًا أو وسّع نطاق البحث.");
  const [ideaFilter, setIdeaFilter] = React.useState<string | null>(null);
  const [smartText, setSmartText] = React.useState("");
  const [smartLoading, setSmartLoading] = React.useState(false);
  const [smartError, setSmartError] = React.useState<string | null>(null);
  const [smartResults, setSmartResults] = React.useState<SmartResult[]>([]);
  const [smartMatchSummary, setSmartMatchSummary] = React.useState<Record<string, unknown> | null>(
    null
  );
  const [suggestionOpen, setSuggestionOpen] = React.useState(false);
  const [suggestStep, setSuggestStep] = React.useState(0);
  const [persons, setPersons] = React.useState("");
  const [city, setCity] = React.useState("");
  const [when, setWhen] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [weatherLine, setWeatherLine] = React.useState<string | null>(initialWeatherText ?? null);
  const [tickerIdx, setTickerIdx] = React.useState(0);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<
    Array<{ id: string; title: string; body: string }>
  >([]);
  const [activeBookings, setActiveBookings] = React.useState<
    Array<{ id: string; title: string; otherParty: string; role: "customer" | "provider" }>
  >([]);
  const [serviceOpenNotice, setServiceOpenNotice] = React.useState<string | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const homeAuthGen = React.useRef(0);

  const refreshAdmin = React.useCallback(async (session: AuthSessionLike) => {
    try {
      const accessToken = session?.access_token ?? null;
      const statusRes = await fetch("/api/auth/status", {
        cache: "no-store",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      }).then((r) => r.json().catch(() => null));
      if (Boolean(statusRes?.isAdmin)) {
        setIsAdmin(true);
        return;
      }
      const uid = session?.user?.id ?? null;
      if (!uid) {
        setIsAdmin(false);
        return;
      }
      const profileRes = await supabase
        .from("profiles")
        .select("role")
        .eq("id", uid)
        .maybeSingle();
      const role = String((profileRes.data as { role?: string } | null)?.role ?? "")
        .trim()
        .toLowerCase();
      setIsAdmin(role === "admin");
    } catch {
      setIsAdmin(false);
    }
  }, []);

  React.useEffect(() => {
    setClock(new Date());
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => setTickerIdx((i) => (i + 1) % TICKER_FALLBACKS.length), 5000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    if (initialWeatherText) return;
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(`/api/weather?lang=${locale}`, { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!alive) return;
        if (data?.text) setWeatherLine(String(data.text));
        else if (data?.city != null && data?.temp != null)
          setWeatherLine(`${data.city} • ${data.temp}° • ${data.description || ""}`.trim());
        else setWeatherLine("الطقس غير متاح حالياً");
      } catch {
        if (alive) setWeatherLine("الطقس غير متاح حالياً");
      }
    })();
    return () => {
      alive = false;
    };
  }, [initialWeatherText, locale]);

  const loadFeed = React.useCallback(async (sessionOverride?: AuthSessionLike | undefined) => {
    const gen = ++homeAuthGen.current;
    const stillCurrent = () => gen === homeAuthGen.current;
    setFeedLoading(true);
    try {
      const session =
        sessionOverride !== undefined
          ? sessionOverride
          : (await supabase.auth.getSession()).data.session;
      if (!stillCurrent()) return;

      const uid = session?.user?.id ?? null;
      setSessionUid(uid);

      // Apply identity BEFORE geolocation so a slow/denied location prompt
      // cannot leave the header stuck as a guest while a later auth run finishes.
      if (uid) {
        setDisplayName(nameFromAuthUser(session?.user) ?? null);
        const profileRes = await supabase
          .from("profiles")
          .select("full_name, name, display_name")
          .eq("id", uid)
          .maybeSingle();
        if (!stillCurrent()) return;
        const p = (profileRes.data ?? {}) as Record<string, unknown>;
        const name =
          (typeof p.full_name === "string" && p.full_name.trim()) ||
          (typeof p.display_name === "string" && p.display_name.trim()) ||
          (typeof p.name === "string" && p.name.trim()) ||
          nameFromAuthUser(session?.user) ||
          null;
        setDisplayName(name);
        const imgRes = await supabase
          .from("profile_images")
          .select("image_url")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!stillCurrent()) return;
        setProfileImageUrl(normalizeRemoteUri((imgRes.data as { image_url?: string } | null)?.image_url));
      } else {
        setDisplayName(null);
        setProfileImageUrl(null);
        setUnreadCount(0);
        setNotifications([]);
        setActiveBookings([]);
      }

      let viewerLat: number | null = null;
      let viewerLng: number | null = null;
      let permissionDenied = false;
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 8000,
              maximumAge: 60_000,
            });
          });
          if (!stillCurrent()) return;
          viewerLat = pos.coords.latitude;
          viewerLng = pos.coords.longitude;
        } catch {
          if (!stillCurrent()) return;
          permissionDenied = true;
          setFeedEmptyHint("فعّل إذن الموقع من إعدادات المتصفح لعرض الخدمات الأقرب إليك.");
        }
      }

      if (uid) {
        const notifRes = await supabase
          .from("notifications")
          .select("id, title, body, read_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(20);
        if (!stillCurrent()) return;
        const rows = (notifRes.data ?? []) as Array<{
          id: string | number;
          title?: string;
          body?: string;
          read_at?: string | null;
        }>;
        setNotifications(
          rows.map((r) => ({
            id: String(r.id),
            title: String(r.title ?? ""),
            body: String(r.body ?? ""),
          }))
        );
        setUnreadCount(rows.filter((r) => !r.read_at).length);

        const bookingCards: Array<{
          id: string;
          title: string;
          otherParty: string;
          role: "customer" | "provider";
        }> = [];

        const custBookings = await supabase
          .from("bookings")
          .select("id, status, provider_service_id")
          .eq("customer_id", uid)
          .in("status", ["confirmed", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(5);

        for (const b of (custBookings.data ?? []) as Array<{
          id: string;
          provider_service_id?: string;
        }>) {
          if (!stillCurrent()) return;
          let title = "حجز نشط";
          let other = "المزوّد";
          if (b.provider_service_id) {
            const ps = await supabase
              .from("provider_services")
              .select("title, user_id")
              .eq("id", b.provider_service_id)
              .maybeSingle();
            const psData = ps.data as { title?: string; user_id?: string } | null;
            title = String(psData?.title ?? title);
            if (psData?.user_id) {
              const pn = await supabase
                .from("profiles")
                .select("full_name, name")
                .eq("id", psData.user_id)
                .maybeSingle();
              const pnData = pn.data as { full_name?: string; name?: string } | null;
              other = String(pnData?.full_name || pnData?.name || "").trim() || other;
            }
          }
          bookingCards.push({
            id: String(b.id),
            title,
            otherParty: `المزوّد: ${other}`,
            role: "customer",
          });
        }

        const ownServices = await supabase.from("provider_services").select("id").eq("user_id", uid);
        const ownIds = ((ownServices.data ?? []) as Array<{ id: string }>).map((r) => r.id).filter(Boolean);
        if (ownIds.length) {
          const provBookings = await supabase
            .from("bookings")
            .select("id, customer_id, provider_service_id")
            .in("provider_service_id", ownIds)
            .in("status", ["confirmed", "in_progress"])
            .order("created_at", { ascending: false })
            .limit(5);
          for (const b of (provBookings.data ?? []) as Array<{
            id: string;
            customer_id?: string;
            provider_service_id?: string;
          }>) {
            if (!stillCurrent()) return;
            let title = "طلب نشط";
            if (b.provider_service_id) {
              const ps = await supabase
                .from("provider_services")
                .select("title")
                .eq("id", b.provider_service_id)
                .maybeSingle();
              title = String((ps.data as { title?: string } | null)?.title ?? title);
            }
            let customerName = "عميل";
            if (b.customer_id) {
              const cn = await supabase
                .from("profiles")
                .select("full_name, name")
                .eq("id", b.customer_id)
                .maybeSingle();
              const cnData = cn.data as { full_name?: string; name?: string } | null;
              customerName = String(cnData?.full_name || cnData?.name || "").trim() || customerName;
            }
            bookingCards.push({
              id: String(b.id),
              title,
              otherParty: `العميل: ${customerName}`,
              role: "provider",
            });
          }
        }
        if (!stillCurrent()) return;
        setActiveBookings(bookingCards);
      }

      let psQuery = supabase
        .from("provider_services")
        .select(
          "id, title, user_id, service_mode, service_type_id, city_id, location_lat, location_lng, is_active, starting_price, base_price, created_at"
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(80);
      if (uid) psQuery = psQuery.neq("user_id", uid);
      const psRes = await psQuery;
      if (!stillCurrent()) return;
      if (psRes.error) {
        setFeed([]);
        setFeedEmptyHint(psRes.error.message || "حاول لاحقًا أو وسّع نطاق البحث.");
        return;
      }

      type PsRow = {
        id: string;
        title?: string | null;
        user_id?: string | null;
        service_mode?: string | null;
        service_type_id?: string | null;
        city_id?: string | null;
        location_lat?: number | null;
        location_lng?: number | null;
        is_active?: boolean | null;
        starting_price?: number | null;
        base_price?: number | null;
      };

      let rows = ((psRes.data ?? []) as PsRow[]).filter((r) => !uid || r.user_id !== uid);
      const serviceIds = rows.map((r) => r.id).filter(Boolean);
      const cityIds = Array.from(new Set(rows.map((r) => r.city_id).filter(Boolean))) as string[];
      const typeIds = Array.from(new Set(rows.map((r) => r.service_type_id).filter(Boolean))) as string[];
      const providerIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];

      const [packagesRes, imagesRes, providerImagesRes, citiesRes, typesRes, profilesRes, bookingsCountRes] =
        await Promise.all([
          serviceIds.length
            ? supabase
                .from("provider_packages")
                .select("provider_service_id, price, is_active")
                .in("provider_service_id", serviceIds)
            : Promise.resolve({ data: [] as unknown[] }),
          serviceIds.length
            ? supabase
                .from("provider_service_images")
                .select("provider_service_id, image_url")
                .in("provider_service_id", serviceIds)
            : Promise.resolve({ data: [] as unknown[] }),
          providerIds.length
            ? supabase
                .from("profile_images")
                .select("user_id, image_url, created_at")
                .in("user_id", providerIds)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [] as unknown[] }),
          cityIds.length
            ? supabase.from("cities").select("id, name")
            : Promise.resolve({ data: [] as unknown[] }),
          typeIds.length
            ? supabase.from("service_types").select("id, name")
            : Promise.resolve({ data: [] as unknown[] }),
          providerIds.length
            ? supabase.from("profiles").select("id, full_name, name, display_name")
            : Promise.resolve({ data: [] as unknown[] }),
          serviceIds.length
            ? supabase.from("bookings").select("provider_service_id").in("provider_service_id", serviceIds)
            : Promise.resolve({ data: [] as unknown[] }),
        ]);
      if (!stillCurrent()) return;

      const packagesByService = new Map<string, Array<{ price?: number; is_active?: boolean }>>();
      for (const row of (packagesRes.data ?? []) as Array<{
        provider_service_id: string;
        price?: number;
        is_active?: boolean;
      }>) {
        const sid = String(row.provider_service_id);
        packagesByService.set(sid, [...(packagesByService.get(sid) ?? []), row]);
      }
      const imageReady = new Set(
        ((imagesRes.data ?? []) as Array<{ provider_service_id: string }>).map((x) =>
          String(x.provider_service_id)
        )
      );
      const providerImageByUser = new Map<string, string>();
      for (const row of (providerImagesRes.data ?? []) as Array<{
        user_id: string;
        image_url?: string;
      }>) {
        if (providerImageByUser.has(row.user_id)) continue;
        const uri = normalizeRemoteUri(row.image_url);
        if (uri) providerImageByUser.set(row.user_id, uri);
      }
      const cityNameById = new Map<string, string>();
      for (const c of (citiesRes.data ?? []) as Array<{ id: string; name?: string }>) {
        cityNameById.set(String(c.id), String(c.name || ""));
      }
      const typeNameById = new Map<string, string>();
      for (const t of (typesRes.data ?? []) as Array<{ id: string; name?: string }>) {
        typeNameById.set(String(t.id), String(t.name || ""));
      }
      const providerNameById = new Map<string, string>();
      for (const pr of (profilesRes.data ?? []) as Array<{
        id: string;
        full_name?: string;
        name?: string;
        display_name?: string;
      }>) {
        const n = String(pr.full_name || pr.display_name || pr.name || "").trim();
        if (n) providerNameById.set(String(pr.id), n);
      }
      const bookingCountByService = new Map<string, number>();
      for (const b of (bookingsCountRes.data ?? []) as Array<{ provider_service_id: string }>) {
        const sid = String(b.provider_service_id);
        bookingCountByService.set(sid, (bookingCountByService.get(sid) ?? 0) + 1);
      }

      let viewerCityId: string | null = null;
      if (uid) {
        const own = await supabase
          .from("provider_services")
          .select("city_id")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!stillCurrent()) return;
        const cid = (own.data as { city_id?: string } | null)?.city_id;
        viewerCityId = cid ? String(cid) : null;
      }

      rows = rows.filter((r) => {
        const id = String(r.id);
        const pkgs = packagesByService.get(id) ?? [];
        const puid = r.user_id ? String(r.user_id) : "";
        return isBronzeMarketListable({
          isActive: r.is_active !== false,
          hasImage: imageReady.has(id),
          hasTitle: String(r.title ?? "").trim().length > 0,
          hasProviderImage: puid ? providerImageByUser.has(puid) : false,
          service: { starting_price: r.starting_price, base_price: r.base_price },
          packages: pkgs,
        });
      });

      const items: FeedItem[] = rows.map((r) => {
        const lat = Number(r.location_lat);
        const lng = Number(r.location_lng);
        let distanceKm: number | null = null;
        if (
          viewerLat != null &&
          viewerLng != null &&
          Number.isFinite(lat) &&
          Number.isFinite(lng)
        ) {
          distanceKm = haversineKm(viewerLat, viewerLng, lat, lng);
        }
        return {
          serviceId: String(r.id),
          title: r.title ? String(r.title) : null,
          cityName: r.city_id ? cityNameById.get(String(r.city_id)) ?? null : null,
          serviceTypeName: r.service_type_id
            ? typeNameById.get(String(r.service_type_id)) ?? null
            : null,
          providerName: r.user_id ? providerNameById.get(String(r.user_id)) ?? null : null,
          providerImageUrl: r.user_id ? providerImageByUser.get(String(r.user_id)) ?? null : null,
          sameCity: !!(viewerCityId && r.city_id && String(r.city_id) === viewerCityId),
          distanceKm,
          bookingCount: bookingCountByService.get(String(r.id)) ?? 0,
        };
      });

      if (!stillCurrent()) return;
      setFeed(items);
      if (!permissionDenied) setFeedEmptyHint("حاول لاحقًا أو وسّع نطاق البحث.");
    } finally {
      if (stillCurrent()) setFeedLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Drive home identity + feed from auth events only (includes INITIAL_SESSION).
    // Defer async work: awaiting auth APIs inside onAuthStateChange deadlocks supabase-js.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void refreshAdmin(session);
        void loadFeed(session);
      }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadFeed, refreshAdmin]);

  const filteredByIdea = React.useMemo(() => {
    if (!ideaFilter) return feed;
    const chip = IDEA_CHIPS.find((c) => c.key === ideaFilter);
    if (!chip) return feed;
    return feed.filter((it) => {
      const hay = `${it.serviceTypeName ?? ""} ${it.title ?? ""}`;
      return hay.includes(chip.match);
    });
  }, [feed, ideaFilter]);

  const popular = React.useMemo(
    () =>
      [...filteredByIdea]
        .sort((a, b) => (b.bookingCount ?? 0) - (a.bookingCount ?? 0))
        .slice(0, 8),
    [filteredByIdea]
  );

  const nearby = React.useMemo(
    () =>
      [...filteredByIdea]
        .sort((a, b) => {
          if (a.sameCity !== b.sameCity) return a.sameCity ? -1 : 1;
          if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
          if (a.distanceKm != null) return -1;
          if (b.distanceKm != null) return 1;
          return 0;
        })
        .slice(0, 8),
    [filteredByIdea]
  );

  const runSmartRequest = React.useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? smartText).trim();
      if (!text) {
        setSmartError("اكتب طلبك أولاً");
        return;
      }
      setSmartLoading(true);
      setSmartError(null);
      try {
        const normalized = text.replace(/[أإآ]/g, "ا");
        const wantsNearest =
          normalized.includes("اقرب") ||
          normalized.includes("قريب") ||
          normalized.includes("حولي") ||
          normalized.includes("حولك");
        let body: Record<string, unknown> = { text };
        if (wantsNearest && typeof navigator !== "undefined" && navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
            });
            body = { text, user_lat: pos.coords.latitude, user_lng: pos.coords.longitude };
          } catch {
            /* ignore */
          }
        }
        const { data, error } = await supabase.functions.invoke("ai-assistant", { body });
        if (error) {
          setSmartError("تعذر تحليل الطلب حالياً");
          setSmartResults([]);
          setSmartMatchSummary(null);
          return;
        }
        if (!data?.ok) {
          setSmartError("لم يتم العثور على نتيجة مناسبة");
          setSmartResults([]);
          setSmartMatchSummary(null);
          return;
        }
        const results = Array.isArray(data?.smart_matches?.results)
          ? (data.smart_matches.results as SmartResult[])
          : [];
        const sorted = [...results].sort((a, b) => {
          const ap = Number(a?.package?.price ?? Number.MAX_SAFE_INTEGER);
          const bp = Number(b?.package?.price ?? Number.MAX_SAFE_INTEGER);
          return ap - bp;
        });
        setSmartResults(sorted);
        setSmartMatchSummary((data?.smart_matches as Record<string, unknown>) ?? null);
        if (results.length === 0) setSmartError("لا توجد خدمات مطابقة حالياً");
      } catch {
        setSmartError("حدث خطأ أثناء تنفيذ الطلب الذكي");
        setSmartResults([]);
        setSmartMatchSummary(null);
      } finally {
        setSmartLoading(false);
      }
    },
    [smartText]
  );

  const openService = (serviceId: string) => {
    if (!sessionUid) {
      window.alert("يلزم تسجيل الدخول لإكمال هذا الإجراء");
      router.push(localeHref(locale, "/account?view=login"));
      return;
    }
    void serviceId;
    setServiceOpenNotice(
      "تعذّر فتح تفاصيل الخدمة على الويب حالياً (شاشة ServiceDetails غير منقولة بعد). استخدم التطبيق للحجز."
    );
  };

  const greeting = displayName ? `مرحبًا، ${displayName}` : "مرحبًا";
  const headerInitial = displayName?.trim().charAt(0) || "";
  const clockText = clock
    ? clock.toLocaleTimeString("ar-SA", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    : "\u00A0";

  const finishSuggestion = () => {
    const parts = [
      persons.trim() ? `${persons.trim()} أشخاص` : null,
      city.trim() ? `في ${city.trim()}` : null,
      when.trim() ? when.trim() : null,
      budget.trim() ? `ميزانية ${budget.trim()} ريال` : null,
    ].filter(Boolean);
    const text = parts.length ? parts.join(" ") : "أحتاج اقتراح تجربة مناسبة";
    setSmartText(text);
    setSuggestionOpen(false);
    setSuggestStep(0);
    setPersons("");
    setCity("");
    setWhen("");
    setBudget("");
    void runSmartRequest(text);
  };

  const suggestSteps = [
    { label: "كم شخص تقريباً؟", value: persons, set: setPersons, placeholder: "مثال: 15" },
    { label: "أي مدينة؟", value: city, set: setCity, placeholder: "مثال: الرياض" },
    { label: "متى؟", value: when, set: setWhen, placeholder: "مثال: يوم الجمعة" },
    { label: "ميزانية تقريبية (ريال)", value: budget, set: setBudget, placeholder: "اختياري" },
  ];

  const renderFeedList = (items: FeedItem[], emptyTitle: string) => {
    if (feedLoading && items.length === 0) {
      return (
        <div style={S.emptyCard}>
          <div style={{ color: C.gold, fontWeight: 800 }}>جاري التحميل…</div>
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div style={S.emptyCard}>
          <div style={S.emptyTitle}>{emptyTitle}</div>
          <div style={S.emptySubtitle}>{feedEmptyHint}</div>
        </div>
      );
    }
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => (
          <button
            key={item.serviceId}
            type="button"
            onClick={() => openService(item.serviceId)}
            style={S.feedCard}
          >
            <div style={S.feedAvatar}>
              {item.providerImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.providerImageUrl} alt="" style={S.feedAvatarImg} />
              ) : (
                <span style={S.feedAvatarFallback}>
                  {(item.providerName ?? item.title ?? "•").trim().charAt(0) || "•"}
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
              <div style={S.feedTitle}>{item.title ?? item.providerName ?? "تجربة متاحة"}</div>
              <div style={S.feedSubtitle}>
                {[item.serviceTypeName, item.cityName, item.providerName].filter(Boolean).join(" • ") ||
                  "مزوّد متاح"}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 6,
                  justifyContent: "flex-end",
                }}
              >
                {item.sameCity ? (
                  <span style={{ ...S.badge, background: "#E8F3EF", color: "#0F7A3A" }}>نفس مدينتك</span>
                ) : null}
                {item.distanceKm != null ? (
                  <span style={S.badge}>{item.distanceKm.toFixed(0)} كم</span>
                ) : null}
                {(item.bookingCount ?? 0) > 0 ? (
                  <span style={S.badge}>{item.bookingCount} طلب</span>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const customerBookings = activeBookings.filter((b) => b.role === "customer");
  const providerBookings = activeBookings.filter((b) => b.role === "provider");

  return (
    <div dir="rtl" style={S.page}>
      {isAdmin ? (
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 6 }}>
          <a
            href={localeHref(locale, "/admin/portal")}
            style={{
              fontSize: 11,
              color: "#64748b",
              textDecoration: "none",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 8,
              background: "rgba(100, 116, 139, 0.08)",
            }}
          >
            الإدارة
          </a>
        </div>
      ) : null}

      <div style={S.header}>
        <div style={S.clock}>{clockText}</div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={S.helloRow}>
            <span style={S.hello}>{greeting}</span>
            <button
              type="button"
              aria-label="الإشعارات"
              onClick={() => setNotifOpen((v) => !v)}
              style={S.bellBtn}
            >
              🔔
              {unreadCount > 0 ? (
                <span style={S.badgeCount}>{unreadCount > 99 ? "99+" : unreadCount}</span>
              ) : null}
            </button>
          </div>
          <div style={S.subtitle}>ابدأ رحلتك من هنا</div>
        </div>
        <div style={S.avatar}>
          {profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profileImageUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 24 }}
            />
          ) : headerInitial ? (
            <span style={{ fontWeight: 900, color: C.navy }}>{headerInitial}</span>
          ) : null}
        </div>
      </div>

      {notifOpen ? (
        <div style={S.notifPanel}>
          {notifications.length === 0 ? (
            <div style={{ fontWeight: 800, color: C.navy, textAlign: "center" }}>لا توجد إشعارات</div>
          ) : (
            notifications.slice(0, 8).map((n) => (
              <div key={n.id} style={{ borderBottom: "1px solid #E8DCC8", padding: "10px 0" }}>
                <div style={{ fontWeight: 900, color: C.navy }}>{n.title}</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{n.body}</div>
              </div>
            ))
          )}
        </div>
      ) : null}

      <div style={S.banner}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {TICKER_FALLBACKS[tickerIdx]}
        </span>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={S.weatherTitle}>الطقس الآن</div>
        <div style={S.weatherBar}>
          {weatherLine ? `${weatherIcon(weatherLine)}  ${weatherLine}` : "جاري تحميل الطقس..."}
        </div>
      </div>

      {serviceOpenNotice ? (
        <div style={S.notice}>
          {serviceOpenNotice}
          <button type="button" onClick={() => setServiceOpenNotice(null)} style={S.noticeClose}>
            إغلاق
          </button>
        </div>
      ) : null}

      <div style={{ marginTop: 18 }}>
        <div style={S.sectionHeading}>ماذا تريد اليوم؟</div>
        <div style={S.sectionHint}>اكتب نيتك — مثل: كشتة لعشرين شخص الجمعة في حائل</div>
        <textarea
          value={smartText}
          onChange={(e) => setSmartText(e.target.value)}
          placeholder="اكتب طلبك أو ما تبحث عنه…"
          rows={3}
          style={S.searchInput}
          aria-label="ماذا تريد اليوم"
        />
        <button
          type="button"
          disabled={smartLoading}
          onClick={() => void runSmartRequest()}
          style={{ ...S.primaryBtn, opacity: smartLoading ? 0.7 : 1 }}
        >
          {smartLoading ? "جاري البحث…" : "ابحث واطلب"}
        </button>
        {smartError ? <div style={S.error}>{smartError}</div> : null}
        {smartResults.length > 0 ? (
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 900, color: C.navy, fontSize: 14 }}>
              {smartMatchSummary?.budget_matched === false
                ? "أقرب الخيارات لميزانيتك"
                : `وجدنا ${smartResults.length} ${smartResults.length === 1 ? "خياراً" : "خيارات"}`}
            </div>
            {smartResults.map((result, index) => {
              const serviceId = result?.provider_service?.id;
              if (!serviceId) return null;
              return (
                <button
                  key={`smart-${serviceId}-${index}`}
                  type="button"
                  onClick={() => openService(String(serviceId))}
                  style={S.smartCard}
                >
                  <div style={{ fontWeight: 900, color: C.navy }}>
                    {result?.provider?.name ??
                      result?.package?.option_label ??
                      result?.provider_service?.title ??
                      "خدمة"}
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    {[
                      result?.provider?.distance_km != null
                        ? `${result.provider.distance_km} كم`
                        : null,
                      result?.package?.price != null
                        ? `${result.package.price} ${result.package.currency ?? "SAR"}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 14 }}>
        <button type="button" onClick={() => setSuggestionOpen(true)} style={S.suggestionEntry}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>أحتاج اقتراحًا</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>٤ أسئلة سريعة ثم مطابقة</div>
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={S.sectionHeading}>أفكار اليوم</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {IDEA_CHIPS.map((chip) => {
            const active = ideaFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setIdeaFilter(active ? null : chip.key)}
                style={{
                  ...S.chip,
                  background: active ? C.gold : "#FFF8EC",
                  color: active ? "#fff" : C.navy,
                  borderColor: active ? C.gold : "#E2CFB7",
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {customerBookings.length > 0 ? (
        <div style={{ marginTop: 18 }}>
          <div style={S.sectionHeading}>حجوزاتي</div>
          <div style={S.sectionHint}>
            {customerBookings.length === 1
              ? "حجز نشط واحد"
              : `${customerBookings.length} حجوزات نشطة`}
          </div>
          {customerBookings.map((b) => (
            <div key={b.id} style={S.bookingCard}>
              <div style={{ fontWeight: 900, color: C.navy }}>{b.title}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{b.otherParty}</div>
            </div>
          ))}
        </div>
      ) : null}

      {providerBookings.length > 0 ? (
        <div style={{ marginTop: 18 }}>
          <div style={S.sectionHeading}>حجوزات خدماتي</div>
          <div style={S.sectionHint}>
            {providerBookings.length === 1
              ? "طلب نشط واحد على خدماتك"
              : `${providerBookings.length} طلبات نشطة على خدماتك`}
          </div>
          {providerBookings.map((b) => (
            <div key={`p-${b.id}`} style={S.bookingCard}>
              <div style={{ fontWeight: 900, color: C.navy }}>{b.title}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{b.otherParty}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ marginTop: 18 }}>
        <div style={S.sectionHeading}>الأكثر طلبًا</div>
        <div style={S.sectionHint}>تجارب يطلبها العملاء كثيراً</div>
        {renderFeedList(popular, "لا توجد تجارب بعد")}
      </div>

      <div style={{ marginTop: 18, marginBottom: 8 }}>
        <div style={S.sectionHeading}>قريب منك</div>
        <div style={S.sectionHint}>مرتّبة حسب مدينتك وموقعك</div>
        {renderFeedList(nearby, "لا توجد تجارب قريبة حالياً")}
      </div>

      {suggestionOpen ? (
        <div
          style={S.modalBackdrop}
          onClick={() => {
            setSuggestionOpen(false);
            setSuggestStep(0);
          }}
          role="presentation"
        >
          <div
            style={S.modalSheet}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="أحتاج اقتراحًا"
          >
            <div style={{ fontWeight: 900, fontSize: 18, color: C.navy, marginBottom: 8 }}>
              أحتاج اقتراحًا
            </div>
            <div style={{ fontWeight: 800, color: C.muted, marginBottom: 10 }}>
              {suggestSteps[suggestStep].label}
            </div>
            <input
              value={suggestSteps[suggestStep].value}
              onChange={(e) => suggestSteps[suggestStep].set(e.target.value)}
              placeholder={suggestSteps[suggestStep].placeholder}
              style={S.modalInput}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                type="button"
                style={S.modalSecondary}
                onClick={() => {
                  if (suggestStep > 0) setSuggestStep((s) => s - 1);
                  else {
                    setSuggestionOpen(false);
                    setSuggestStep(0);
                  }
                }}
              >
                {suggestStep > 0 ? "السابق" : "إلغاء"}
              </button>
              <button
                type="button"
                style={S.modalPrimary}
                onClick={() => {
                  if (suggestStep < suggestSteps.length - 1) setSuggestStep((s) => s + 1);
                  else finishSuggestion();
                }}
              >
                {suggestStep < suggestSteps.length - 1 ? "التالي" : "اعرض اقتراحًا"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 520,
    margin: "0 auto",
    paddingTop: 18,
    paddingRight: 16,
    paddingBottom: 24,
    paddingLeft: 16,
    background: C.bg,
    minHeight: "100vh",
    boxSizing: "border-box",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  clock: { fontSize: 21, fontWeight: 900, color: C.clock, minWidth: 72 },
  helloRow: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  hello: { fontSize: 18, fontWeight: 900, color: C.navy },
  subtitle: { fontSize: 14, color: C.muted, marginTop: 2, fontWeight: 600 },
  bellBtn: {
    position: "relative",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 18,
    padding: 0,
    color: "#B88917",
  },
  badgeCount: {
    position: "absolute",
    top: -6,
    left: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    background: "#B42318",
    color: "#fff",
    fontSize: 10,
    fontWeight: 900,
    display: "grid",
    placeItems: "center",
    padding: "0 3px",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    background: C.avatarBg,
    border: `2px solid ${C.avatarBorder}`,
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  banner: {
    height: 58,
    borderRadius: 29,
    background: C.bannerBg,
    border: `1px solid ${C.bannerBorder}`,
    color: C.bannerText,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 18px",
    fontWeight: 800,
    fontSize: 14,
  },
  weatherTitle: { color: C.weatherTitle, fontWeight: 900, fontSize: 14, marginBottom: 6 },
  weatherBar: {
    background: C.weatherBar,
    border: `1px solid ${C.weatherBorder}`,
    borderRadius: 16,
    padding: "12px 14px",
    fontWeight: 800,
    color: C.navy,
  },
  sectionHeading: { fontSize: 18, fontWeight: 900, color: C.navy, marginBottom: 4 },
  sectionHint: { fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 10 },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    background: C.inputBg,
    border: `1px solid ${C.inputBorder}`,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    fontWeight: 700,
    color: C.navy,
    textAlign: "right",
    resize: "vertical",
    fontFamily: "inherit",
  },
  primaryBtn: {
    marginTop: 10,
    width: "100%",
    minHeight: 48,
    borderRadius: 16,
    border: "none",
    background: C.gold,
    color: "#fff",
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
  },
  error: { marginTop: 8, color: "#B42318", fontWeight: 800, fontSize: 13 },
  suggestionEntry: {
    width: "100%",
    textAlign: "right",
    background: C.suggestion,
    color: "#fff",
    border: "none",
    borderRadius: 18,
    padding: "16px 18px",
    cursor: "pointer",
  },
  chip: {
    flexShrink: 0,
    borderRadius: 999,
    border: "1px solid",
    padding: "8px 14px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },
  feedCard: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    width: "100%",
    textAlign: "right",
    background: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: 16,
    padding: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  feedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    background: "#E8DCC8",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  feedAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  feedAvatarFallback: { fontWeight: 900, color: C.navy },
  feedTitle: { fontWeight: 900, color: C.navy, fontSize: 15 },
  feedSubtitle: { fontSize: 12, color: C.muted, marginTop: 2, fontWeight: 600 },
  badge: {
    fontSize: 11,
    fontWeight: 800,
    background: "#F3EDE6",
    color: C.navy,
    borderRadius: 999,
    padding: "3px 8px",
  },
  emptyCard: {
    background: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: 16,
    padding: 18,
    textAlign: "center",
  },
  emptyTitle: { fontWeight: 900, color: C.navy },
  emptySubtitle: { marginTop: 6, fontSize: 13, color: C.muted, fontWeight: 600 },
  bookingCard: {
    background: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  smartCard: {
    textAlign: "right",
    background: "#FFF8EC",
    border: `1px solid ${C.inputBorder}`,
    borderRadius: 14,
    padding: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    width: "100%",
  },
  notifPanel: {
    background: "#FFFBF5",
    border: `1px solid ${C.cardBorder}`,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  notice: {
    marginTop: 12,
    background: "#FFF8E7",
    border: "1px solid #E6D6C4",
    borderRadius: 14,
    padding: 12,
    color: "#7A4E19",
    fontWeight: 700,
    fontSize: 13,
    lineHeight: 1.6,
  },
  noticeClose: {
    display: "block",
    marginTop: 8,
    border: "none",
    background: "transparent",
    color: C.navy,
    fontWeight: 900,
    cursor: "pointer",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 2000,
    display: "grid",
    placeItems: "end center",
    padding: 16,
  },
  modalSheet: {
    width: "100%",
    maxWidth: 420,
    background: "#FFFBF5",
    borderRadius: 20,
    padding: 18,
    marginBottom: 40,
  },
  modalInput: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 14,
    border: `1px solid ${C.inputBorder}`,
    padding: 12,
    fontWeight: 700,
    textAlign: "right",
    fontFamily: "inherit",
  },
  modalSecondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    border: `1px solid ${C.inputBorder}`,
    background: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  modalPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    border: "none",
    background: C.gold,
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
};
