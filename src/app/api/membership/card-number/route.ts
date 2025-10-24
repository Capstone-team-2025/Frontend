import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  const headerAuth = req.headers.get("authorization");
  const cookieToken = req.cookies.get("auth_token")?.value;
  const auth = headerAuth ?? (cookieToken ? `Bearer ${cookieToken}` : null);
  if (!auth) return new Response("Unauthorized", { status: 401 });

  let body: { cardNumber?: string | null; grade?: string | null } = {};
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const upstream = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/membership/card-number`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify({
        cardNumber: body.cardNumber ?? null,
        grade: body.grade ?? null,
      }),
      cache: "no-store",
    }
  );

  const text = await upstream.text();
  return new Response(text, { status: upstream.status });
}
