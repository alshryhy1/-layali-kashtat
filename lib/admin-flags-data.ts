import { db } from "@/lib/db";
import { safeRows } from "@/lib/admin-portal-data";
import { membershipId } from "@/lib/admin-users-shared";
import {
  parseReportReason,
  reportPriorityLabel,
  reportShortId,
  reportStatusLabel,
  reportTypeLabel,
  type FlagPerson,
  type FlagListRow,
  type FlagMessage,
  type FlagBooking,
  type FlagDetail,
} from "@/lib/admin-flags-shared";

export type {
  FlagPerson,
  FlagListRow,
  FlagMessage,
  FlagBooking,
  FlagDetail,
} from "@/lib/admin-flags-shared";

async function loadPerson(id: string | null | undefined): Promise<FlagPerson | null> {
  if (!id) return null;
  const rows = await safeRows<{
    id: string;
    name: string | null;
    role: string | null;
    phone: string | null;
  }>(
    `SELECT id::text AS id, name::text AS name, role::text AS role, phone::text AS phone
     FROM profiles WHERE id::text = $1 LIMIT 1`,
    [id]
  );
  const p = rows[0];
  if (!p) {
    return {
      id,
      name: null,
      role: null,
      phone: null,
      membership: membershipId(id),
    };
  }
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    phone: p.phone,
    membership: membershipId(p.id),
  };
}

async function resolveReportedUserId(opts: {
  targetType: string | null;
  targetId: string | null;
  reporterId: string | null;
  bookingId: string | null;
  messageSenderId: string | null;
}): Promise<string | null> {
  const t = String(opts.targetType || "").toLowerCase();
  if (t === "user_profile" && opts.targetId) return opts.targetId;
  if (opts.messageSenderId) return opts.messageSenderId;

  if (t === "conversation_message" || t === "conversation_image") {
    if (opts.bookingId && opts.reporterId) {
      const bookings = await safeRows<{
        customer_id: string | null;
        provider_id: string | null;
      }>(
        `SELECT customer_id::text AS customer_id, provider_id::text AS provider_id
         FROM bookings WHERE id::text = $1 LIMIT 1`,
        [opts.bookingId]
      );
      const b = bookings[0];
      if (b) {
        if (b.customer_id === opts.reporterId) return b.provider_id;
        if (b.provider_id === opts.reporterId) return b.customer_id;
        return b.provider_id || b.customer_id;
      }
    }
  }

  if (t === "haraj_item" && opts.targetId) {
    const rows = await safeRows<{ user_id: string | null }>(
      `SELECT user_id::text AS user_id FROM haraj_items WHERE id::text = $1 LIMIT 1`,
      [opts.targetId]
    );
    return rows[0]?.user_id || null;
  }

  if (t === "gallery_post" && opts.targetId) {
    const rows = await safeRows<{ user_id: string | null }>(
      `SELECT user_id::text AS user_id FROM gallery_posts WHERE id::text = $1 LIMIT 1`,
      [opts.targetId]
    );
    return rows[0]?.user_id || null;
  }

  if (t === "provider_service" && opts.targetId) {
    const rows = await safeRows<{ user_id: string | null; provider_id: string | null }>(
      `SELECT user_id::text AS user_id, provider_id::text AS provider_id
       FROM provider_services WHERE id::text = $1 LIMIT 1`,
      [opts.targetId]
    );
    return rows[0]?.user_id || rows[0]?.provider_id || null;
  }

  return null;
}

export async function listAdminFlags(opts?: {
  status?: "all" | "pending" | "closed";
  limit?: number;
}): Promise<FlagListRow[]> {
  const limit = Math.min(Math.max(opts?.limit ?? 100, 1), 300);
  const statusFilter = opts?.status || "all";

  let where = "";
  if (statusFilter === "pending") {
    where = `WHERE lower(COALESCE(status, 'open')) IN ('open','pending','new')`;
  } else if (statusFilter === "closed") {
    where = `WHERE lower(COALESCE(status, 'open')) NOT IN ('open','pending','new')`;
  }

  const rows = await safeRows<{
    id: string;
    target_type: string | null;
    target_id: string | null;
    reason: string | null;
    status: string | null;
    reporter_id: string | null;
    created_at: string | null;
  }>(
    `SELECT id::text AS id, target_type, target_id::text AS target_id, reason, status,
            reporter_id::text AS reporter_id, created_at::text AS created_at
     FROM content_reports
     ${where}
     ORDER BY created_at DESC NULLS LAST
     LIMIT ${limit}`
  );

  const msgTargetIds = rows
    .filter(
      (r) =>
        (r.target_type === "conversation_message" || r.target_type === "conversation_image") &&
        r.target_id
    )
    .map((r) => r.target_id!)
    .filter(Boolean);

  const msgMap = new Map<
    string,
    { sender_id: string | null; conversation_id: string | null }
  >();
  if (msgTargetIds.length) {
    const msgs = await safeRows<{
      id: string;
      sender_id: string | null;
      conversation_id: string | null;
    }>(
      `SELECT id::text AS id, sender_id::text AS sender_id, conversation_id::text AS conversation_id
       FROM messages WHERE id::text = ANY($1::text[])`,
      [msgTargetIds]
    );
    for (const m of msgs) msgMap.set(m.id, m);
  }

  const bookingIds = Array.from(
    new Set(
      rows
        .map((r) => parseReportReason(r.reason).bookingId)
        .filter((x): x is string => !!x)
    )
  );
  const bookingPartyMap = new Map<
    string,
    { customer_id: string | null; provider_id: string | null }
  >();
  if (bookingIds.length) {
    const bookings = await safeRows<{
      id: string;
      customer_id: string | null;
      provider_id: string | null;
    }>(
      `SELECT id::text AS id, customer_id::text AS customer_id, provider_id::text AS provider_id
       FROM bookings WHERE id::text = ANY($1::text[])`,
      [bookingIds]
    );
    for (const b of bookings) bookingPartyMap.set(b.id, b);
  }

  const reportedIds: Array<string | null> = [];
  const metas = rows.map((r) => {
    const meta = parseReportReason(r.reason);
    const msg = r.target_id ? msgMap.get(r.target_id) : undefined;
    const messageSenderId = msg?.sender_id || null;
    if (!meta.conversationId && msg?.conversation_id) {
      meta.conversationId = msg.conversation_id;
    }

    let reportedId: string | null = null;
    const t = String(r.target_type || "").toLowerCase();
    if (t === "user_profile" && r.target_id) reportedId = r.target_id;
    else if (messageSenderId) reportedId = messageSenderId;
    else if (
      (t === "conversation_message" || t === "conversation_image") &&
      meta.bookingId &&
      r.reporter_id
    ) {
      const b = bookingPartyMap.get(meta.bookingId);
      if (b) {
        if (b.customer_id === r.reporter_id) reportedId = b.provider_id;
        else if (b.provider_id === r.reporter_id) reportedId = b.customer_id;
        else reportedId = b.provider_id || b.customer_id;
      }
    }
    reportedIds.push(reportedId);
    return meta;
  });

  // For non-chat types still resolve owners (small extra queries only when needed)
  for (let i = 0; i < rows.length; i++) {
    if (reportedIds[i]) continue;
    reportedIds[i] = await resolveReportedUserId({
      targetType: rows[i].target_type,
      targetId: rows[i].target_id,
      reporterId: rows[i].reporter_id,
      bookingId: metas[i].bookingId,
      messageSenderId: null,
    });
  }

  const personIds = Array.from(
    new Set(
      [...rows.map((r) => r.reporter_id), ...reportedIds].filter((x): x is string => !!x)
    )
  );
  const personMap = new Map<string, FlagPerson>();
  if (personIds.length) {
    const profiles = await safeRows<{
      id: string;
      name: string | null;
      role: string | null;
      phone: string | null;
    }>(
      `SELECT id::text AS id, name::text AS name, role::text AS role, phone::text AS phone
       FROM profiles WHERE id::text = ANY($1::text[])`,
      [personIds]
    );
    for (const p of profiles) {
      personMap.set(p.id, {
        id: p.id,
        name: p.name,
        role: p.role,
        phone: p.phone,
        membership: membershipId(p.id),
      });
    }
    for (const id of personIds) {
      if (!personMap.has(id)) {
        personMap.set(id, {
          id,
          name: null,
          role: null,
          phone: null,
          membership: membershipId(id),
        });
      }
    }
  }

  return rows.map((r, i) => {
    const meta = metas[i];
    const reportedId = reportedIds[i];
    return {
      id: r.id,
      shortId: reportShortId(r.id),
      targetType: r.target_type,
      targetTypeLabelAr: reportTypeLabel(true, r.target_type),
      targetTypeLabelEn: reportTypeLabel(false, r.target_type),
      targetId: r.target_id,
      reasonRaw: r.reason,
      reasonHuman: meta.humanReason,
      status: r.status,
      statusLabelAr: reportStatusLabel(true, r.status),
      statusLabelEn: reportStatusLabel(false, r.status),
      reporter: r.reporter_id ? personMap.get(r.reporter_id) || null : null,
      reported: reportedId ? personMap.get(reportedId) || null : null,
      createdAt: r.created_at,
      bookingId: meta.bookingId,
      conversationId: meta.conversationId,
    };
  });
}

async function loadBooking(bookingId: string | null): Promise<FlagBooking | null> {
  if (!bookingId) return null;
  const rows = await safeRows<{
    id: string;
    booking_number: string | null;
    status: string | null;
    customer_id: string | null;
    provider_id: string | null;
    service_title: string | null;
  }>(
    `SELECT b.id::text AS id,
            b.booking_number::text AS booking_number,
            b.status,
            b.customer_id::text AS customer_id,
            b.provider_id::text AS provider_id,
            ps.title::text AS service_title
     FROM bookings b
     LEFT JOIN provider_services ps ON ps.id = b.provider_service_id
     WHERE b.id::text = $1
     LIMIT 1`,
    [bookingId]
  );
  const b = rows[0];
  if (!b) return null;
  const [customer, provider] = await Promise.all([
    loadPerson(b.customer_id),
    loadPerson(b.provider_id),
  ]);
  return {
    id: b.id,
    bookingNumber: b.booking_number,
    status: b.status,
    serviceTitle: b.service_title,
    customer,
    provider,
  };
}

async function loadMessageContext(
  targetMessageId: string | null,
  conversationId: string | null,
  radius = 4
): Promise<FlagMessage[]> {
  if (!targetMessageId && !conversationId) return [];

  let convId = conversationId;
  let targetCreatedAt: string | null = null;

  if (targetMessageId) {
    const target = await safeRows<{
      conversation_id: string | null;
      created_at: string | null;
    }>(
      `SELECT conversation_id::text AS conversation_id, created_at::text AS created_at
       FROM messages WHERE id::text = $1 LIMIT 1`,
      [targetMessageId]
    );
    if (target[0]) {
      convId = target[0].conversation_id || convId;
      targetCreatedAt = target[0].created_at;
    }
  }

  if (!convId) return [];

  // Fetch a window around the target; fall back to latest messages in the conversation.
  const rows = targetCreatedAt
    ? await safeRows<{
        id: string;
        sender_id: string | null;
        sender_role: string | null;
        content: string | null;
        media_url: string | null;
        media_type: string | null;
        moderation_status: string | null;
        created_at: string | null;
      }>(
        `WITH ordered AS (
           SELECT id::text AS id, sender_id::text AS sender_id, sender_role, content,
                  media_url, media_type, moderation_status, created_at::text AS created_at,
                  ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
           FROM messages
           WHERE conversation_id::text = $1
         ),
         target AS (
           SELECT rn FROM ordered WHERE id = $2 LIMIT 1
         )
         SELECT o.id, o.sender_id, o.sender_role, o.content, o.media_url, o.media_type,
                o.moderation_status, o.created_at
         FROM ordered o, target t
         WHERE o.rn BETWEEN t.rn - $3 AND t.rn + $3
         ORDER BY o.created_at ASC, o.id ASC`,
        [convId, targetMessageId, radius]
      )
    : await safeRows<{
        id: string;
        sender_id: string | null;
        sender_role: string | null;
        content: string | null;
        media_url: string | null;
        media_type: string | null;
        moderation_status: string | null;
        created_at: string | null;
      }>(
        `SELECT id::text AS id, sender_id::text AS sender_id, sender_role, content,
                media_url, media_type, moderation_status, created_at::text AS created_at
         FROM messages
         WHERE conversation_id::text = $1
         ORDER BY created_at DESC
         LIMIT 11`,
        [convId]
      );

  const sorted = targetCreatedAt
    ? rows
    : [...rows].reverse();

  const senderIds = Array.from(
    new Set(sorted.map((m) => m.sender_id).filter((x): x is string => !!x))
  );
  const nameMap = new Map<string, string | null>();
  if (senderIds.length) {
    const profiles = await safeRows<{ id: string; name: string | null }>(
      `SELECT id::text AS id, name::text AS name FROM profiles WHERE id::text = ANY($1::text[])`,
      [senderIds]
    );
    for (const p of profiles) nameMap.set(p.id, p.name);
  }

  return sorted.map((m) => ({
    id: m.id,
    senderId: m.sender_id,
    senderName: m.sender_id ? nameMap.get(m.sender_id) ?? null : null,
    senderRole: m.sender_role,
    content: m.content,
    mediaUrl: m.media_url,
    mediaType: m.media_type,
    moderationStatus: m.moderation_status,
    createdAt: m.created_at,
    isTarget: !!targetMessageId && m.id === targetMessageId,
  }));
}

export async function getAdminFlagDetail(id: string): Promise<FlagDetail | null> {
  const rows = await safeRows<{
    id: string;
    reporter_id: string | null;
    target_type: string | null;
    target_id: string | null;
    reason: string | null;
    details: string | null;
    status: string | null;
    created_at: string | null;
    reviewed_at: string | null;
    auto_hidden: boolean | null;
  }>(
    `SELECT id::text AS id, reporter_id::text AS reporter_id, target_type,
            target_id::text AS target_id, reason, details, status,
            created_at::text AS created_at, reviewed_at::text AS reviewed_at,
            auto_hidden
     FROM content_reports
     WHERE id::text = $1
     LIMIT 1`,
    [id]
  );
  const r = rows[0];
  if (!r) return null;

  const meta = parseReportReason(r.reason);
  let messageSenderId: string | null = null;
  let messageExists = false;
  let messageMediaUrl: string | null = null;
  let messageMediaType: string | null = null;

  if (
    (r.target_type === "conversation_message" || r.target_type === "conversation_image") &&
    r.target_id
  ) {
    const msgs = await safeRows<{
      sender_id: string | null;
      conversation_id: string | null;
      media_url: string | null;
      media_type: string | null;
    }>(
      `SELECT sender_id::text AS sender_id, conversation_id::text AS conversation_id,
              media_url, media_type
       FROM messages WHERE id::text = $1 LIMIT 1`,
      [r.target_id]
    );
    if (msgs[0]) {
      messageExists = true;
      messageSenderId = msgs[0].sender_id;
      messageMediaUrl = msgs[0].media_url;
      messageMediaType = msgs[0].media_type;
      if (!meta.conversationId) meta.conversationId = msgs[0].conversation_id;
    }
  }

  // Prefer conversation.booking_id when reason lacked booking_id
  if (!meta.bookingId && meta.conversationId) {
    const convs = await safeRows<{ booking_id: string | null }>(
      `SELECT booking_id::text AS booking_id FROM conversations WHERE id::text = $1 LIMIT 1`,
      [meta.conversationId]
    );
    if (convs[0]?.booking_id) meta.bookingId = convs[0].booking_id;
  }

  const reportedId = await resolveReportedUserId({
    targetType: r.target_type,
    targetId: r.target_id,
    reporterId: r.reporter_id,
    bookingId: meta.bookingId,
    messageSenderId,
  });

  const [reporter, reported, booking, messages] = await Promise.all([
    loadPerson(r.reporter_id),
    loadPerson(reportedId),
    loadBooking(meta.bookingId),
    loadMessageContext(
      r.target_type === "conversation_message" || r.target_type === "conversation_image"
        ? r.target_id
        : null,
      meta.conversationId,
      4
    ),
  ]);

  const evidence: FlagDetail["evidence"] = [];
  if (messageMediaUrl) {
    evidence.push({
      kind: messageMediaType || "media",
      url: messageMediaUrl,
      label:
        messageMediaType === "voice" || messageMediaType === "audio"
          ? "تسجيل صوتي"
          : messageMediaType === "image"
            ? "صورة"
            : "مرفق",
    });
  }
  for (const m of messages) {
    if (m.mediaUrl && m.mediaUrl !== messageMediaUrl) {
      evidence.push({
        kind: m.mediaType || "media",
        url: m.mediaUrl,
        label: m.isTarget ? "مرفق الرسالة المبلّغ عنها" : "مرفق من السياق",
      });
    }
  }

  const isMsgType =
    r.target_type === "conversation_message" || r.target_type === "conversation_image";

  let canDeleteMessage = isMsgType && messageExists;
  let deleteMessageDisabledReasonAr: string | null = null;
  let deleteMessageDisabledReasonEn: string | null = null;
  if (!isMsgType) {
    deleteMessageDisabledReasonAr = "هذا البلاغ ليس عن رسالة محادثة.";
    deleteMessageDisabledReasonEn = "This report is not about a chat message.";
  } else if (!messageExists) {
    deleteMessageDisabledReasonAr = "الرسالة غير موجودة في قاعدة البيانات (ربما حُذفت).";
    deleteMessageDisabledReasonEn = "Message not found in the database (may already be deleted).";
  }

  let canMuteConversation = !!meta.conversationId;
  let muteDisabledReasonAr: string | null = null;
  let muteDisabledReasonEn: string | null = null;
  if (!meta.conversationId) {
    muteDisabledReasonAr = "لا يوجد معرّف محادثة مرتبط بهذا البلاغ.";
    muteDisabledReasonEn = "No conversation id is linked to this report.";
  } else {
    const convs = await safeRows<{ id: string; status: string | null }>(
      `SELECT id::text AS id, status FROM conversations WHERE id::text = $1 LIMIT 1`,
      [meta.conversationId]
    );
    if (!convs[0]) {
      canMuteConversation = false;
      muteDisabledReasonAr = "المحادثة غير موجودة في قاعدة البيانات.";
      muteDisabledReasonEn = "Conversation row not found.";
    } else if (String(convs[0].status || "").toLowerCase() === "muted_by_admin") {
      muteDisabledReasonAr = "المحادثة مكتومة مسبقاً بواسطة الإدارة.";
      muteDisabledReasonEn = "Conversation is already muted by admin.";
      canMuteConversation = false;
    }
  }

  const canActOnReportedAccount = !!reportedId;
  let reportedAccountDisabledReasonAr: string | null = null;
  let reportedAccountDisabledReasonEn: string | null = null;
  if (!reportedId) {
    reportedAccountDisabledReasonAr =
      "تعذر تحديد المبلّغ عليه (الرسالة/الحجز غير متوفرين).";
    reportedAccountDisabledReasonEn =
      "Could not resolve the reported user (message/booking missing).";
  }

  return {
    id: r.id,
    shortId: reportShortId(r.id),
    targetType: r.target_type,
    targetTypeLabelAr: reportTypeLabel(true, r.target_type),
    targetTypeLabelEn: reportTypeLabel(false, r.target_type),
    targetId: r.target_id,
    reasonRaw: r.reason,
    reasonHuman: meta.humanReason,
    details: r.details,
    status: r.status,
    statusLabelAr: reportStatusLabel(true, r.status),
    statusLabelEn: reportStatusLabel(false, r.status),
    priorityLabelAr: reportPriorityLabel(true),
    priorityLabelEn: reportPriorityLabel(false),
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
    autoHidden: r.auto_hidden,
    reporter,
    reported,
    booking,
    conversationId: meta.conversationId,
    messages,
    evidence,
    capabilities: {
      canDeleteMessage,
      deleteMessageDisabledReasonAr,
      deleteMessageDisabledReasonEn,
      canMuteConversation,
      muteDisabledReasonAr,
      muteDisabledReasonEn,
      canActOnReportedAccount,
      reportedAccountDisabledReasonAr,
      reportedAccountDisabledReasonEn,
    },
  };
}

export async function markReportReviewed(opts: {
  id: string;
  status: string;
  adminUsername: string;
  note?: string;
}) {
  await db.query(
    `UPDATE content_reports
     SET status = $2,
         reviewed_at = NOW()
     WHERE id::text = $1`,
    [opts.id, opts.status]
  );
  void opts.adminUsername;
  void opts.note;
}
