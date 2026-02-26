"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FavoriteButton({ 
  itemId, 
  initialIsFavorite = false,
  isLoggedIn = false
}: { 
  itemId: string; 
  initialIsFavorite?: boolean;
  isLoggedIn?: boolean;
}) {
  const [isFav, setIsFav] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleFav = async () => {
    if (!isLoggedIn) {
      alert("يرجى تسجيل الدخول للإضافة للمفضلة");
      router.push("/ar/customer/login"); // Default to AR, or use prop
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsFav(data.isFavorited);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFav}
      disabled={loading}
      style={{
        background: isFav ? "#fee2e2" : "#f3f4f6",
        border: "none",
        borderRadius: "50%",
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s"
      }}
    >
      <Heart 
        size={20} 
        fill={isFav ? "#ef4444" : "none"} 
        color={isFav ? "#ef4444" : "#4b5563"} 
      />
    </button>
  );
}
