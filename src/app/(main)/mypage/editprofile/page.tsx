export const metadata = { title: "프로필변경페이지" };

import Header from "@/components/common/Header";
import EditProfileClient from "./EditProfileClient";
import { getUserData } from "@/app/api/getUserData";

export default async function editprofilePage() {
  const data = await getUserData();

  const initialNickname = data?.nickname ?? "";
  const initialProfileUrl = data?.profileImage ?? null;

  return (
    <main>
      <Header title="프로필 변경" />
      <EditProfileClient
        initialNickname={initialNickname}
        initialProfileUrl={initialProfileUrl}
      />
    </main>
  );
}
