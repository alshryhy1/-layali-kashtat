"use client";

import { useState } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteAdButton({ id, locale, isAdmin }: { id: string; locale: string; isAdmin?: boolean }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");

  const handleConfirmDelete = async () => {
    if (!isAdmin && !deleteCode.trim()) {
      alert(locale === "ar" ? "الرجاء إدخال رمز الحذف" : "Please enter the delete code");
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/haraj/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: deleteCode }),
      });

      if (res.ok) {
        alert(locale === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
        router.push(`/${locale}/haraj`);
        router.refresh();
      } else {
        if (res.status === 403) {
          alert(locale === "ar" ? "رمز الحذف غير صحيح" : "Incorrect delete code");
        } else {
          alert(locale === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting ad");
        }
        setIsDeleting(false); // Only reset if failed
      }
    } catch (err) {
      console.error(err);
      alert(locale === "ar" ? "حدث خطأ غير متوقع" : "Unexpected error");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        disabled={isDeleting}
        style={{
          background: "#ef4444",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 12,
          fontWeight: 700,
          border: "none",
          cursor: isDeleting ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 14,
          opacity: isDeleting ? 0.7 : 1,
        }}
      >
        <Trash2 size={18} />
        {isDeleting 
          ? (locale === "ar" ? "جاري الحذف..." : "Deleting...") 
          : (locale === "ar" ? "حذف الإعلان" : "Delete Ad")}
      </button>

      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          backdropFilter: "blur(4px)"
        }} onClick={(e) => {
          if (e.target === e.currentTarget) setShowModal(false);
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 24,
            padding: 32,
            width: "100%",
            maxWidth: 400,
            boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            animation: "fadeIn 0.2s ease-out",
            direction: locale === "ar" ? "rtl" : "ltr"
          }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ 
                width: 60, 
                height: 60, 
                background: "#fee2e2", 
                borderRadius: "50%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "#ef4444"
              }}>
                <Trash2 size={32} />
              </div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 20, fontWeight: 800 }}>
                {locale === "ar" ? "تأكيد الحذف" : "Confirm Deletion"}
              </h3>
              <p style={{ margin: 0, color: "#666", lineHeight: "1.5" }}>
                {isAdmin 
                  ? (locale === "ar" ? "هل أنت متأكد من حذف هذا الإعلان بصلاحيات المشرف؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this ad as Admin? This action cannot be undone.")
                  : (locale === "ar" ? "الرجاء إدخال رمز الحذف الخاص بهذا الإعلان للمتابعة." : "Please enter the delete code for this ad to proceed.")}
              </p>
            </div>

            {!isAdmin && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
                  {locale === "ar" ? "رمز الحذف" : "Delete Code"}
                </label>
                <input
                  type="text"
                  value={deleteCode}
                  onChange={(e) => setDeleteCode(e.target.value)}
                  placeholder={locale === "ar" ? "أدخل الرمز هنا..." : "Enter code here..."}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 16,
                    outline: "none",
                    background: "#f9fafb"
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  color: "#374151",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || (!isAdmin && !deleteCode)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: (isDeleting || (!isAdmin && !deleteCode)) ? "not-allowed" : "pointer",
                  opacity: (isDeleting || (!isAdmin && !deleteCode)) ? 0.5 : 1
                }}
              >
                {isDeleting 
                  ? (locale === "ar" ? "جاري الحذف..." : "Deleting...") 
                  : (locale === "ar" ? "تأكيد الحذف" : "Delete Ad")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
