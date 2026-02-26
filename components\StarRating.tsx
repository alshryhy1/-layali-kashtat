"use client";

import React from "react";

interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void;
  size?: number;
  readOnly?: boolean;
}

export default function StarRating({ rating, setRating, size = 24, readOnly = false }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {stars.map((star) => {
        const isFilled = star <= rating;
        return (
          <svg
            key={star}
            onClick={() => !readOnly && setRating && setRating(star)}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isFilled ? "#fbbf24" : "none"} // amber-400
            stroke={isFilled ? "#fbbf24" : "#9ca3af"} // gray-400
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              width: size,
              height: size,
              cursor: readOnly ? "default" : "pointer",
              transition: "fill 0.2s, stroke 0.2s",
            }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
    </div>
  );
}
