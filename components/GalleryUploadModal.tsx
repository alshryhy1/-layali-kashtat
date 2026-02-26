"use client";

import { useState, useRef } from "react";
import { Camera, X, Trash2 } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
  userName?: string;
  onUploadSuccess?: () => void;
};

export default function GalleryUploadModal({
  isOpen,
  onClose,
  isAr,
  userName: initialUserName = "",
  onUploadSuccess,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [userName, setUserName] = useState(initialUserName);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {}
    }
    setPreviewUrl(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json().catch(() => ({}));
      const key = String(uploadData?.key || "");
      if (!uploadRes.ok || !uploadData?.ok || !key) {
        throw new Error(uploadData?.error || "upload_failed");
      }
      const imageUrl = key;
      const postRes = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          user_name: userName || (isAr ? "زائر" : "Guest"),
        }),
      });
      const postData = await postRes.json().catch(() => ({}));
      if (!postRes.ok || !postData?.ok) {
        throw new Error(postData?.error || "post_failed");
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");
      if (!initialUserName) setUserName("");
      onUploadSuccess?.();
      onClose();
      alert(isAr ? "تم نشر مشاركتك بنجاح!" : "Posted successfully!");
    } catch (e) {
      alert(isAr ? "فشل الرفع أو النشر" : "Upload or post failed");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-4 relative">
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold mb-4 text-center">
          {isAr ? "مشاركة صورة في المعرض" : "Share to Gallery"}
        </h2>

        <div className="space-y-4">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 relative">
            {previewUrl ? (
              <div className="relative w-full h-full cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition z-10"
                  title={isAr ? "حذف الصورة" : "Remove Image"}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center hover:bg-gray-50 transition p-4 text-center"
              >
                <Camera className="w-8 h-8 text-gray-400" />
                <span className="text-xs text-gray-500 font-bold">
                  {isAr ? "اضغط لاختيار صورة" : "Tap to select"}
                </span>
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder={isAr ? "اكتب تعليقاً..." : "Write a caption..."}
            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-purple-500"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <input
            type="text"
            placeholder={isAr ? "الاسم (اختياري)" : "Name (Optional)"}
            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-purple-500"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            disabled={!!initialUserName}
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 hover:bg-purple-700 transition"
          >
            {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "نشر في المعرض" : "Post to Gallery")}
          </button>
        </div>
      </div>
    </div>
  );
}
