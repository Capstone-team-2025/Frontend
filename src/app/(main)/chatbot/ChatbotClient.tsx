"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble, { BubbleSender } from "./components/MessageBubble";

const BOTTOM_NAV_HEIGHT = 64;

type Message = {
  id: string;
  sender: BubbleSender;
  message?: string;
};

interface ChatPayload {
  message: string;
  latitude?: number;
  longitude?: number;
  sessionId?: string;
}

export default function ChatbotClient() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "hello", sender: "ai", message: "AI에게 할인정보를 물어보세요!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});

  const pushMessage = (m: Message) => setMessages((prev) => [...prev, m]);

  const fetchWithTimeout = (url: string, opts: RequestInit = {}, timeoutMs = 10000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!navigator.onLine) {
      pushMessage({ id: crypto.randomUUID(), sender: "user", message: text });
      pushMessage({
        id: crypto.randomUUID(),
        sender: "ai",
        message: "오프라인 상태예요. 네트워크 연결 후 다시 시도해 주세요.",
      });
      setInput("");
      return;
    }

    pushMessage({ id: crypto.randomUUID(), sender: "user", message: text });
    const typingId = crypto.randomUUID();
    pushMessage({ id: typingId, sender: "typing" });
    
    setInput("");
    setLoading(true);

    try {
      const payload: ChatPayload = { message: text };
      if (typeof coords.lat === "number" && typeof coords.lng === "number") {
        payload.latitude = coords.lat;
        payload.longitude = coords.lng;
      }

      const res = await fetchWithTimeout(
        "/api/chatbot/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        25000
      );

      const ct = res.headers.get("content-type") ?? "";
      let aiText = "";

      if (ct.includes("application/json")) {
        const data = (await res.json().catch(() => ({}))) as {
          response?: string;
          message?: string;
        };
        aiText = data?.response || data?.message || "";
      } else {
        aiText = await res.text().catch(() => "");
      }

      if (!res.ok) aiText = aiText || `요청이 실패했어요. (HTTP ${res.status})`;
      if (!aiText) aiText = "응답이 비어있어요.";

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== typingId),
        { id: crypto.randomUUID(), sender: "ai", message: aiText },
      ]);
    } catch (err: unknown) {
      const msg =
        err instanceof DOMException && err.name === "AbortError"
          ? "서버 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요."
          : err instanceof TypeError
          ? "서버에 연결할 수 없어요. 서버가 꺼져 있거나 네트워크가 불안정해요."
          : "알 수 없는 오류가 발생했어요.";

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== typingId),
        { id: crypto.randomUUID(), sender: "ai", message: msg },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative">
      <div className="px-6 py-5 overflow-y-auto" style={{ paddingBottom: "130px" }}>
        {messages.map((m) => (
          <MessageBubble key={m.id} sender={m.sender} message={m.message} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div
        className="fixed bg-white left-1/2 -translate-x-1/2 w-full max-w-[425px] border-t border-gray-300 px-4 py-3 flex items-center gap-3"
        style={{ bottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))` }}
      >
        <input
          type="text"
          placeholder={loading ? "답변을 기다리는 중…" : "여기서 검색"}
          className="flex-1 border border-gray-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:bg-gray-100"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-black text-white px-4 py-2 rounded-full text-sm disabled:opacity-60"
        >
          전송
        </button>
      </div>
    </div>
  );
}
