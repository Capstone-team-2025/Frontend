export const dynamic = "force-dynamic";
import { cookies } from "next/headers";

export async function PUT(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return new Response("Unauthorized", { status: 401 });

  const { nickname } = await req.json();
  if (!nickname) return new Response("Invalid nickname", { status: 400 });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/update`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nickname }),
      cache: "no-store",
    }
  );

  const text = await res.text();
  return new Response(text, { status: res.status });
}
