"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteAdButton({ id, locale }: { id: string; locale: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    // Prompt for code
    const code = prompt(locale === "ar" 
      ? "الرجاء إدخال رمز الحذف الخاص بهذا الإعلان:" 
      : "Please enter the delete code for this ad:");
    
    if (!code) return; // User cancelled

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/haraj/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const json = await res.json();

      if (res.ok) {
        alert(locale === "ar" ? "تم الحذف بنجاح" : "Deleted successfully");
        router.push(`/${locale}/haraj`);
        router.refresh();
      } else {
        // Show specific error if code is wrong
        if (res.status === 403) {
          alert(locale === "ar" ? "رمز الحذف غير صحيح" : "Incorrect delete code");
        } else {
          alert(locale === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting ad");
        }
      }
    } catch (err) {
      console.error(err);
      alert(locale === "ar" ? "حدث خطأ غير متوقع" : "Unexpected error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
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
  );
}
