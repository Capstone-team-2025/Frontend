import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

interface BackendAuthSuccessResponse {
  success: true;
  token: string;
  user: {
    id: number;
    kakaoId: number;
    nickname: string;
    profileImage: string;
  };
}

interface BackendAuthErrorResponse {
  success: false;
  message: string;
  error: string;
}

type BackendAuthResponse =
  | BackendAuthSuccessResponse
  | BackendAuthErrorResponse;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ message: "no code" }, { status: 400 });
  }

  try {
    // redirect_uri 동적 생성
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const redirectUri = `${protocol}://${host}/api/auth/kakao/callback`;

    // 백엔드로 code와 redirect_uri 전달
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9090";
    const backendRes = await axios.get<BackendAuthResponse>(
      `${backendUrl}/api/auth/kakao/callback`,
      {
        params: { code, redirect_uri: redirectUri },
        timeout: 10_000,
        validateStatus: (s) => s >= 200 && s < 300,
      }
    );

    const data = backendRes.data;

    // 백엔드 에러 응답 처리
    if (!data.success) {
      console.error("[Backend Auth Error]", data.message, data.error);
      return NextResponse.json(
        { message: data.message, error: data.error },
        { status: 500 }
      );
    }

    const { token } = data;
    // JWT 토큰만 httpOnly 쿠키에 저장
    const res = NextResponse.redirect(new URL("/signup", req.url));
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24시간
    });

    return res;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.code === "ECONNABORTED") {
        return NextResponse.json(
          { message: "request timeout" },
          { status: 504 }
        );
      }

      const status = err.response?.status ?? 500;
      const data = err.response?.data;

      console.error("[Backend Auth Error]", { status, data });

      return NextResponse.json(
        {
          message: "backend auth error",
          status,
          data: typeof data === "string" ? data : JSON.stringify(data),
        },
        { status }
      );
    }

    const msg = err instanceof Error ? err.message : "internal error";
    console.error("[Auth Error]", msg);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
