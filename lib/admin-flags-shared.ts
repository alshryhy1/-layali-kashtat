/** Shared labels & helpers for admin content-report (flags) moderation UX. */

export type ReportStatus =
  | "open"
  | "pending"
  | "new"
  | "dismissed"
  | "resolved"
  | "actioned"
  | "warned"
  | string;

export function isPendingReportStatus(status: string | null | undefined): boolean {
  const s = String(status || "open").toLowerCase();
  return s === "open" || s === "pending" || s === "new";
}

export function reportTypeLabel(isAr: boolean, targetType: string | null | undefined): string {
  const t = String(targetType || "").toLowerCase();
  const ar: Record<string, string> = {
    conversation_message: "رسالة في المحادثة",
    conversation_image: "صورة في المحادثة",
    haraj_item: "إعلان حراج",
    haraj_image: "صورة إعلان حراج",
    haraj_comment: "تعليق حراج",
    gallery_post: "منشور معرض",
    gallery_image: "صورة معرض",
    gallery_comment: "تعليق معرض",
    owner_reply: "رد المالك",
    provider_service: "خدمة مزوّد",
    provider_package: "باقة مزوّد",
    booking_note: "ملاحظة حجز",
    user_profile: "ملف مستخدم",
    community_post: "منشور مجتمع",
  };
  const en: Record<string, string> = {
    conversation_message: "Conversation message",
    conversation_image: "Conversation image",
    haraj_item: "Haraj listing",
    haraj_image: "Haraj image",
    haraj_comment: "Haraj comment",
    gallery_post: "Gallery post",
    gallery_image: "Gallery image",
    gallery_comment: "Gallery comment",
    owner_reply: "Owner reply",
    provider_service: "Provider service",
    provider_package: "Provider package",
    booking_note: "Booking note",
    user_profile: "User profile",
    community_post: "Community post",
  };
  if (isAr) return ar[t] || (t ? `محتوى (${t})` : "محتوى");
  return en[t] || (t ? `Content (${t})` : "Content");
}

export function reportStatusLabel(isAr: boolean, status: string | null | undefined): string {
  const s = String(status || "open").toLowerCase();
  if (isAr) {
    if (s === "open" || s === "pending" || s === "new") return "جديد";
    if (s === "dismissed" || s === "ignored") return "متجاهَل";
    if (s === "resolved" || s === "actioned" || s === "closed") return "تمّت المعالجة";
    if (s === "warned") return "تحذير";
    if (s === "reviewing" || s === "in_review") return "قيد المراجعة";
    return status || "جديد";
  }
  if (s === "open" || s === "pending" || s === "new") return "New";
  if (s === "dismissed" || s === "ignored") return "Dismissed";
  if (s === "resolved" || s === "actioned" || s === "closed") return "Resolved";
  if (s === "warned") return "Warned";
  if (s === "reviewing" || s === "in_review") return "In review";
  return status || "New";
}

export function reportPriorityLabel(isAr: boolean): string {
  // No priority column on content_reports — default for moderators.
  return isAr ? "عادية" : "Normal";
}

/** Short display id for moderators (not a DB membership column). */
export function reportShortId(id: string): string {
  return String(id || "").replace(/-/g, "").slice(0, 8).toUpperCase() || "—";
}

export type ParsedReportMeta = {
  bookingId: string | null;
  conversationId: string | null;
  postId: string | null;
  /** Human-readable lines from reason (no UUID key=value lines). */
  humanReason: string;
  rawReason: string;
};

const META_KEY_RE =
  /^(booking_id|conversation_id|post_id|message_id|target_id|reporter_id)\s*=\s*(.+)$/i;

export function parseReportReason(reason: string | null | undefined): ParsedReportMeta {
  const raw = String(reason || "").trim();
  let bookingId: string | null = null;
  let conversationId: string | null = null;
  let postId: string | null = null;
  const humanLines: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(META_KEY_RE);
    if (m) {
      const key = m[1].toLowerCase();
      const val = m[2].trim();
      if (key === "booking_id") bookingId = val;
      else if (key === "conversation_id") conversationId = val;
      else if (key === "post_id") postId = val;
      continue;
    }
    // Skip bare UUID-only lines
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
      continue;
    }
    humanLines.push(trimmed);
  }

  const humanReason =
    humanLines.join(" · ").trim() ||
    (bookingId || conversationId
      ? "بلاغ من المحادثة"
      : postId
        ? "بلاغ من المحتوى"
        : raw.slice(0, 120) || "—");

  return { bookingId, conversationId, postId, humanReason, rawReason: raw };
}

export type FlagAction =
  | "dismiss"
  | "delete_message"
  | "warn"
  | "mute_conversation"
  | "suspend_account"
  | "permanent_ban";

export type FlagPerson = {
  id: string;
  name: string | null;
  role: string | null;
  phone: string | null;
  membership: string;
};

export type FlagListRow = {
  id: string;
  shortId: string;
  targetType: string | null;
  targetTypeLabelAr: string;
  targetTypeLabelEn: string;
  targetId: string | null;
  reasonRaw: string | null;
  reasonHuman: string;
  status: string | null;
  statusLabelAr: string;
  statusLabelEn: string;
  reporter: FlagPerson | null;
  reported: FlagPerson | null;
  createdAt: string | null;
  bookingId: string | null;
  conversationId: string | null;
};

export type FlagMessage = {
  id: string;
  senderId: string | null;
  senderName: string | null;
  senderRole: string | null;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  moderationStatus: string | null;
  createdAt: string | null;
  isTarget: boolean;
};

export type FlagBooking = {
  id: string;
  bookingNumber: string | null;
  status: string | null;
  serviceTitle: string | null;
  customer: FlagPerson | null;
  provider: FlagPerson | null;
};

export type FlagDetail = {
  id: string;
  shortId: string;
  targetType: string | null;
  targetTypeLabelAr: string;
  targetTypeLabelEn: string;
  targetId: string | null;
  reasonRaw: string | null;
  reasonHuman: string;
  details: string | null;
  status: string | null;
  statusLabelAr: string;
  statusLabelEn: string;
  priorityLabelAr: string;
  priorityLabelEn: string;
  createdAt: string | null;
  reviewedAt: string | null;
  autoHidden: boolean | null;
  reporter: FlagPerson | null;
  reported: FlagPerson | null;
  booking: FlagBooking | null;
  conversationId: string | null;
  messages: FlagMessage[];
  evidence: Array<{ kind: string; url: string; label: string }>;
  capabilities: {
    canDeleteMessage: boolean;
    deleteMessageDisabledReasonAr: string | null;
    deleteMessageDisabledReasonEn: string | null;
    canMuteConversation: boolean;
    muteDisabledReasonAr: string | null;
    muteDisabledReasonEn: string | null;
    canActOnReportedAccount: boolean;
    reportedAccountDisabledReasonAr: string | null;
    reportedAccountDisabledReasonEn: string | null;
  };
};
