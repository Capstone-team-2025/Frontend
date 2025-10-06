import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const clientId = process.env.KAKAO_REST_API_KEY;
  if (!clientId) {
    return NextResponse.json({ message: "KAKAO_REST_API_KEY missing" }, { status: 500 });
  }

  const origin = new URL(req.url).origin; // dev: http://localhost:3000, prod: https://mapnefit.vercel.app
  const redirectUri = `${origin}/api/auth/kakao/callback`;

  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");

  console.log("[KAKAO AUTH URL]", url.toString()); // 디버그용 로그 찍기

  return NextResponse.redirect(url);
}