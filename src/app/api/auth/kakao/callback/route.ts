// src/app/api/auth/kakao/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ message: "no code" }, { status: 400 });

  try {
    // 1) 코드 → 토큰
    const origin = new URL(req.url).origin;
    const redirectUrl = `${origin}/api/auth/kakao/callback`;

    const tokenForm = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.KAKAO_REST_API_KEY!,
      redirect_uri: redirectUrl,
      code,
    });
    if (process.env.KAKAO_CLIENT_SECRET) {
      tokenForm.append("client_secret", process.env.KAKAO_CLIENT_SECRET);
    }

    const tokenRes = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      tokenForm,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
        timeout: 10_000,
        validateStatus: (s) => s >= 200 && s < 300,
      }
    );

    const accessToken = tokenRes.data.access_token as string;

    // 2) 사용자 정보
    const meRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10_000,
      validateStatus: (s) => s >= 200 && s < 300,
    });

    const me = meRes.data;
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
  } catch (err: any) {
    if (err.response) {
      return NextResponse.json(
        {
          message: "kakao api error",
          status: err.response.status,
          data: err.response.data,
        },
        { status: err.response.status }
      );
    }
    if (err.code === "ECONNABORTED") {
      return NextResponse.json({ message: "request timeout" }, { status: 504 });
    }
    return NextResponse.json({ message: "internal error" }, { status: 500 });
  }
}