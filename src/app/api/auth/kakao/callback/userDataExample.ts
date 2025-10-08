import { cookies } from "next/headers";

async function getUserData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const res = await fetch(
    process.env.NEXT_PUBLIC_BACKEND_URL + "/api/auth/kakao/me",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json();
  // data.user.id, data.user.nickname, data.user.profileImage

  return data;
}

export default getUserData;
