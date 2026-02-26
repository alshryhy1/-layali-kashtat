"use client";

import React, { useState } from "react";
import StarRating from "./StarRating";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
  targetId: string;
  targetType: string;
  isLoggedIn: boolean;
  onSuccess: () => void;
  locale: string;
}

export default function ReviewForm({ targetId, targetType, isLoggedIn, onSuccess, locale }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const isAr = locale === "ar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError(isAr ? "الرجاء اختيار التقييم" : "Please select a rating");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: targetId, target_type: targetType, rating, comment }),
      });

      const data = await res.json();
      if (data.ok) {
        setRating(0);
        setComment("");
        onSuccess();
      } else {
        setError(data.error || "Failed to submit review");
      }
    } catch (err) {
      setError("Error submitting review");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: 16, background: "#f9fafb", borderRadius: 8, textAlign: "center", marginBottom: 24 }}>
        <p style={{ marginBottom: 8, color: "#4b5563" }}>
          {isAr ? "الرجاء تسجيل الدخول لإضافة تقييم" : "Please login to add a review"}
        </p>
        <button
          onClick={() => router.push(`/${locale}/customer/login`)}
          style={{
            background: "#3b82f6",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {isAr ? "تسجيل الدخول" : "Login"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24, padding: 16, border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
      <h3 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
        {isAr ? "أضف تقييمك" : "Add Your Review"}
      </h3>
      
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: 14, color: "#374151" }}>
          {isAr ? "التقييم" : "Rating"}
        </label>
        <StarRating rating={rating} setRating={setRating} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: 14, color: "#374151" }}>
          {isAr ? "التعليق" : "Comment"}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #d1d5db",
            fontSize: 14,
            resize: "vertical",
          }}
          placeholder={isAr ? "شاركنا تجربتك..." : "Share your experience..."}
        />
      </div>

      {error && <div style={{ color: "#ef4444", fontSize: 14, marginBottom: 12 }}>{error}</div>}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: "#10b981",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: 4,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال التقييم" : "Submit Review")}
      </button>
    </form>
  );
}
