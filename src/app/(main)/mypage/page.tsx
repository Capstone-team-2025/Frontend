import MyPageClient from "./MypageClient";
import Header from "@/components/common/Header";
export const metadata = { title: "마이페이지" };

export default function SignupPage() {
  const user = { nickname: "다현", grade: "VVIP", profile: "" }; //임시user
  return (
    <main>
      <Header title="마이 프로필" /> <MyPageClient user={user} />
    </main>
  );
}
