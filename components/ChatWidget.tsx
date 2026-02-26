"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, MapPin, Image as ImageIcon, Send } from "lucide-react";

type Props = {
  conversationId: string;
  userRole: "customer" | "provider";
  userName: string;
  counterpartName?: string;
};

type Msg = {
  id?: number;
  conversation_id: string;
  sender_role: "customer" | "provider";
  content?: string;
  media_url?: string;
  media_type?: "text" | "image" | "location";
  created_at?: string;
};

export default function ChatWidget({ conversationId, userRole, userName, counterpartName }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [customerLoc, setCustomerLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [providerLoc, setProviderLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [etaText, setEtaText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);

  const counterpartRole = userRole === "customer" ? "provider" : "customer";

  const fetchMessages = useCallback(async () => {
    const r = await fetch(`/api/chat/messages?conversation_id=${encodeURIComponent(conversationId)}`);
    const j = await r.json().catch(() => ({}));
    const data = Array.isArray(j?.messages) ? j.messages : [];
    setMessages(data);
  }, [conversationId]);

  const [channelName, setChannelName] = useState<string>(`conv:${conversationId}`);

  const subscribeDb = useCallback(() => {
    const c = supabase.channel(channelName, { config: { broadcast: { self: true }, presence: { key: userRole } } });
    c.on("broadcast", { event: "message" }, () => {
      fetchMessages();
    });
    c.subscribe();
  }, [channelName, userRole, fetchMessages]);

  const joinPresence = useCallback(async () => {
    const c = supabase.channel(channelName, {
      config: { broadcast: { self: true }, presence: { key: userRole } },
    });
    c.on("presence", { event: "sync" }, () => {
      const state = c.presenceState() || {};
      const counterpart = state[counterpartRole] || [];
      setOnline(counterpart.length > 0);
    });
    c.on("broadcast", { event: "location" }, async (p: any) => {
      const role = p?.payload?.role;
      const lat = Number(p?.payload?.lat);
      const lng = Number(p?.payload?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      if (role === "customer") setCustomerLoc({ lat, lng });
      if (role === "provider") setProviderLoc({ lat, lng });
      if (role === "provider" && customerLoc) {
        const r = await fetch("/api/maps/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startLat: lat, startLng: lng, endLat: customerLoc.lat, endLng: customerLoc.lng }),
        });
        const j = await r.json().catch(() => null);
        if (j && j.ok) {
          const m = Math.round((Number(j.eta || 0) / 60) * 10) / 10;
          setEtaText(`${m} min`);
        }
      }
    });
    await c.subscribe();
    await c.track({ role: userRole, name: userName });
    channelRef.current = c;
  }, [channelName, userRole, userName, counterpartRole, customerLoc]);

  const sendText = async () => {
    if (!text.trim()) return;
    setSending(true);
    const r = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId, sender_role: userRole, content: text.trim(), media_type: "text" }),
    });
    if (r.ok) {
      setText("");
      channelRef.current?.send({ type: "broadcast", event: "message", payload: { conversation_id: conversationId } });
    }
    setSending(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSendingImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("conversation_id", conversationId);
      form.append("sender_role", userRole);
      const r = await fetch("/api/upload", { method: "POST", body: form });
      const j = await r.json().catch(() => ({}));
      const key = String(j?.key || "");
      if (!key) throw new Error("upload_failed");
      await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId, sender_role: userRole, media_url: key, media_type: "image" }),
      });
      channelRef.current?.send({ type: "broadcast", event: "message", payload: { conversation_id: conversationId } });
    } finally {
      setSendingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const shareLocation = async () => {
    try {
      const p = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
      );
      const lat = p.coords.latitude;
      const lng = p.coords.longitude;
      if (userRole === "customer") setCustomerLoc({ lat, lng });
      if (userRole === "provider") setProviderLoc({ lat, lng });
      channelRef.current?.send({ type: "broadcast", event: "location", payload: { role: userRole, lat, lng } });
      await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId, sender_role: userRole, media_type: "location", content: `${lat},${lng}` }),
      });
      channelRef.current?.send({ type: "broadcast", event: "message", payload: { conversation_id: conversationId } });
    } catch {}
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/chat/channel-token?conversation_id=${encodeURIComponent(conversationId)}`);
        const j = await r.json().catch(() => ({}));
        const ch = String(j?.channel || "");
        setChannelName(ch || `conv:${conversationId}`);
      } catch {
        setChannelName(`conv:${conversationId}`);
      }
      fetchMessages();
      subscribeDb();
      joinPresence();
    })();
    return () => {
      try {
        channelRef.current?.untrack();
        channelRef.current?.unsubscribe();
      } catch {}
    };
  }, [conversationId, fetchMessages, subscribeDb, joinPresence]);

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="font-bold text-gray-800">{counterpartName || ""}</div>
        <div className={`text-sm font-bold ${online ? "text-emerald-600" : "text-gray-400"}`}>
          {online ? "متصل" : "غير متصل"}
        </div>
      </div>
      <div className="p-3 space-y-2" style={{ maxHeight: 320, overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={m.id || i} className={`flex ${m.sender_role === userRole ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] p-2 rounded-2xl text-sm ${
                m.sender_role === userRole ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.media_type === "image" && m.media_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.media_url} alt="" className="rounded-lg max-w-full" />
              ) : (
                <span>{m.content}</span>
              )}
            </div>
          </div>
        ))}
        {etaText && providerLoc && customerLoc ? (
          <div className="text-xs text-gray-500 font-bold">{`ETA ${etaText}`}</div>
        ) : null}
      </div>
      <div className="p-3 border-t border-gray-100 flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2 focus:outline-none"
          placeholder="اكتب رسالة..."
        />
        <button
          onClick={sendText}
          disabled={sending || !text.trim()}
          className="bg-blue-600 text-white px-3 py-2 rounded-xl font-bold disabled:opacity-50"
          title="إرسال"
        >
          {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sendingImage}
          className="bg-purple-600 text-white px-3 py-2 rounded-xl font-bold disabled:opacity-50"
          title="إرسال صورة"
        >
          {sendingImage ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
        </button>
        <button
          onClick={shareLocation}
          className="bg-emerald-600 text-white px-3 py-2 rounded-xl font-bold"
          title="مشاركة الموقع"
        >
          <MapPin size={18} />
        </button>
      </div>
    </div>
  );
}
