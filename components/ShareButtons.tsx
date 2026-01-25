"use client";

import { Share2, Link as LinkIcon, Twitter, Check } from "lucide-react";
import { useState } from "react";

interface ShareButtonsProps {
  title: string;
  text: string;
  url?: string;
  isAr: boolean;
}

export default function ShareButtons({ title, text, url, isAr }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || window.location.href;
    const shareData = {
      title,
      text,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share canceled");
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    const shareUrl = url || window.location.href;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const shareUrl = url || window.location.href;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n${shareUrl}`)}`;
    window.open(waUrl, "_blank");
  };

  const handleTwitter = () => {
    const shareUrl = url || window.location.href;
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twUrl, "_blank");
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button
        onClick={handleShare}
        style={{
          background: "#f3f4f6",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#4b5563",
          transition: "background 0.2s"
        }}
        title={isAr ? "مشاركة" : "Share"}
      >
        <Share2 size={20} />
      </button>

      <button
        onClick={handleWhatsApp}
        style={{
          background: "#25D366",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
        }}
        title="WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
          <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0 1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
        </svg>
      </button>

      <button
        onClick={handleTwitter}
        style={{
          background: "#000",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
        }}
        title="X (Twitter)"
      >
        <Twitter size={18} />
      </button>

      <button
        onClick={handleCopy}
        style={{
          background: copied ? "#d1fae5" : "#f3f4f6",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: copied ? "#059669" : "#4b5563",
        }}
        title={isAr ? "نسخ الرابط" : "Copy Link"}
      >
        {copied ? <Check size={20} /> : <LinkIcon size={20} />}
      </button>
    </div>
  );
}
