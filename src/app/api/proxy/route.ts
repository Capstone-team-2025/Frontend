import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;

// 허용 경로 화이트리스트
const ALLOW_PREFIXES = [
  "/api/favorites",
  "/api/places",
  "/api/stores",
  "/api/auth",
];

function validatePath(path: string) {
  return (
    path.startsWith("/") &&
    ALLOW_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))
  );
}

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path || !validatePath(path)) {
    return NextResponse.json({ message: "invalid path" }, { status: 400 });
  }

  // 원본 쿼리 전달 (path 제외)
  const forwardUrl = new URL(BASE + path);
  req.nextUrl.searchParams.forEach((v, k) => {
    if (k !== "path") forwardUrl.searchParams.set(k, v);
  });

  const token = req.cookies.get("auth_token")?.value;

  const res = await fetch(forwardUrl.toString(), {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function POST(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path || !validatePath(path)) {
    return NextResponse.json({ message: "invalid path" }, { status: 400 });
  }

  const token = req.cookies.get("auth_token")?.value;
  const body = await req.text();

  const res = await fetch(BASE + path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function DELETE(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path || !validatePath(path)) {
    return NextResponse.json({ message: "invalid path" }, { status: 400 });
  }

  const token = req.cookies.get("auth_token")?.value;

  const res = await fetch(BASE + path, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
