import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Code, Database, Server, Layout, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "ملف المطور | Developer Profile",
};

export const dynamic = "force-dynamic";

export default async function DeveloperPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";

  return (
    <div className="page-container" dir={isAr ? "rtl" : "ltr"}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
        
        {/* Header Card */}
        <div style={{
          background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
          color: "white",
          borderRadius: 24,
          padding: 40,
          textAlign: "center",
          marginBottom: 32,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
        }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>
            {isAr ? "حسن خميس الشمري" : "Hassan Khamis Al-Shammari"}
          </h1>
          <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 24 }}>
            {isAr ? "مطور واجهات وتطبيقات ويب شامل (Full Stack Developer)" : "Full Stack Web Developer"}
          </p>
          <div style={{ display: "inline-block", padding: "8px 16px", background: "rgba(255,255,255,0.1)", borderRadius: 100, fontSize: 14 }}>
            {isAr ? "المطور والمؤسس لمنصة ليالي كشتات" : "Founder & Lead Developer of Layali Kashtat"}
          </div>
        </div>

        {/* Tech Stack */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, textAlign: "center" }}>
            {isAr ? "التقنيات المستخدمة في المشروع" : "Project Tech Stack"}
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { icon: <Layout />, title: "Next.js 15 & React", desc: isAr ? "أحدث تقنيات الواجهات" : "Latest UI Framework" },
              { icon: <Database />, title: "Supabase (PostgreSQL)", desc: isAr ? "قاعدة بيانات سحابية" : "Cloud Database" },
              { icon: <Server />, title: "Vercel Edge", desc: isAr ? "استضافة سحابية عالية الأداء" : "High Performance Hosting" },
              { icon: <Code />, title: "TypeScript", desc: isAr ? "برمجة آمنة ومنظمة" : "Type-Safe Code" },
              { icon: <Shield />, title: "Secure Auth", desc: isAr ? "نظام حماية وتشفير" : "Security & Encryption" },
            ].map((item, i) => (
              <div key={i} style={{ background: "white", padding: 20, borderRadius: 16, border: "1px solid #e5e7eb", textAlign: "center" }}>
                <div style={{ color: "#92400e", marginBottom: 12, display: "flex", justifyContent: "center" }}>{item.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Statement */}
        <div style={{ background: "#fffbeb", padding: 24, borderRadius: 16, border: "1px dashed #f59e0b", lineHeight: 1.8 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: "#92400e" }}>
            {isAr ? "إثبات الملكية والتطوير" : "Ownership & Development Proof"}
          </h3>
          <p style={{ margin: 0, color: "#78350f" }}>
            {isAr 
              ? "تم تطوير هذه المنصة بالكامل بواسطة المطور حسن خميس الشمري، كجزء من أعمال التطوير البرمجي الحر. جميع الحقوق الفكرية والبرمجية محفوظة."
              : "This platform was fully developed by Hassan Khamis Al-Shammari as part of freelance software development work. All intellectual property rights reserved."}
          </p>
        </div>

        <div style={{ marginTop: 40, textAlign: "center" }}>
          <Link href={`/${locale}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#6b7280", textDecoration: "none", fontWeight: 600 }}>
             {isAr ? <ArrowRight size={20} /> : null}
             {isAr ? "العودة للرئيسية" : "Back to Home"}
             {!isAr ? <ArrowRight size={20} /> : null}
          </Link>
        </div>

      </div>
    </div>
  );
}
