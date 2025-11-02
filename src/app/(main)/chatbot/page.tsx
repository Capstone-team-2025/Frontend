import ChatbotClient from "./ChatbotClient";
import Header from "@/components/common/Header";

export const metadata = {
  title: "챗봇 대화 페이지",
};

export default function ChatbotPage() {
  return (
    <main>
      <Header title="AI 챗" />
      <ChatbotClient />
    </main>
  );
}
