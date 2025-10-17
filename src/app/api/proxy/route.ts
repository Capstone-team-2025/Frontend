import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ message: "invalid path" }, { status: 400 });
  }

  // 원본 쿼리 전달 (path 제외)
  const forwardUrl = new URL(BASE + path);
  req.nextUrl.searchParams.forEach((v, k) => {
    if (k !== "path") forwardUrl.searchParams.set(k, v);
  });

  // 프론트 쿠키에서 JWT 추출
  const token = req.cookies.get("auth_token")?.value;

  const res = await fetch(forwardUrl.toString(), {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
