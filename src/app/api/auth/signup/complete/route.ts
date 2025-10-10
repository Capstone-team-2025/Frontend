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
  try {
    // 쿠키에서 인증 토큰 가져오기
    const authToken = req.cookies.get("auth_token")?.value;

    if (!authToken) {
      console.error("[Signup Complete] No auth token found");
      return NextResponse.json(
        { success: false, message: "인증 토큰이 없습니다" },
        { status: 401 }
      );
    }

    // 요청 바디에서 carrier와 level 가져오기
    const body: SignupCompleteRequest = await req.json();
    const { carrier, level } = body;

    if (!carrier || !level) {
      console.error("[Signup Complete] Missing carrier or level");
      return NextResponse.json(
        { success: false, message: "통신사와 등급 정보가 필요합니다" },
        { status: 400 }
      );
    }

    // const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_DEV; // 개발용 백엔드 URL 사용
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL; // 배포용 백엔드 URL 사용
    if (!backendUrl) {
      console.error("[Signup Complete] NEXT_PUBLIC_BACKEND_URL is not defined");
      return NextResponse.json(
        { success: false, message: "Backend URL not configured" },
        { status: 500 }
      );
    }

    const fullUrl = `${backendUrl}/api/auth/signup/complete`;
    console.log("[Signup Complete] Calling backend:", fullUrl, {
      carrier,
      level,
    });

    // 백엔드로 회원가입 완료 정보 전송
    const backendRes = await axios.post<BackendSignupResponse>(
      fullUrl,
      {
        carrier,
        level,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10_000,
        validateStatus: (s) => s >= 200 && s < 300,
      }
    );

    console.log(
      "[Signup Complete] Backend response status:",
      backendRes.status
    );

    const data = backendRes.data;

    // 백엔드 에러 응답 처리
    if (!data.success) {
      console.error("[Signup Complete Error]", data.message, data.error);
      return NextResponse.json(
        { success: false, message: data.message, error: data.error },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: data.message,
      user: data.user,
    });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.code === "ECONNABORTED") {
        console.error("[Signup Complete] Request timeout");
        return NextResponse.json(
          { success: false, message: "요청 시간이 초과되었습니다" },
          { status: 504 }
        );
      }

      const status = err.response?.status ?? 500;
      const data = err.response?.data;

      console.error("[Signup Complete] Backend error:", {
        status,
        data,
        url: err.config?.url,
        method: err.config?.method,
      });

      return NextResponse.json(
        {
          success: false,
          message: "회원가입 완료 처리 중 오류가 발생했습니다",
          status,
          error: typeof data === "string" ? data : JSON.stringify(data),
        },
        { status }
      );
    }

    const msg = err instanceof Error ? err.message : "internal error";
    console.error("[Signup Complete] Unexpected error:", msg, err);
    return NextResponse.json(
      { success: false, message: "예상치 못한 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
