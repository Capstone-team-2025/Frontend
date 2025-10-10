import MyPageClient from "./MypageClient";

export const metadata = { title: "마이페이지" };

export default function SignupPage() {
  const user = { nickname: "다현", grade: "VVIP", profile: "" }; //임시user
  return <MyPageClient user={user} />;
}
