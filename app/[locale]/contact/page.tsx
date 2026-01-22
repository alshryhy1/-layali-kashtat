import * as React from "react";
import Link from "next/link";
import { Mail, Phone, MessageCircle, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function WhatsAppIcon({ size = 24, color = "currentColor" }: { size?: number, color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382C17.112 14.382 16.392 14.382 14.232 14.382C13.872 14.382 13.512 14.742 13.512 15.102C13.512 15.462 13.872 16.902 14.232 17.262C14.592 17.622 15.312 17.622 16.392 17.622C17.472 17.622 18.192 17.622 18.192 16.542C18.192 15.462 18.192 14.382 17.472 14.382Z" fill={color} />
      <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.373 0 0 5.373 0 12C0 14.084 0.536 16.037 1.472 17.756L0.26 22.18L4.856 21.03C6.486 21.866 8.324 22.308 10.224 22.308H10.23C16.852 22.308 22.224 16.936 22.224 10.314C22.224 3.692 16.852 0 10.224 0H12ZM10.224 18.57C8.616 18.57 7.038 18.138 5.664 17.322L5.34 17.13L3.18 17.7L3.756 15.54L3.54 15.204C2.628 13.788 2.148 12.15 2.148 10.314C2.148 5.862 5.772 2.238 10.224 2.238C14.676 2.238 18.3 5.862 18.3 10.314C18.3 14.766 14.676 18.57 10.224 18.57Z" fill={color}/>
    </svg>
  );
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale = p?.locale === "en" ? "en" : "ar";
  const isAr = locale === "ar";

  const t = {
    title: isAr ? "الدعم الفني والمساعدة" : "Support & Help",
    subtitle: isAr
      ? "نحن هنا لمساعدتك. تواصل معنا عبر القنوات التالية."
      : "We are here to help. Contact us via the following channels.",
    call: isAr ? "اتصال مباشر" : "Call Support",
    whatsapp: isAr ? "محادثة واتساب" : "WhatsApp Chat",
    email: isAr ? "البريد الإلكتروني" : "Email Support",
    back: isAr ? "العودة للرئيسية" : "Back to Home",
  };

  const contactMethods = [
    {
      icon: <Phone size={24} />,
      label: t.call,
      value: "053 471 0749",
      href: "tel:+966534710749",
      bg: "#111",
      color: "#fff",
    },
    {
      icon: <WhatsAppIcon size={24} color="#fff" />,
      label: t.whatsapp,
      value: "053 471 0749",
      href: "https://wa.me/966534710749",
      bg: "#25D366",
      color: "#fff",
    },
    {
      icon: <Mail size={24} />,
      label: t.email,
      value: "support@layalikashtat.com",
      href: "mailto:support@layalikashtat.com",
      bg: "#f1f5f9",
      color: "#1e293b",
    },
  ];

  return (
    <main
      dir={isAr ? "rtl" : "ltr"}
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "40px 20px",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>{t.title}</h1>
        <p style={{ fontSize: 16, color: "#666", lineHeight: 1.6 }}>{t.subtitle}</p>
      </div>

      <div style={{ width: "100%", display: "grid", gap: 16 }}>
        {contactMethods.map((method, idx) => (
          <a
            key={idx}
            href={method.href}
            target={method.href.startsWith("http") ? "_blank" : undefined}
            rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px",
              borderRadius: 20,
              background: method.bg,
              color: method.color,
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              transition: "transform 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {method.icon}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 16, fontWeight: 800 }}>{method.label}</span>
                <span style={{ fontSize: 14, opacity: 0.9, fontFamily: "monospace" }}>
                  {method.value}
                </span>
              </div>
            </div>
            {isAr ? <ChevronUp style={{ transform: "rotate(90deg)" }} /> : <ChevronUp style={{ transform: "rotate(90deg)" }} />}
          </a>
        ))}
      </div>

      <div style={{ marginTop: 40 }}>
        <Link
          href={`/${locale}`}
          style={{
            textDecoration: "underline",
            color: "#666",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {t.back}
        </Link>
      </div>
    </main>
  );
}
