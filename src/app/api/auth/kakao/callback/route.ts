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
    carrier?: string | null;  
    level?: string | null; 
    cardNumber?: string | null;
    alertEnabled?: boolean;
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
    console.error("[Kakao Callback] No authorization code provided");
    return NextResponse.json({ message: "no code" }, { status: 400 });
  }

  try {
    // redirect_uri 동적 생성
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const redirectUri = `${protocol}://${host}/api/auth/kakao/callback`;

    // 백엔드로 code와 redirect_uri 전달
    // const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_DEV; // 개발용 백엔드 URL 사용
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL; // 배포용 백엔드 URL 사용

    // 디버깅 로그 추가
    console.log("[Kakao Callback] Configuration:", {
      backendUrl,
      redirectUri,
      codeLength: code.length,
      protocol,
      host,
    });

    if (!backendUrl) {
      console.error("[Kakao Callback] NEXT_PUBLIC_BACKEND_URL is not defined");
      return NextResponse.json(
        { message: "Backend URL not configured" },
        { status: 500 }
      );
    }

    const fullUrl = `${backendUrl}/api/auth/kakao/callback`;
    console.log("[Kakao Callback] Calling backend:", fullUrl);

    const backendRes = await axios.get<BackendAuthResponse>(fullUrl, {
      params: { code, redirect_uri: redirectUri },
      timeout: 10_000,
      validateStatus: (s) => s >= 200 && s < 300,
    });

    console.log("[Kakao Callback] Backend response status:", backendRes.status);

    const data = backendRes.data;

    // 백엔드 에러 응답 처리
    if (!data.success) {
      console.error("[Backend Auth Error]", data.message, data.error);
      return NextResponse.json(
        { message: data.message, error: data.error },
        { status: 500 }
      );
    }
    //닉네임 저장
    const { token, user } = data;

    const isCompleted = Boolean(user?.carrier && user?.level);
    const redirectTo = new URL(isCompleted ? "/map" : "/signup", req.url);
    if (!isCompleted && user) {
      if (user.nickname) redirectTo.searchParams.set("nickname", user.nickname);
      if (user.profileImage)
        redirectTo.searchParams.set("profile", user.profileImage);
      if (user.level) redirectTo.searchParams.set("level", user.level);
    }

    const res = NextResponse.redirect(redirectTo);
    // JWT 토큰만 httpOnly 쿠키에 저장
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
        console.error("[Kakao Callback] Request timeout");
        return NextResponse.json(
          { message: "request timeout" },
          { status: 504 }
        );
      }

      const status = err.response?.status ?? 500;
      const data = err.response?.data;

      console.error("[Kakao Callback] Backend error:", {
        status,
        data,
        url: err.config?.url,
        method: err.config?.method,
        params: err.config?.params,
      });

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
    console.error("[Kakao Callback] Unexpected error:", msg, err);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
