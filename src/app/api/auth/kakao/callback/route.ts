// src/app/api/auth/kakao/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

type KakaoTokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
};

type KakaoMeResponse = {
  id: number;
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
};

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

    const tokenRes = await axios.post<KakaoTokenResponse>(
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

    const accessToken = tokenRes.data.access_token;

    // 2) 사용자 정보
    const meRes = await axios.get<KakaoMeResponse>(
      "https://kapi.kakao.com/v2/user/me",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10_000,
        validateStatus: (s) => s >= 200 && s < 300,
      }
    );

    const me = meRes.data;
    const nickname =
      me.properties?.nickname ?? me.kakao_account?.profile?.nickname ?? "";
    const image =
      me.properties?.profile_image ??
      me.kakao_account?.profile?.profile_image_url ??
      "";

    const user = {
      id: me.id,
      nickname,
      email: me.kakao_account?.email ?? "",
      image,
    };

    // 3) 응답 생성 + 쿠키 설정
    const res = NextResponse.redirect(new URL("/signup", req.url));
    res.cookies.set("session", JSON.stringify({ provider: "kakao", user }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7일
    });

    return res;
  } catch (err: unknown) {
    // axios 에러 처리
    if (axios.isAxiosError(err)) {
      if (err.code === "ECONNABORTED") {
        return NextResponse.json({ message: "request timeout" }, { status: 504 });
      }

      const status = err.response?.status ?? 500;
      const data = (() => {
        const d = err.response?.data;
        if (!d) return undefined;
        if (typeof d === "string") return d;
        try {
          return JSON.stringify(d);
        } catch {
          return "axios error";
        }
      })();

      return NextResponse.json(
        { message: "kakao api error", status, data },
        { status }
      );
    }

    // 비-axios 에러
    const msg = err instanceof Error ? err.message : "internal error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
