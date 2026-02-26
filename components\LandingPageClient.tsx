"use client";

import * as React from "react";
import Link from "next/link";
import { User, Briefcase, X } from "lucide-react";

type Locale = "ar" | "en";

export default function LandingPageClient({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const [modal, setModal] = React.useState<"login" | "register" | null>(null);

  const t = {
    title: isAr ? "ليالي كشتات" : "Layali Kashtat",
    desc: isAr ? "منصة خدمات الكشتات والرحلات" : "Kashtat & Trips Services Platform",
    login: isAr ? "تسجيل الدخول" : "Login",
    register: isAr ? "تسجيل جديد" : "New Registration",
    loginAs: isAr ? "تسجيل الدخول كـ" : "Login as",
    registerAs: isAr ? "تسجيل جديد كـ" : "Register as",
    customer: isAr ? "عميل" : "Customer",
    provider: isAr ? "مقدم خدمة" : "Service Provider",
    customerDesc: isAr ? "لطلب الخدمات والاستمتاع بالرحلات" : "To request services and enjoy trips",
    providerDesc: isAr ? "لتقديم الخدمات وزيادة الدخل" : "To provide services and earn income",
    cancel: isAr ? "إلغاء" : "Cancel",
  };

  const closeModal = () => setModal(null);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#fdfbf7] to-[#d4c5b0] p-4"
    >
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-8 text-center relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#92400e]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#92400e]/10 rounded-full blur-3xl pointer-events-none" />

        <h1 className="text-3xl font-black text-[#333] mb-2 relative z-10">{t.title}</h1>
        <p className="text-[#666] mb-10 text-sm font-medium relative z-10">{t.desc}</p>

        <div className="flex flex-col gap-4 relative z-10">
          <button
            onClick={() => setModal("login")}
            className="w-full h-14 rounded-xl bg-[#92400e] text-white font-bold text-lg shadow-lg shadow-[#92400e]/20 hover:bg-[#78350b] transition-transform active:scale-95 flex items-center justify-center"
          >
            {t.login}
          </button>
          
          <button
            onClick={() => setModal("register")}
            className="w-full h-14 rounded-xl bg-white border-2 border-[#92400e]/20 text-[#92400e] font-bold text-lg hover:bg-[#92400e]/5 transition-transform active:scale-95 flex items-center justify-center"
          >
            {t.register}
          </button>

          <Link
            href={`/${locale}/haraj`}
            className="text-sm font-semibold text-gray-500 hover:text-[#92400e] hover:underline transition-colors mt-2"
          >
            {isAr ? "تصفح الحراج كزائر" : "Browse Haraj as Guest"}
          </Link>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">
                {modal === "login" ? t.loginAs : t.registerAs}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <Link
                href={modal === "login" ? `/${locale}/customer/login` : `/${locale}/customer/login?view=signup`}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#92400e] hover:bg-[#92400e]/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-[#92400e] group-hover:text-white transition-colors">
                  <User size={24} />
                </div>
                <div className="text-start">
                  <div className="font-bold text-gray-900 group-hover:text-[#92400e]">{t.customer}</div>
                  <div className="text-xs text-gray-500">{t.customerDesc}</div>
                </div>
              </Link>

              <Link
                href={modal === "login" ? `/${locale}/providers/login` : `/${locale}/providers/signup`}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#92400e] hover:bg-[#92400e]/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-[#92400e] group-hover:text-white transition-colors">
                  <Briefcase size={24} />
                </div>
                <div className="text-start">
                  <div className="font-bold text-gray-900 group-hover:text-[#92400e]">{t.provider}</div>
                  <div className="text-xs text-gray-500">{t.providerDesc}</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
