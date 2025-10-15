import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // 보호된 경로 체크 (map, chatbot, membership, mypage 등)
  const protectedRoutes = ["/map", "/chatbot", "/membership", "/mypage"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // 로그인 페이지
  const isLoginPage = pathname === "/";

  console.log("isProtectedRoute:", isProtectedRoute);
  console.log("isLoginPage:", isLoginPage);

  // 보호된 경로인데 토큰이 없으면 로그인 페이지로 리다이렉트
  if (isProtectedRoute && !token) {
    console.log("Redirecting to login (no token)");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 로그인 페이지인데 토큰이 있으면 /map으로 리다이렉트
  if (isLoginPage && token) {
    console.log("Redirecting to /map (has token)");
    return NextResponse.redirect(new URL("/map", request.url));
  }

  console.log("Proceeding to next");
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};
