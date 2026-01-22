"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Mic, MapPin, Send, StopCircle, Loader2, ChevronDown, ChevronUp, Image as ImageIcon, Camera } from "lucide-react";

// Initialize Supabase Client (Public)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Message = {
  id: string;
  sender_role: "customer" | "provider" | "system";
  content: string; // For text, or "Location Shared", or "Voice Message"
  media_url?: string; // For voice base64 or other media
  media_type: "text" | "image" | "voice" | "location";
  created_at: string;
};

type Props = {
  requestRef?: string; // For Customer
  providerId?: string; // For Provider
  requestId?: number; // For Provider (to find conversation)
  conversationId?: string; // If known
  userRole: "customer" | "provider";
  collapsible?: boolean;
  onClose?: () => void;
  fullHeight?: boolean;
  counterpartName?: string;
};

// Helper for map URL
function mobileMapUrl(loc: string) {
  const s = String(loc || "");
  // Use Google Maps web link which works everywhere (Desktop & Mobile)
  // It will open the app on mobile if installed, or the website otherwise.
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s)}`;
}

export default function ChatWidget({ requestRef, providerId, userRole, requestId, collapsible = false, onClose, fullHeight = false, counterpartName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [sendingLocation, setSendingLocation] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [otherPartyOnline, setOtherPartyOnline] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load History & Init Realtime
  useEffect(() => {
    async function initChat() {
      try {
        setLoading(true);
        setRealtimeStatus("connecting");
        // Fetch History & Conversation ID
        let url = `/api/chat/history?`;
        if (requestRef) url += `ref=${requestRef}`;
        if (providerId) url += `&provider_id=${providerId}`;
        if (requestId) url += `&request_id=${requestId}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.ok) {
          setMessages(data.messages);
          setConversationId(data.conversation_id);
        } else {
          console.error("Chat Init Error:", data.error);
          setRealtimeStatus("disconnected");
        }
      } catch (e) {
        console.error("Fetch Error:", e);
        setRealtimeStatus("disconnected");
      } finally {
        setLoading(false);
      }
    }

    initChat();
  }, [requestRef, providerId, requestId]);

  // 2. Subscribe to Realtime
  useEffect(() => {
    if (!conversationId) return;

    setRealtimeStatus("connecting");
    const channel = supabase
      .channel(`chat:${conversationId}`, {
        config: {
          presence: {
            key: userRole,
          },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
             // Avoid duplicates
             if (prev.find(m => m.id === newMsg.id)) return prev;
             return [...prev, newMsg];
          });
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const otherRole = userRole === "customer" ? "provider" : "customer";
        const hasOther = Object.keys(state).includes(otherRole);
        setOtherPartyOnline(hasOther);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
            setRealtimeStatus("connected");
            await channel.track({ online_at: new Date().toISOString() });
        }
        else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") setRealtimeStatus("disconnected");
        else setRealtimeStatus("connecting");
      });

    return () => {
      supabase.removeChannel(channel);
      setRealtimeStatus("disconnected");
    };
  }, [conversationId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Actions ---
  const handleSendText = async () => {
    if (!inputText.trim() || !conversationId) return;
    const text = inputText.trim();
    setInputText(""); // Optimistic clear

    try {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_role: userRole,
          content: text,
          media_type: "text"
        }),
      });
    } catch (e) {
      console.error("Send Error:", e);
      setInputText(text); // Revert on error
    }
  };

  const handleSendLocation = async () => {
    if (!conversationId || !navigator.geolocation) {
        alert("المتصفح لا يدعم تحديد الموقع");
        return;
    }
    setSendingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = `${pos.coords.latitude},${pos.coords.longitude}`;
        try {
          await fetch("/api/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversation_id: conversationId,
              sender_role: userRole,
              content: loc,
              media_type: "location"
            }),
          });
        } catch (e) {
          console.error("Loc Error:", e);
          alert("فشل في إرسال الموقع للسيرفر");
        } finally {
          setSendingLocation(false);
        }
      },
      (err) => {
        console.error("Geo Error:", err);
        setSendingLocation(false);
        
        let msg = "تعذر تحديد الموقع.";
        if (err.code === 1) msg = "تم رفض إذن الوصول للموقع. الرجاء السماح بالوصول من إعدادات المتصفح.";
        else if (err.code === 2) msg = "الموقع غير متاح (GPS). تأكد من تفعيل خدمة الموقع.";
        else if (err.code === 3) msg = "انتهت مهلة تحديد الموقع. حاول مرة أخرى.";

        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          if (conversationId) {
             await fetch("/api/chat/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversation_id: conversationId,
                sender_role: userRole,
                content: "تسجيل صوتي",
                media_type: "voice",
                media_url: base64
              }),
            });
          }
        };
        // Stop tracks
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (e) {
      console.error("Mic Error:", e);
      alert("المايكروفون غير متاح");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !conversationId) return;
    const file = e.target.files[0];
    
    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(isAr ? "حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)" : "Image too large (max 5MB)");
      return;
    }

    setSendingImage(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        // Simple client-side resize could be added here if needed, but for now we send as is
        
        await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: conversationId,
            sender_role: userRole,
            content: "صورة",
            media_type: "image",
            media_url: base64
          }),
        });
      } catch (err) {
        console.error("Image Send Error:", err);
        alert(isAr ? "فشل إرسال الصورة" : "Failed to send image");
      } finally {
        setSendingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
  };

  // --- Render Helpers ---
  const renderMessageContent = (msg: Message) => {
    if (msg.media_type === "location") {
       return (
         <a 
           href={mobileMapUrl(msg.content)} 
           target="_blank" 
           rel="noopener noreferrer"
           style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284c7', textDecoration: 'none', fontWeight: 'bold' }}
         >
           <MapPin size={16} />
           <span>مشاركة موقع</span>
         </a>
       );
    }
    if (msg.media_type === "image" && msg.media_url) {
      return (
        <img 
          src={msg.media_url} 
          alt="Sent image" 
          style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer' }}
          onClick={() => window.open(msg.media_url, '_blank')}
        />
      );
    }
    if (msg.media_type === "voice" && msg.media_url) {
      return (
        <audio controls src={msg.media_url} style={{ height: '32px', maxWidth: '200px' }} />
      );
    }
    return <span>{msg.content}</span>;
  };

  const isAr =
    typeof document === "undefined"
      ? true
      : document.documentElement.dir === "rtl" || (document.documentElement.lang || "").toLowerCase().startsWith("ar");

  const statusText =
    realtimeStatus === "connected"
      ? otherPartyOnline
        ? isAr
          ? "متصل الآن"
          : "Connected Now"
        : isAr
          ? "غير متصل"
          : "Not Connected"
      : realtimeStatus === "connecting"
        ? isAr
          ? "جار الاتصال..."
          : "Connecting..."
        : isAr
          ? "غير متصل"
          : "Disconnected";

  const statusDot =
    realtimeStatus === "connected" 
      ? (otherPartyOnline ? "#22c55e" : "#94a3b8") 
      : realtimeStatus === "connecting" ? "#f59e0b" : "#94a3b8";

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: fullHeight ? '100%' : (isCollapsed ? 'auto' : '500px'),
      backgroundColor: '#fff',
      border: fullHeight ? 'none' : '1px solid #ddd',
      borderRadius: fullHeight ? '0' : '12px',
      boxShadow: fullHeight ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      fontFamily: 'sans-serif',
      transition: 'height 0.3s ease'
    }}>
      {/* Header */}
      <div 
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
        style={{
          background: 'linear-gradient(90deg, #1e293b, #0f172a)',
          color: 'white',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #334155',
          cursor: collapsible ? 'pointer' : 'default'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           {collapsible && (
             isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />
           )}
           <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: (realtimeStatus === 'connected' && otherPartyOnline) ? '#4ade80' : '#94a3b8' }}>
             {counterpartName || (userRole === 'customer' ? 'مقدم الخدمة' : 'العميل')}
           </h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
                fontSize: '12px', 
                backgroundColor: statusDot, 
                color: '#fff', 
                padding: '6px 12px', 
                borderRadius: '999px', 
                border: '1px solid rgba(255,255,255,0.2)',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block' }}></span>
              {statusText}
            </span>

            {onClose && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '20px',
                        lineHeight: 1
                    }}
                >
                    &times;
                </button>
            )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        backgroundColor: '#efe7dd', // WhatsApp Beige
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {messages.map((msg) => {
          const isMe = (msg.sender_role || "").toLowerCase() === (userRole || "").toLowerCase();
          
          // RTL Alignment Logic:
          // Me (Right) -> justify-start (because Start is Right in RTL)
          // Other (Left) -> justify-end (because End is Left in RTL)
          const justifyContent = isMe ? 'flex-start' : 'flex-end';
          
          return (
            <div 
              key={msg.id} 
              style={{
                display: 'flex',
                width: '100%',
                justifyContent: justifyContent
              }}
            >
              <div
                style={{
                  position: 'relative',
                  maxWidth: '80%',
                  padding: '8px 12px',
                  borderRadius: '16px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  textAlign: 'right',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  backgroundColor: isMe ? '#d9fdd3' : '#ffffff',
                  borderTopRightRadius: isMe ? '0' : '16px',
                  borderTopLeftRadius: isMe ? '16px' : '0'
                }}
              >
                {renderMessageContent(msg)}
                
                <span style={{
                   fontSize: '10px',
                   display: 'block',
                   marginTop: '4px',
                   textAlign: 'left',
                   color: isMe ? 'rgba(0,100,0,0.6)' : '#9ca3af',
                   direction: 'ltr' 
                }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {/* Tail (CSS Triangle) */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  width: 0,
                  height: 0,
                  borderTop: '12px solid',
                  borderTopColor: isMe ? '#d9fdd3' : '#ffffff',
                  [isMe ? 'right' : 'left']: '-12px',
                  [isMe ? 'borderRight' : 'borderLeft']: '12px solid transparent'
                }}></div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '12px',
        backgroundColor: '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Actions Menu (Location, Image, Camera) */}
        <button 
          onClick={handleSendLocation} 
          disabled={sendingLocation}
          title="مشاركة الموقع"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '8px',
            opacity: sendingLocation ? 0.5 : 1
          }}
        >
           {sendingLocation ? <Loader2 size={24} className="animate-spin" /> : <MapPin size={24} />}
        </button>

        {/* Gallery Input */}
        <input 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }} 
          ref={fileInputRef} 
          onChange={handleImageSelect}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={sendingImage}
          title="إرسال صورة من الاستديو"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '8px',
            opacity: sendingImage ? 0.5 : 1
          }}
        >
           {sendingImage ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
        </button>

        {/* Camera Input */}
        <input 
          type="file" 
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }} 
          ref={cameraInputRef} 
          onChange={handleImageSelect}
        />
        
        <button 
          onClick={() => cameraInputRef.current?.click()} 
          disabled={sendingImage}
          title="تصوير مباشر"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '8px',
            opacity: sendingImage ? 0.5 : 1
          }}
        >
           <Camera size={24} />
        </button>

        <input
          type="text"
          placeholder={isRecording ? "جاري التسجيل..." : "اكتب رسالة..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendText()}
          disabled={isRecording}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '24px',
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            backgroundColor: '#fff'
          }}
        />

        {inputText ? (
          <button 
            onClick={handleSendText} 
            style={{
              background: '#00a884',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
             <Send size={20} />
          </button>
        ) : (
          <button 
            onClick={isRecording ? stopRecording : startRecording} 
            style={{
              background: isRecording ? '#ef4444' : 'none',
              color: isRecording ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {isRecording ? <StopCircle size={24} /> : <Mic size={24} />}
          </button>
        )}
      </div>
      </>
      )}
    </div>
  );
}
