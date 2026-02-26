
"use client";

import { useState, useRef } from "react";
import { Camera, X, Image as ImageIcon, Trash2 } from "lucide-react";

interface GalleryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
  userName?: string; // Pre-filled name (e.g., from session)
  onUploadSuccess?: () => void;
}

export default function GalleryUploadModal({ 
  isOpen, 
  onClose, 
  isAr, 
  userName: initialUserName = "",
  onUploadSuccess 
}: GalleryUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [userName, setUserName] = useState(initialUserName);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      // 1. Upload Image
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.success) throw new Error(uploadData.error);

      // 2. Create Post
      const postRes = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: uploadData.url,
          caption,
          user_name: userName || (isAr ? "فاعل خير" : "Guest"),
        }),
      });

      if (postRes.ok) {
        // Reset state
        setSelectedFile(null);
        setPreviewUrl(null);
        setCaption("");
        if (!initialUserName) setUserName("");
        
        if (onUploadSuccess) onUploadSuccess();
        onClose();
        alert(isAr ? "تم نشر مشاركتك بنجاح!" : "Posted successfully!");
      }
    } catch (e) {
      alert(isAr ? "حدث خطأ أثناء الرفع" : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#fcfcfc] rounded-2xl w-full max-w-sm p-4 relative animate-fade-in">
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold mb-4 text-center">{isAr ? "مشاركة صورة في المعرض" : "Share to Gallery"}</h2>
        
        <div className="space-y-4">
          {/* Hidden file input that's always available */}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 relative">
            {previewUrl ? (
              <div 
                className="relative w-full h-full cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
                title={isAr ? "اضغط لتغيير الصورة" : "Click to change image"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                
                {/* Overlay to indicate clickable */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-sm">
                   {isAr ? "تغيير الصورة" : "Change Image"}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening file dialog when clicking remove
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
                <span className="text-xs text-gray-500 font-bold">{isAr ? "اضغط لاختيار صورة" : "Tap to select"}</span>
                <span 
                    className="text-[11px] font-bold mt-2 block px-2 leading-tight" 
                    style={{ color: '#dc2626' }}
                >
                    {isAr ? "⚠️ يمنع رفع صور تحتوي على أشخاص إلا بعد موافقتهم" : "⚠️ No people unless they consent"}
                </span>
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder={isAr ? "اكتب تعليقاً..." : "Write a caption..."}
            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-purple-500"
            value={caption}
            onChange={e => setCaption(e.target.value)}
          />
          
          <input
            type="text"
            placeholder={isAr ? "الاسم (اختياري)" : "Name (Optional)"}
            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-purple-500"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            disabled={!!initialUserName} // Disable if pre-filled
          />

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition"
          >
            {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "نشر في المعرض" : "Post to Gallery")}
          </button>
        </div>
      </div>
    </div>
  );
}
