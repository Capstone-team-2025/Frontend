import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

interface SignupCompleteRequest {
  carrier: string;
  level: string;
}

interface BackendSignupSuccessResponse {
  success: true;
  message: string;
  user: {
    id: number;
    kakaoId: number;
    nickname: string;
    profileImage: string;
    carrier: string;
    level: string;
    cardNumber?: string;
    alertEnabled: boolean;
  };
  accessToken?: string;
}

interface BackendSignupErrorResponse {
  success: false;
  message: string;
  error: string;
}

type BackendSignupResponse =
  | BackendSignupSuccessResponse
  | BackendSignupErrorResponse;

export async function POST(req: NextRequest) {
  const authToken = req.cookies.get("auth_token")?.value;
  if (!authToken) {
    return NextResponse.json(
      { success: false, message: "인증 토큰이 없습니다" },
      { status: 401 }
    );
  }

  const body: SignupCompleteRequest = await req.json();
  const { carrier, level } = body;
  if (!carrier || !level) {
    return NextResponse.json(
      { success: false, message: "통신사와 등급 정보가 필요합니다" },
      { status: 400 }
    );
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { success: false, message: "Backend URL not configured" },
      { status: 500 }
    );
  }

  const fullUrl = `${backendUrl}/api/auth/signup/complete`;
  const backendRes = await axios.post<BackendSignupResponse>(
    fullUrl,
    { carrier, level },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10_000,
      validateStatus: (s) => s >= 200 && s < 300,
    }
  );

  const data = backendRes.data;
  if (!data.success) {
    return NextResponse.json(
      {
        success: false,
        message: data.message,
        error: (data as BackendSignupErrorResponse).error ?? "",
      },
      { status: 500 }
    );
  }

  const res = NextResponse.json({
    success: true,
    message: data.message,
    user: data.user,
  });

  if (typeof data.accessToken === "string" && data.accessToken.length > 0) {
    res.cookies.set("auth_token", data.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }

  return res;
}
