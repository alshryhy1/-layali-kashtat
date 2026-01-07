"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

    setTimeout(() => {
      if (isStandaloneMode) setIsStandalone(true);
      setIsIOS(isIosDevice);
    }, 0);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) return null;

  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md text-black p-4 rounded-xl shadow-2xl z-50 border border-gray-200 animate-in slide-in-from-bottom-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">تثبيت التطبيق</h3>
            <button 
              onClick={() => setIsIOS(false)} 
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600">
            لتثبيت التطبيق على جهازك:
            <br />
            1. اضغط على زر المشاركة <span className="text-xl">⎋</span>
            <br />
            2. اختر <strong>&quot;إضافة إلى الشاشة الرئيسية&quot;</strong>
          </p>
        </div>
      </div>
    );
  }

  if (!deferredPrompt) return null;

  return (
    <button
      onClick={handleInstallClick}
      dir="ltr"
      className="fixed bottom-6 left-0 right-0 mx-auto w-fit z-[100] flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full shadow-lg transition-all active:scale-95 backdrop-blur-sm border border-white/20"
    >
      <Download className="w-5 h-5" />
      <span className="font-medium">تثبيت التطبيق</span>
    </button>
  );
}
