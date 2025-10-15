import { getUserData } from "@/app/api/getUserData";
import MyPageClient from "./MypageClient";
import Header from "@/components/common/Header";
export const metadata = { title: "마이페이지" };

export default async function SignupPage() {
  const data = await getUserData();

  const user = {
    nickname: data.nickname,
    grade: data.levelDisplayName,
    profile: data.profileImage,
  };

  return (
    <main>
      <Header title="마이 프로필" /> <MyPageClient user={user} />
    </main>
  );
}
