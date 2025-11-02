"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./components/MessageBubble";

const BOTTOM_NAV_HEIGHT = 64;

type Message = {
  sender: "ai" | "user";
  message: string;
};

export default function ChatbotClient() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "ai", message: "AI에게 할인정보를 물어보세요!" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", message: input }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", message: "서버에 연결되지 않았어요!" },
      ]);
    }, 600);
    setInput("");
  };

  useEffect(() => {
    //새로은 메세지 생길 때 스크롤 아래로 이동
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative ">
      <div
        className="px-6 py-5 overflow-y-auto"
        style={{
          paddingBottom: "130px",
        }}
      >
        {messages.map((m, i) => (
          <MessageBubble key={i} sender={m.sender} message={m.message} />
        ))}
        <div ref={bottomRef} />
      </div>
      <div
        className="fixed  bg-white left-1/2 -translate-x-1/2 w-full max-w-[425px] border-t border-gray-300  px-4 py-3 flex items-center gap-3"
        style={{
          bottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
        }}
      >
        <input
          type="text"
          placeholder="여기서 검색"
          className="flex-1 border border-gray-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-black text-white px-4 py-2 rounded-full text-sm"
        >
          전송
        </button>
      </div>
    </div>
  );
}
