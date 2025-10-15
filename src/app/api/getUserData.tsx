
import { cookies } from "next/headers";

export async function getUserData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/kakao/me`,
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      credentials: "include",
    }
  );

  if (!res.ok) {
    throw new Error(`getUserData failed: ${res.status}`);
  }

  const json = await res.json();
  return json.user;
}
