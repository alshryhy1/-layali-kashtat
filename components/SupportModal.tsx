"use client";
import React, { useState } from "react";
import { Mail, Phone, Copy, Check, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

// Simple WhatsApp Icon SVG since lucide might not have it or it's named differently
function WhatsAppIcon({ size = 24, color = "currentColor" }: { size?: number, color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382C17.112 14.382 16.392 14.382 14.232 14.382C13.872 14.382 13.512 14.742 13.512 15.102C13.512 15.462 13.872 16.902 14.232 17.262C14.592 17.622 15.312 17.622 16.392 17.622C17.472 17.622 18.192 17.622 18.192 16.542C18.192 15.462 18.192 14.382 17.472 14.382Z" fill={color} />
      <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.373 0 0 5.373 0 12C0 14.084 0.536 16.037 1.472 17.756L0.26 22.18L4.856 21.03C6.486 21.866 8.324 22.308 10.224 22.308H10.23C16.852 22.308 22.224 16.936 22.224 10.314C22.224 3.692 16.852 0 10.224 0H12ZM10.224 18.57C8.616 18.57 7.038 18.138 5.664 17.322L5.34 17.13L3.18 17.7L3.756 15.54L3.54 15.204C2.628 13.788 2.148 12.15 2.148 10.314C2.148 5.862 5.772 2.238 10.224 2.238C14.676 2.238 18.3 5.862 18.3 10.314C18.3 14.766 14.676 18.57 10.224 18.57Z" fill={color}/>
    </svg>
  );
}

interface SupportModalProps {
  onClose: () => void;
  isAr: boolean;
  refId?: string;
}

const faqs = [
  {
    q_ar: "كيف يمكنني إلغاء الطلب؟",
    q_en: "How can I cancel my request?",
    a_ar: "يمكنك إلغاء الطلب من خلال صفحة التتبع قبل قبول مقدم الخدمة للطلب. بعد القبول، يرجى التواصل مع الدعم.",
    a_en: "You can cancel via the tracking page before the provider accepts. After acceptance, please contact support."
  },
  {
    q_ar: "ما هي طرق الدفع المتاحة؟",
    q_en: "What are the available payment methods?",
    a_ar: "الدفع يتم نقداً أو تحويل بنكي لمقدم الخدمة مباشرة عند الوصول.",
    a_en: "Payment is made in cash or bank transfer directly to the provider upon arrival."
  },
  {
    q_ar: "كيف أتواصل مع مقدم الخدمة؟",
    q_en: "How do I contact the provider?",
    a_ar: "بعد قبول الطلب، ستظهر بيانات التواصل الخاصة بمقدم الخدمة في صفحة التتبع.",
    a_en: "After approval, provider contact details will appear on the tracking page."
  }
];

function FAQItem({ q, a }: { q: string, a: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #f1f5f9' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'start'
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{q}</span>
        {isOpen ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
      </button>
      {isOpen && (
        <div style={{ padding: '8px 12px 12px', fontSize: 12.5, lineHeight: 1.6, color: '#475569', textAlign: 'start', background: '#f8fafc', borderRadius: 8, marginTop: 4 }}>
          {a}
        </div>
      )}
    </div>
  );
}

export function SupportView({ isAr, refId }: { isAr: boolean; refId?: string }) {
  const [copied, setCopied] = useState(false);

  const copyRef = async () => {
    if (!refId) return;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(refId);
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = refId;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, refId.length);
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20, fontWeight: 800 }}>
        {isAr ? "الدعم والمساعدة" : "Support & Help"}
      </h3>
      
      {refId && (
        <div 
          onClick={copyRef}
          style={{ 
            marginBottom: 20, padding: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0',
            cursor: 'pointer', transition: 'background 0.2s', position: 'relative'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
        >
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 700 }}>
            {isAr ? "رقم الطلب (للدعم)" : "Reference ID (For Support)"}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{refId}</span>
            <button 
              type="button"
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                color: copied ? '#22c55e' : '#94a3b8', transition: 'color 0.2s',
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{isAr ? "تم النسخ" : "Copied"}</span>
                </>
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        <a 
          href="tel:+966534710749" 
          style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '12px', borderRadius: 16, background: '#111', color: 'white', 
            textDecoration: 'none', fontWeight: 800, transition: 'opacity 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={20} />
            <span>{isAr ? "اتصال مباشر" : "Call Support"}</span>
          </div>
          <span dir="ltr" style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>053 471 0749</span>
        </a>

        <a 
          href="https://wa.me/966534710749" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '16px', borderRadius: 16, background: '#25D366', color: 'white', 
            textDecoration: 'none', fontWeight: 800, transition: 'opacity 0.2s'
          }}
        >
          <WhatsAppIcon size={24} color="white" />
          {isAr ? "محادثة واتساب" : "WhatsApp Chat"}
        </a>

        <a 
          href="mailto:support@layalikashtat.com" 
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '16px', borderRadius: 16, background: '#f1f5f9', color: '#1e293b', 
            textDecoration: 'none', fontWeight: 800, transition: 'background 0.2s'
          }}
        >
          <Mail size={24} />
          {isAr ? "إرسال بريد إلكتروني" : "Send Email"}
        </a>
      </div>

      <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800, textAlign: isAr ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
          <HelpCircle size={18} />
          {isAr ? "أسئلة شائعة" : "Common Questions"}
        </h4>
        <div dir={isAr ? "rtl" : "ltr"}>
          {faqs.map((item, i) => (
            <FAQItem 
              key={i} 
              q={isAr ? item.q_ar : item.q_en} 
              a={isAr ? item.a_ar : item.a_en} 
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default function SupportModal({ onClose, isAr, refId }: SupportModalProps) {
  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }} 
      onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 340, textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <SupportView isAr={isAr} refId={refId} />

        <button 
          onClick={onClose} 
          style={{ 
            marginTop: 24, background: 'transparent', border: 'none', 
            color: '#64748b', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            padding: '8px 16px'
          }}
        >
          {isAr ? "إغلاق" : "Close"}
        </button>
      </div>
    </div>
  );
}
