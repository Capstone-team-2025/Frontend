import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token found" },
        { status: 401 }
      );
    }

    // 백엔드 탈퇴 API 호출
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/kakao/quit`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Backend quit failed:", error);
      if (axios.isAxiosError(error)) {
        return NextResponse.json(
          { error: error.response?.data?.message || "Account deletion failed" },
          { status: error.response?.status || 500 }
        );
      }
      throw error;
    }

    // 쿠키 삭제 (탈퇴 성공 시)
    const response = NextResponse.json({
      success: true,
      message: "Account deleted successfully"
    });

    response.cookies.set("auth_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0, // 즉시 만료
    });

    return response;
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Account deletion failed" },
      { status: 500 }
    );
  }
}
