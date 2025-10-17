export const metadata = { title: "문의하기" };

import Header from "@/components/common/Header";
import ContactClient from "./ContactClient";

export default function ContactPage() {
  return (
    <div className="px-4">
      <Header title="문의하기" />
      <ContactClient />
    </div>
  );
}
