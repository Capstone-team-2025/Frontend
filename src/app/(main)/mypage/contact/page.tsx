export const metadata = { title: "문의하기" };

import Header from "@/components/common/Header";
import ContactClient from "./ContactClient";

export default function ContactPage() {
  return (
    <div >
      <Header title="문의하기" />
      <ContactClient />
    </div>
  );
}
