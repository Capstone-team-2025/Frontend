import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

interface BackendAuthSuccessResponse {
  success: true;
  token?: string;
  accessToken?: string;
  isNewUser?: boolean;
  user: {
    id: number;
    kakaoId: number;
    nickname: string;
    profileImage: string;
    carrier?: string;
    level?: string;
  };
}

interface BackendAuthErrorResponse {
  success: false;
  message: string;
  error: string;
}

type BackendAuthResponse = BackendAuthSuccessResponse | BackendAuthErrorResponse;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ message: "no code" }, { status: 400 });
  }

  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host") || "localhost:3000";
  const redirectUri = `${protocol}://${host}/api/auth/kakao/callback`;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ message: "Backend URL not configured" }, { status: 500 });
  }

  const fullUrl = `${backendUrl}/api/auth/kakao/callback`;
  const backendRes = await axios.get<BackendAuthResponse>(fullUrl, {
    params: { code, redirect_uri: redirectUri },
    timeout: 10_000,
    validateStatus: (s) => s >= 200 && s < 300,
  });

  const data = backendRes.data;
  if (!data.success) {
    return NextResponse.json(
      { message: data.message, error: data.error },
      { status: 500 }
    );
  }

  const shouldSignup = data.isNewUser ?? !data.user?.carrier;
  const redirectTo = new URL(shouldSignup ? "/signup" : "/map", req.url);
  if (shouldSignup) {
    const nickname = data.user?.nickname ?? "";
    if (nickname) redirectTo.searchParams.set("nickname", nickname);
  }

  const accessToken = data.accessToken ?? data.token;
  if (!accessToken) {
    return NextResponse.json({ message: "no access token in response" }, { status: 500 });
  }

  const res = NextResponse.redirect(redirectTo);

  res.cookies.set("auth_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return res;
}
