"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { type Locale } from "@/lib/locales";
import SubPageHeader, { SUB_PAGE_BG, SUB_PAGE_CARD_BG } from "@/components/SubPageHeader";

type CommunityPostType = "help_request" | "alert" | "place";

type CommunityPost = {
  id: string;
  userId: string;
  type: CommunityPostType;
  title: string;
  body: string;
  cityLabel?: string | null;
  imageUrl?: string | null;
  createdAt: string;
};

const TYPE_ORDER: Array<CommunityPostType | "all"> = ["all", "help_request", "alert", "place"];

function communityTypeLabel(type: CommunityPostType): string {
  if (type === "help_request") return "فزعة";
  if (type === "alert") return "تحذير";
  return "مكان";
}

function communityTypeIcon(type: CommunityPostType): string {
  if (type === "help_request") return "🤝";
  if (type === "alert") return "🚨";
  return "📍";
}

function relativeTime(raw: string): string {
  const createdAt = Date.parse(raw);
  if (!Number.isFinite(createdAt)) return "";
  const diffMs = Date.now() - createdAt;
  if (diffMs < 60_000) return "الآن";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `قبل ${minutes.toLocaleString("ar-SA")} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours.toLocaleString("ar-SA")} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `قبل ${days.toLocaleString("ar-SA")} يوم`;
  return new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short" }).format(
    new Date(createdAt)
  );
}

/** Read-only community feed matching native CommunityScreen list (create/report deferred). */
export default function CommunityClient({ locale }: { locale: Locale }) {
  const [posts, setPosts] = React.useState<CommunityPost[]>([]);
  const [authorNames, setAuthorNames] = React.useState<Record<string, string>>({});
  const [selectedType, setSelectedType] = React.useState<CommunityPostType | "all">("all");
  const [loading, setLoading] = React.useState(true);
  const [createNotice, setCreateNotice] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        setPosts([]);
        return;
      }

      const rows = ((data ?? []) as Array<Record<string, unknown>>).filter(
        (row) => row.moderation_status !== "rejected"
      );

      const mapped: CommunityPost[] = [];
      for (const row of rows) {
        const id = typeof row.id === "string" ? row.id : null;
        const type =
          row.type === "help_request" || row.type === "alert" || row.type === "place"
            ? row.type
            : null;
        const title = typeof row.title === "string" ? row.title : "";
        const body = typeof row.body === "string" ? row.body : "";
        const createdAt =
          typeof row.created_at === "string" ? row.created_at : new Date().toISOString();
        if (!id || !type || !title.trim() || !body.trim()) continue;
        mapped.push({
          id,
          userId: typeof row.user_id === "string" ? row.user_id : "",
          type,
          title,
          body,
          cityLabel: typeof row.city_label === "string" ? row.city_label : null,
          imageUrl: typeof row.image_url === "string" ? row.image_url : null,
          createdAt,
        });
      }
      setPosts(mapped);

      const userIds = Array.from(new Set(mapped.map((p) => p.userId).filter(Boolean)));
      if (userIds.length) {
        const namesRes = await supabase
          .from("profiles")
          .select("id, full_name, name, display_name")
          .in("id", userIds);
        const map: Record<string, string> = {};
        for (const p of (namesRes.data ?? []) as Array<{
          id: string;
          full_name?: string;
          name?: string;
          display_name?: string;
        }>) {
          const n = String(p.full_name || p.display_name || p.name || "").trim();
          if (n) map[p.id] = n;
        }
        setAuthorNames(map);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered =
    selectedType === "all" ? posts : posts.filter((p) => p.type === selectedType);

  return (
    <div dir="rtl" style={{ ...S.page, paddingTop: 0, paddingRight: 0, paddingLeft: 0 }}>
      <SubPageHeader
        locale={locale}
        title="المجتمع"
        fallbackHref="/sections"
        right={
          <button
            type="button"
            style={S.createBtn}
            onClick={() => setCreateNotice(true)}
            aria-label="مشاركة جديدة"
          >
            +
          </button>
        }
      />

      <div style={{ paddingRight: 16, paddingLeft: 16, paddingBottom: 24 }}>
      {createNotice ? (
        <div style={S.notice}>
          تعذّر إنشاء مشاركة مجتمع على الويب حالياً (شاشة الإنشاء + الاعتدال غير منقولة بالكامل).
          استخدم التطبيق للنشر.
          <button type="button" style={S.noticeClose} onClick={() => setCreateNotice(false)}>
            إغلاق
          </button>
        </div>
      ) : null}

      <div style={S.filters}>
        {TYPE_ORDER.map((t) => {
          const active = selectedType === t;
          const label =
            t === "all" ? "الكل" : communityTypeLabel(t as CommunityPostType);
          return (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              style={{
                ...S.chip,
                background: active ? "#173B5B" : "#FFF8EC",
                color: active ? "#fff" : "#173B5B",
                borderColor: active ? "#173B5B" : "#E2CFB7",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={S.empty}>جاري التحميل…</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...S.empty, background: SUB_PAGE_CARD_BG, border: "1px solid #E4D5C2", borderRadius: 18, padding: 28 }}>
          لا توجد مشاركات حالياً — استخدم زر رجوع للعودة للأقسام.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((post) => (
            <article key={post.id} style={S.card}>
              <div style={S.cardHead}>
                <span style={S.typePill}>
                  {communityTypeIcon(post.type)} {communityTypeLabel(post.type)}
                </span>
                <span style={S.meta}>{relativeTime(post.createdAt)}</span>
              </div>
              <h2 style={S.cardTitle}>{post.title}</h2>
              <p style={S.cardBody}>{post.body}</p>
              <div style={S.cardFoot}>
                <span>{authorNames[post.userId] || "عضو"}</span>
                {post.cityLabel ? <span>· {post.cityLabel}</span> : null}
              </div>
              {post.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt="" style={S.image} />
              ) : null}
            </article>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 520,
    margin: "0 auto",
    paddingTop: 20,
    paddingRight: 16,
    paddingBottom: 24,
    paddingLeft: 16,
    background: SUB_PAGE_BG,
    minHeight: "100vh",
    boxSizing: "border-box",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  topRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    marginBottom: 14,
  },
  back: {
    justifySelf: "start",
    color: "#173B5B",
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 14,
  },
  title: { margin: 0, textAlign: "center", fontSize: 22, fontWeight: 900, color: "#173B5B" },
  createBtn: {
    justifySelf: "end",
    width: 36,
    height: 36,
    borderRadius: 18,
    border: "none",
    background: "#173B5B",
    color: "#fff",
    fontWeight: 900,
    fontSize: 22,
    cursor: "pointer",
    lineHeight: 1,
  },
  notice: {
    background: "#FFF8E7",
    border: "1px solid #E6D6C4",
    borderRadius: 14,
    padding: 12,
    color: "#7A4E19",
    fontWeight: 700,
    fontSize: 13,
    lineHeight: 1.55,
    marginBottom: 12,
  },
  noticeClose: {
    display: "block",
    marginTop: 8,
    border: "none",
    background: "transparent",
    color: "#173B5B",
    fontWeight: 900,
    cursor: "pointer",
  },
  filters: { display: "flex", gap: 8, overflowX: "auto", marginBottom: 14 },
  chip: {
    flexShrink: 0,
    borderRadius: 999,
    border: "1px solid",
    padding: "8px 14px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },
  empty: {
    textAlign: "center",
    padding: 28,
    fontWeight: 800,
    color: "#6B7280",
    background: "#FFFBF5",
    borderRadius: 16,
    border: "1px solid #E8DCC8",
  },
  card: {
    background: "#FFFBF5",
    border: "1px solid #E8DCC8",
    borderRadius: 18,
    padding: 14,
  },
  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  typePill: {
    fontSize: 12,
    fontWeight: 900,
    color: "#173B5B",
    background: "#F3EDE6",
    borderRadius: 999,
    padding: "4px 10px",
  },
  meta: { fontSize: 12, fontWeight: 700, color: "#6B7280" },
  cardTitle: { margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "#173B5B" },
  cardBody: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: "#4B5563",
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
  },
  cardFoot: {
    marginTop: 10,
    display: "flex",
    gap: 6,
    justifyContent: "flex-end",
    fontSize: 12,
    fontWeight: 700,
    color: "#6B7280",
  },
  image: {
    marginTop: 10,
    width: "100%",
    maxHeight: 220,
    objectFit: "cover",
    borderRadius: 12,
  },
};
