export const metadata = { title: "멤버십 카드" };

import Header from "@/components/common/Header";
import MembershipClient from "./membershipClient";
import MembershipUserInfo from "./userInfoClient";

export default function MembershipPage() {
  return (
    <main>
      <Header title="멤버십 카드" />
      <div className="pt-5">
        <MembershipUserInfo />
        <MembershipClient />
      </div>
    </main>
  );
}
