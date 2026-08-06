import { localeHref } from "@/lib/locales";

export type AdminSection = {
  key: string;
  href: string;
  icon: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  /** When true, page may be a stub until backend wiring exists */
  mayBeStub?: boolean;
};

/** Management hub cards — paths are locale-agnostic; use sectionHref() for links. */
export const ADMIN_SECTIONS: AdminSection[] = [
  {
    key: "users",
    href: "/admin/users",
    icon: "👥",
    titleAr: "إدارة المستخدمين",
    titleEn: "Users",
    descAr: "الحسابات والملفات الشخصية",
    descEn: "Accounts and profiles",
  },
  {
    key: "services",
    href: "/admin/services",
    icon: "🏕️",
    titleAr: "إدارة الخدمات",
    titleEn: "Services",
    descAr: "خدمات مقدّمي الكشتات",
    descEn: "Provider camping services",
  },
  {
    key: "haraj",
    href: "/admin/haraj",
    icon: "📦",
    titleAr: "إدارة الحراج",
    titleEn: "Haraj",
    descAr: "إعلانات السوق",
    descEn: "Marketplace listings",
  },
  {
    key: "gallery",
    href: "/admin/gallery",
    icon: "🖼️",
    titleAr: "إدارة المعرض",
    titleEn: "Gallery",
    descAr: "منشورات الصور واللحظات",
    descEn: "Photo posts and moments",
  },
  {
    key: "fazaa",
    href: "/admin/fazaa",
    icon: "🆘",
    titleAr: "إدارة الفزعات/الطلبات",
    titleEn: "Help & Requests",
    descAr: "فزعات المجتمع وطلبات العملاء",
    descEn: "Community help and customer requests",
  },
  {
    key: "chats",
    href: "/admin/chats",
    icon: "💬",
    titleAr: "إدارة المحادثات",
    titleEn: "Chats",
    descAr: "قنوات ومحادثات الحجوزات",
    descEn: "Booking conversations",
    mayBeStub: true,
  },
  {
    key: "community",
    href: "/admin/community",
    icon: "📝",
    titleAr: "إدارة المجتمع",
    titleEn: "Community",
    descAr: "منشورات المجتمع والتنبيهات",
    descEn: "Community posts and alerts",
  },
  {
    key: "flags",
    href: "/admin/flags",
    icon: "🚩",
    titleAr: "إدارة البلاغات",
    titleEn: "Flags",
    descAr: "مراجعة البلاغات مع سياق الرسالة والإجراءات",
    descEn: "Review reports with message context and actions",
  },
  {
    key: "moderation",
    href: "/admin/moderation",
    icon: "⭐",
    titleAr: "مراجعة الخدمات قبل النشر",
    titleEn: "Service moderation",
    descAr: "اعتماد الخدمات قبل الظهور",
    descEn: "Approve services before publish",
  },
  {
    key: "payments",
    href: "/admin/payments",
    icon: "💳",
    titleAr: "المدفوعات والعمولات",
    titleEn: "Payments & commissions",
    descAr: "حجوزات ودفعات وعمولة الحراج",
    descEn: "Bookings, payments, haraj commission",
    mayBeStub: true,
  },
  {
    key: "announcements",
    href: "/admin/announcements",
    icon: "📢",
    titleAr: "الإشعارات",
    titleEn: "Announcements",
    descAr: "بنر الموقع والإعلانات",
    descEn: "Site banner announcements",
  },
  {
    key: "settings",
    href: "/admin/settings",
    icon: "⚙️",
    titleAr: "إعدادات الموقع",
    titleEn: "Site settings",
    descAr: "المشرفون وإعدادات الإدارة",
    descEn: "Admins and admin settings",
  },
  {
    key: "weather",
    href: "/admin/weather",
    icon: "🌤️",
    titleAr: "الطقس والمدن",
    titleEn: "Weather & cities",
    descAr: "المدن المعروضة ومصدر الطقس",
    descEn: "Displayed cities and weather source",
  },
  {
    key: "reports",
    href: "/admin/reports",
    icon: "📊",
    titleAr: "التقارير / الإحصائيات",
    titleEn: "Reports / Analytics",
    descAr: "الزيارات، التحميلات، ومؤشرات الأداء",
    descEn: "Visits, downloads, and KPIs",
  },
];

export function sectionHref(locale: string, path: string) {
  return localeHref(locale, path);
}
