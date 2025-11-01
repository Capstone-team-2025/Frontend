import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 두 환경변수 중 하나만 세팅돼 있어도 동작
const BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  "http://localhost:8080";

// 허용 경로 화이트리스트 (보안/오동작 예방)
const ALLOW_PREFIXES = [
  "/api/favorites",
  "/api/places",
  "/api/stores",
  "/api/auth",
];

function validatePath(path: string) {
  return (
    path.startsWith("/") &&
    ALLOW_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))
  );
}

function buildTargetUrl(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") ?? "/";
  const u = new URL(BASE + path);
  // path 외의 쿼리 그대로 전달
  req.nextUrl.searchParams.forEach((v, k) => {
    if (k !== "path") u.searchParams.set(k, v);
  });
  return u.toString();
}

function buildForwardHeaders(req: NextRequest, extra?: Record<string, string>) {
  const h = new Headers();

  // 클라이언트가 Authorization을 보냈다면 그대로 전달
  const authFromHeader = req.headers.get("authorization");
  if (authFromHeader) h.set("authorization", authFromHeader);

  // 없으면 httpOnly 쿠키에서 읽어 Bearer 구성
  if (!authFromHeader) {
    const tokenFromCookie = req.cookies.get("auth_token")?.value;
    if (tokenFromCookie) h.set("authorization", `Bearer ${tokenFromCookie}`);
  }

  // content-type 등 필요한 헤더 전달
  const ct = req.headers.get("content-type");
  if (ct) h.set("content-type", ct);

  // 추가 헤더
  if (extra) Object.entries(extra).forEach(([k, v]) => h.set(k, v));

  return h;
}

async function forward(req: NextRequest, method: "GET" | "POST" | "DELETE") {
  const rawPath = req.nextUrl.searchParams.get("path");
  if (!rawPath || !validatePath(rawPath)) {
    return NextResponse.json({ message: "invalid path" }, { status: 400 });
  }

  const target = buildTargetUrl(req);
  const headers = buildForwardHeaders(req);

  const init: RequestInit = { method, headers, cache: "no-store" };
  if (method === "POST") {
    // body 그대로 전달(스트리밍 X)
    init.body = await req.text();
  }

  // ─── DEV 전용: 프록시→백엔드 Authorization 로그 (마스킹) ───
  if (process.env.NODE_ENV !== "production") {
    const hdrs = init.headers as Headers & Record<string, any>;
    const auth = hdrs.get?.("authorization") ?? (hdrs as any)["authorization"];
    const masked = auth
      ? String(auth).replace(/^Bearer\s+(.{8}).+$/, "Bearer $1…(masked)")
      : "(none)";
    console.log("[proxy→backend]", method, target, "Authorization:", masked);
  }

  const res = await fetch(target, init);
  const text = await res.text();

  // ─── DEV 전용: 응답 헤더로 Authorization 유무 플래그 ───
  const hdrs = (init.headers as Headers) as Headers & Record<string, any>;
  const hadAuth =
    hdrs.get?.("authorization") ?? (hdrs as any)["authorization"];

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
      ...(process.env.NODE_ENV !== "production"
        ? {
            "x-debug-proxy-auth": hadAuth ? "present" : "absent",
            "x-debug-proxy-target": target,
          }
        : {}),
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    return await forward(req, "GET");
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "proxy error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return await forward(req, "POST");
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "proxy error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    return await forward(req, "DELETE");
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "proxy error" },
      { status: 500 }
    );
  }
}
