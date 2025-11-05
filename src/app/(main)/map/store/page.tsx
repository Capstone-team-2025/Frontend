import type { Metadata, Viewport } from "next";
import Header from "@/components/common/Header";

export const metadata: Metadata = {
  title: "가게 상세 페이지",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function StorePage() {
  return (
    <main>
      <Header title="할인지도" />
    </main>
  );
}
