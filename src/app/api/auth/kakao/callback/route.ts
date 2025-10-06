// src/app/api/auth/kakao/callback/route.ts
//GET /api/auth/kakao/callback (카카오 콜백)
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ message: "no code" }, { status: 400 });

  // 1) 코드 → 토큰
  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.KAKAO_REST_API_KEY!,
      redirect_uri: process.env.KAKAO_REDIRECT_URI!,
      code,
      ...(process.env.KAKAO_CLIENT_SECRET
        ? { client_secret: process.env.KAKAO_CLIENT_SECRET }
        : {}),
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) return NextResponse.json(tokenJson, { status: tokenRes.status });

  const accessToken = tokenJson.access_token as string;

  // 2) 사용자 정보
  const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const me = await meRes.json();
  if (!meRes.ok) return NextResponse.json(me, { status: meRes.status });

  const user = {
    id: me.id,
    nickname: me.properties?.nickname ?? "",
    email: me.kakao_account?.email ?? "",
    image: me.properties?.profile_image ?? "",
  };

  // 3) 응답 생성 + 쿠키 설정
  const res = NextResponse.redirect(new URL("/map", req.url));
  res.cookies.set("session", JSON.stringify({ provider: "kakao", user }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7일
  });

  return res;
}
