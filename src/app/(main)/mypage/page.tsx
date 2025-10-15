import { cookies } from "next/headers";
import MyPageClient from "./MypageClient";
import Header from "@/components/common/Header";
import axios from "axios";
import { redirect } from "next/navigation";
export const metadata = { title: "마이페이지" };

export default async function MyPagePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    redirect("/api/auth/kakao");
  }
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/kakao/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10_000,
        validateStatus: (s) => s >= 200 && s < 300,
      }
    );

    const data = res.data;
    const user = {
      nickname: data.user?.nickname ?? "",
      grade: data.user?.level ?? "",
      profile: data.user?.profileImage ?? "",
    };
    return (
      <main>
        <Header title="마이 프로필" />
        <MyPageClient user={user} />
      </main>
    );
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      if (e.response?.status === 401) {
        redirect("/api/auth/kakao");
      }
    }
    throw e;
  }
}
