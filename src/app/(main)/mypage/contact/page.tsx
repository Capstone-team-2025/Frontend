import type { Metadata, Viewport } from "next";
import Header from "@/components/common/Header";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "문의하기",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function ContactPage() {
  return (
    <main>
      <Header title="문의하기" />
      <ContactClient />
    </main>
  );
}
