export const metadata = { title: "멤버십 카드 등록" };

import Header from "@/components/common/Header";
import AddClient from "./addClient";

export default function AddPage() {
  return (
    <main>
      <Header title="멤버십 카드" />
      <AddClient />
    </main>
  );
}
