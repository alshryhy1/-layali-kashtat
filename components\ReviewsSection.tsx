"use client";

import React, { useState } from "react";
import ReviewForm from "./ReviewForm";
import ReviewsList from "./ReviewsList";

interface ReviewsSectionProps {
  targetId: string;
  targetType: string;
  isLoggedIn: boolean;
  locale: string;
}

export default function ReviewsSection({ targetId, targetType, isLoggedIn, locale }: ReviewsSectionProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div style={{ marginTop: 40, padding: 24, background: "#fff", borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, color: "#111827" }}>
        {locale === "ar" ? "التقييمات" : "Reviews"}
      </h2>
      
      <ReviewForm
        targetId={targetId}
        targetType={targetType}
        isLoggedIn={isLoggedIn}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
        locale={locale}
      />
      
      <ReviewsList
        targetId={targetId}
        targetType={targetType}
        refreshTrigger={refreshTrigger}
        locale={locale}
      />
    </div>
  );
}
