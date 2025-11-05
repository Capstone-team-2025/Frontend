import type { Metadata, Viewport } from "next";
import Header from "@/components/common/Header";
import AddClient from "./addClient";

export const metadata: Metadata = {
  title: "멤버십 카드 등록",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function AddPage() {
  return (
    <main>
      <Header title="멤버십 카드" />
      <AddClient />
    </main>
  );
}
