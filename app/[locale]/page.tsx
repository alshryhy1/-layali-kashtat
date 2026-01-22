import * as React from "react";
import InstallPrompt from "@/components/InstallPrompt";
import { Plus, UserPlus, LayoutDashboard, Search, FileText, Headphones } from "lucide-react";

export const dynamic = "force-dynamic";

type Locale = "ar" | "en";

function asLocale(v: any): Locale {
  return String(v || "").trim().toLowerCase() === "en" ? "en" : "ar";
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const p = await params;
  const locale: Locale = asLocale(p?.locale);
  const isEn = locale === "en";

  const t = {
    title: isEn ? "Layali Kashtat" : "ليالي كشتات",
    desc: isEn
      ? "A simple platform to organize requests and connect service providers with customers."
      : "منصة تقنية بسيطة لتنظيم الطلبات والتواصل بين مقدمي الخدمات والعملاء.",
    request: isEn ? "Request Service (Customers)" : "طلب خدمة (للعملاء)",
    signup: isEn ? "Provider Signup" : "تسجيل مقدم خدمة",
    providerDashboard: isEn ? "Provider Dashboard" : "لوحة إدارة مقدم الخدمة",
    status: isEn ? "Track Request" : "متابعة الطلب",
    legal: isEn ? "Legal Texts" : "النصوص القانونية",
    support: isEn ? "Support & Contact" : "الدعم الفني والتواصل",
  };

  const btnBase: React.CSSProperties = {
    width: "100%",
    minHeight: 48,
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    textAlign: "center",
    boxSizing: "border-box",
    fontSize: 15,
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    border: "1px solid #92400e",
    background: "#92400e",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(146, 64, 14, 0.3)",
  };

  const btnGhost: React.CSSProperties = {
    ...btnBase,
    minHeight: 46,
    fontWeight: 700,
    border: "1px solid rgba(146, 64, 14, 0.2)",
    background: "rgba(146, 64, 14, 0.08)",
    color: "#92400e",
  };

  return (
    <section
      dir={isEn ? "ltr" : "rtl"}
      style={{
        width: "100%",
        minHeight: "100vh",
        paddingTop: 80,
        paddingBottom: 40,
        paddingInline: 16,
        background: "linear-gradient(135deg, #fdfbf7 0%, #d4c5b0 100%)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 600, marginInline: "auto" }}>
        <div
          className="card home-card"
          style={{
            textAlign: "center",
            padding: "32px 24px",
            borderRadius: 32,
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.6)",
          }}
        >
          <div style={{ width: "100%", marginInline: "auto" }}>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 900,
                lineHeight: "1.2",
                letterSpacing: isEn ? -0.5 : 0,
              }}
            >
              {t.title}
            </h1>

            <p
              style={{
                margin: "12px 0 24px",
                opacity: 0.7,
                fontSize: 15,
                lineHeight: "1.5",
                maxWidth: 400,
                marginInline: "auto",
              }}
            >
              {t.desc}
            </p>

            <div
              className="home-actions"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <a href={`/${locale}/request`} style={btnPrimary}>
                <Plus size={20} strokeWidth={2.5} />
                <span>{t.request}</span>
              </a>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <a href={`/${locale}/providers/signup`} style={btnGhost}>
                  <UserPlus size={18} />
                  <span>{t.signup}</span>
                </a>

                <a href={`/${locale}/providers/dashboard`} style={btnGhost}>
                  <LayoutDashboard size={18} />
                  <span>{t.providerDashboard}</span>
                </a>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <a href={`/${locale}/providers/status`} style={btnGhost}>
                  <Search size={18} />
                  <span>{t.status}</span>
                </a>

                <a href={`/${locale}/legal`} style={btnGhost}>
                  <FileText size={18} />
                  <span>{t.legal}</span>
                </a>
              </div>

              <a href={`/${locale}/contact`} style={btnGhost}>
                <Headphones size={18} />
                <span>{t.support}</span>
              </a>
            </div>
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
              .home-card { box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
            `,
            }}
          />
        </div>
        
        {/* Version Marker for Verification */}
        <div style={{ marginTop: 20, textAlign: "center", opacity: 0.3, fontSize: 10 }}>
          v2.1
        </div>

        <InstallPrompt />
      </div>
    </section>
  );
}
