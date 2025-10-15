import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const pathname = req.nextUrl.pathname;
  const protectedPrefixes = ["/mypage", "/map", "/membership", "/chatbot"];

  if (!token && protectedPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/api/auth/kakao", req.url));
  }
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/map", req.url));
  }
  if (token) {
    try {
      const meRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/kakao/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      if (!meRes.ok) {
        console.warn("[middleware] Invalid token, redirecting to kakao");
        return NextResponse.redirect(new URL("/api/auth/kakao", req.url));
      }

      const me = await meRes.json();
      const isCompleted = Boolean(me?.user?.carrier && me?.user?.level);

      if (isCompleted && pathname.startsWith("/signup")) {
        return NextResponse.redirect(new URL("/mypage", req.url));
      }

      if (
        !isCompleted &&
        protectedPrefixes.some((p) => pathname.startsWith(p))
      ) {
        return NextResponse.redirect(new URL("/signup", req.url));
      }
    } catch (err) {
      console.error("[middleware] Fetch error:", err);
      return NextResponse.redirect(new URL("/api/auth/kakao", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|images|favicon.ico|api/auth/kakao/callback).*)"],
};
