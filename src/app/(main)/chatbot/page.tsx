import type { Metadata } from "next";
import ChatbotClient from "./ChatbotClient";
import Header from "@/components/common/Header";

export const metadata: Metadata = {
  title: "챗봇 대화 페이지",
  description: "통신사 할인 매장 추천 등 AI 챗 기능을 제공합니다.",
};

export default function ChatbotPage() {
  return (
    <main>
      <Header title="AI 챗" />
      <ChatbotClient />
    </main>
  );
}
