import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (token) {
      // 백엔드 로그아웃 API 호출
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/kakao/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        console.error("Backend logout failed:", error);
      }
    }

    // 쿠키 삭제 (설정할 때와 동일한 옵션으로)
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0, // 즉시 만료
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
