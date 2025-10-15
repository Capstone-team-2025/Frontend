import axios from "axios";
import { cookies } from "next/headers";

export async function getUserData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const res = await axios.get(
    process.env.NEXT_PUBLIC_BACKEND_URL + "/api/auth/kakao/me",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = res.data.user;

  return data;
}
