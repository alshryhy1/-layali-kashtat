"use client";

import * as React from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { localeHref, type Locale } from "@/lib/locales";

type SectionKey = "haraj" | "gallery" | "community";

const SECTION_ORDER: SectionKey[] = ["haraj", "gallery", "community"];

const SECTION_COPY = {
  haraj: { title: "الحراج", subtitle: "بيع وشراء معدات الرحلات والكشتات" },
  gallery: { title: "المعرض", subtitle: "شارك رحلاتك وتجاربك ولحظاتك" },
  community: { title: "المجتمع", subtitle: "فزعة وتحذيرات وأماكن يشاركها المجتمع" },
} as const;

const SECTION_VISUAL: Record<
  SectionKey,
  { icon: string; accentBorder: string; accentBg: string; iconWellBg: string; iconWellBorder: string }
> = {
  haraj: {
    icon: "🛒",
    accentBorder: "#E4CFAE",
    accentBg: "#FFFDF9",
    iconWellBg: "#F7EFE5",
    iconWellBorder: "#E8D5B7",
  },
  gallery: {
    icon: "📸",
    accentBorder: "#DDD5CB",
    accentBg: "#FAF9F6",
    iconWellBg: "#F3EDE6",
    iconWellBorder: "#D9D0C4",
  },
  community: {
    icon: "🤝",
    accentBorder: "#E5D4C4",
    accentBg: "#FFFCF8",
    iconWellBg: "#FFF4E8",
    iconWellBorder: "#E8D4BF",
  },
};

const HREFS: Record<SectionKey, string> = {
  haraj: "/haraj",
  gallery: "/gallery",
  community: "/sections/community",
};

function communityTypeLabel(type: string): string {
  if (type === "help_request") return "فزعة";
  if (type === "alert") return "تحذير";
  return "مكان";
}

/** Matches native SectionsScreen hub + latest activity strip. */
export default function SectionsClient({ locale }: { locale: Locale }) {
  const [latestHaraj, setLatestHaraj] = React.useState<{
    id: string;
    title: string;
    image?: string | null;
  } | null>(null);
  const [latestGallery, setLatestGallery] = React.useState<{
    id: string;
    text: string;
  } | null>(null);
  const [latestCommunity, setLatestCommunity] = React.useState<{
    id: string;
    title: string;
    type: string;
  } | null>(null);

  React.useEffect(() => {
    let alive = true;
    void (async () => {
      const [harajRes, galleryRes, communityRes] = await Promise.all([
        supabase
          .from("haraj_items")
          .select("id, title, created_at")
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("gallery_posts")
          .select("id, caption, description, body, title, created_at")
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("community_posts")
          .select("id, title, type, created_at, moderation_status")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (!alive) return;

      const harajRow = ((harajRes.data ?? []) as Array<{ id: string; title?: string }>)[0];
      if (harajRow?.id) {
        let image: string | null = null;
        const imgRes = await supabase
          .from("haraj_item_images")
          .select("image_url")
          .eq("item_id", harajRow.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        image = (imgRes.data as { image_url?: string } | null)?.image_url ?? null;
        setLatestHaraj({
          id: String(harajRow.id),
          title: String(harajRow.title || "إعلان"),
          image,
        });
      }

      const gal = ((galleryRes.data ?? []) as Array<Record<string, unknown>>)[0];
      if (gal?.id) {
        const textCandidates = [gal.caption, gal.description, gal.body, gal.title];
        let text = "مشاركة جديدة";
        for (const v of textCandidates) {
          if (typeof v === "string" && v.trim()) {
            text = v.trim();
            break;
          }
        }
        setLatestGallery({ id: String(gal.id), text });
      }

      const communityRows = ((communityRes.data ?? []) as Array<{
        id: string;
        title?: string;
        type?: string;
        moderation_status?: string | null;
      }>).filter((r) => r.moderation_status !== "rejected");
      const c0 = communityRows[0];
      if (c0?.id && c0.title && c0.type) {
        setLatestCommunity({
          id: String(c0.id),
          title: String(c0.title),
          type: String(c0.type),
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div dir="rtl" style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>الأقسام</h1>
        <p style={S.subtitle}>اختر القسم المناسب لك</p>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {SECTION_ORDER.map((key) => {
          const copy = SECTION_COPY[key];
          const v = SECTION_VISUAL[key];
          return (
            <Link
              key={key}
              href={localeHref(locale, HREFS[key])}
              style={{
                ...S.card,
                background: v.accentBg,
                borderColor: v.accentBorder,
              }}
            >
              <span
                style={{
                  ...S.iconWell,
                  background: v.iconWellBg,
                  borderColor: v.iconWellBorder,
                }}
              >
                {v.icon}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={S.cardTitle}>{copy.title}</span>
                <span style={S.cardDesc}>{copy.subtitle}</span>
              </span>
              <span style={S.arrow}>‹</span>
            </Link>
          );
        })}
      </div>

      {latestHaraj || latestGallery || latestCommunity ? (
        <div style={{ marginTop: 22 }}>
          <div style={S.latestTitle}>آخر النشاطات</div>

          {latestHaraj ? (
            <Link href={localeHref(locale, `/haraj/${latestHaraj.id}`)} style={S.latestCard}>
              <span style={S.latestImageWell}>
                {latestHaraj.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={latestHaraj.image} alt="" style={S.latestImage} />
                ) : (
                  <span style={{ fontSize: 22 }}>🛒</span>
                )}
              </span>
              <span style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                <span style={S.latestKicker}>أحدث إعلان بالحراج</span>
                <span style={S.latestMain}>{latestHaraj.title}</span>
              </span>
              <span style={S.arrow}>‹</span>
            </Link>
          ) : null}

          {latestGallery ? (
            <Link href={localeHref(locale, "/gallery")} style={S.latestCard}>
              <span style={S.latestImageWell}>
                <span style={{ fontSize: 22 }}>📸</span>
              </span>
              <span style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                <span style={S.latestKicker}>أحدث مشاركة بالمعرض</span>
                <span style={S.latestMain}>{latestGallery.text}</span>
              </span>
              <span style={S.arrow}>‹</span>
            </Link>
          ) : null}

          {latestCommunity ? (
            <Link href={localeHref(locale, "/sections/community")} style={S.latestCard}>
              <span style={S.latestImageWell}>
                <span style={{ fontSize: 22 }}>🤝</span>
              </span>
              <span style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                <span style={S.latestKicker}>
                  أحدث مشاركة بالمجتمع · {communityTypeLabel(latestCommunity.type)}
                </span>
                <span style={S.latestMain}>{latestCommunity.title}</span>
              </span>
              <span style={S.arrow}>‹</span>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 520,
    margin: "0 auto",
    paddingTop: 24,
    paddingRight: 16,
    paddingBottom: 24,
    paddingLeft: 16,
    background: "#EFE3D2",
    minHeight: "100vh",
    boxSizing: "border-box",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: { textAlign: "center", marginBottom: 18 },
  title: { margin: 0, fontSize: 22, fontWeight: 900, color: "#173B5B" },
  subtitle: { margin: "6px 0 0", color: "#6B7280", fontSize: 14, fontWeight: 600 },
  card: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 18px",
    borderRadius: 18,
    border: "1.5px solid",
    textDecoration: "none",
    color: "inherit",
  },
  iconWell: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    border: "1px solid",
    fontSize: 22,
    flexShrink: 0,
  },
  cardTitle: { display: "block", fontSize: 17, fontWeight: 900, color: "#173B5B" },
  cardDesc: {
    display: "block",
    marginTop: 4,
    fontSize: 13,
    fontWeight: 600,
    color: "#6B7280",
    lineHeight: 1.45,
  },
  arrow: { color: "#9CA3AF", fontSize: 22, fontWeight: 700 },
  latestTitle: {
    fontSize: 17,
    fontWeight: 900,
    color: "#173B5B",
    marginBottom: 10,
    textAlign: "right",
  },
  latestCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    marginBottom: 10,
    borderRadius: 16,
    background: "#F6FBF7",
    border: "1px solid #D1E7D7",
    textDecoration: "none",
    color: "inherit",
  },
  latestImageWell: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#E8F3EF",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  latestImage: { width: "100%", height: "100%", objectFit: "cover" },
  latestKicker: {
    display: "block",
    fontSize: 12,
    fontWeight: 800,
    color: "#166534",
    marginBottom: 2,
  },
  latestMain: {
    display: "block",
    fontSize: 14,
    fontWeight: 900,
    color: "#173B5B",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
