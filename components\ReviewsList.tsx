"use client";

import React, { useEffect, useState } from "react";
import StarRating from "./StarRating";

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewsListProps {
  targetId: string;
  targetType: string;
  refreshTrigger: number;
  locale: string;
}

export default function ReviewsList({ targetId, targetType, refreshTrigger, locale }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const isAr = locale === "ar";

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reviews?target_id=${targetId}&target_type=${targetType}`);
        const data = await res.json();
        if (data.ok) {
          setReviews(data.reviews);
        }
      } catch (e) {
        console.error("Failed to fetch reviews", e);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [targetId, targetType, refreshTrigger]);

  if (loading) {
    return <div style={{ padding: 16, color: "#6b7280" }}>{isAr ? "جاري تحميل التقييمات..." : "Loading reviews..."}</div>;
  }

  if (reviews.length === 0) {
    return (
      <div style={{ padding: 16, color: "#6b7280", textAlign: "center", background: "#f9fafb", borderRadius: 8 }}>
        {isAr ? "لا توجد تقييمات بعد. كن أول من يقيم!" : "No reviews yet. Be the first to review!"}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {reviews.map((review) => (
        <div key={review.id} style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: "bold", fontSize: 16 }}>{review.customer_name || (isAr ? "عميل" : "Customer")}</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              {new Date(review.created_at).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
            </span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <StarRating rating={review.rating} readOnly size={16} />
          </div>
          <p style={{ margin: 0, color: "#374151", lineHeight: 1.5 }}>{review.comment}</p>
        </div>
      ))}
    </div>
  );
}
