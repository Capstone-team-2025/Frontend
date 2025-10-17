import { cookies } from "next/headers";
export async function GET() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token)
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/membership`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
