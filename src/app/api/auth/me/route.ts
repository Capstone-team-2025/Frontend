import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

interface BackendOk {
  success: true;
  user: {
    id: number;
    kakaoId: number;
    nickname: string;
    profileImage?: string;
    level?: string;
    levelDisplayName?: string;
  };
}
interface BackendErr {
  success: false;
  message?: string;
  needRelogin?: boolean;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "No token", needRelogin: true },
      { status: 401 }
    );
  }

  try {
    const res = await axios.get<BackendOk>(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/kakao/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return NextResponse.json({ user: res.data.user });
  } catch (e) {
    const err = e as AxiosError<BackendErr>;
    const status = err.response?.status ?? 500;

    if (status === 401) {
      return NextResponse.json({ needRelogin: true }, { status: 401 });
    }

    console.error("Error fetching user:", err.message);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
