import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  "http://localhost:8080";

const ALLOW_PREFIXES = [
  "/api/favorites",
  "/api/places",
  "/api/stores",
  "/api/auth",
  "/api/benefits",
] as const;
type AllowPath = (typeof ALLOW_PREFIXES)[number];

function validatePath(path: string): path is AllowPath | `${AllowPath}/${string}` {
  return path.startsWith("/") &&
    ALLOW_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function buildTargetUrl(req: NextRequest): string {
  const path = req.nextUrl.searchParams.get("path") ?? "/";
  const url = new URL(BASE + path);
  req.nextUrl.searchParams.forEach((v, k) => {
    if (k !== "path") url.searchParams.set(k, v);
  });
  return url.toString();
}

function extractValidAuth(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.match(/^Bearer\s+(.+)$/i);
  if (m) {
    const token = m[1].trim();
    if (!token || token === "undefined" || token === "null") return null;
    return `Bearer ${token}`;
  }
  return raw;
}

function buildForwardHeaders(req: NextRequest, extra?: Record<string, string>): Headers {
  const h = new Headers();

  const validFromHeader = extractValidAuth(req.headers.get("authorization"));
  if (validFromHeader) h.set("authorization", validFromHeader);

  if (!h.has("authorization")) {
    const tokenFromCookie = req.cookies.get("auth_token")?.value;
    if (tokenFromCookie && tokenFromCookie !== "undefined" && tokenFromCookie !== "null") {
      h.set("authorization", `Bearer ${tokenFromCookie}`);
    }
  }

  const ct = req.headers.get("content-type");
  if (ct) h.set("content-type", ct);

  if (extra) for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return h;
}

function maskAuthorization(auth: string | null): string {
  if (!auth) return "(none)";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return "(present-non-bearer)";
  const token = m[1];
  if (token.length <= 8) return "Bearer ****(short)";
  return `Bearer ${token.slice(0, 8)}…(masked)`;
}

async function forward(req: NextRequest, method: "GET" | "POST" | "DELETE") {
  const rawPath = req.nextUrl.searchParams.get("path") ?? "";
  if (!validatePath(rawPath)) {
    return NextResponse.json({ message: "invalid path", path: rawPath }, { status: 400 });
  }

  const target = buildTargetUrl(req);
  const headers = buildForwardHeaders(req);
  const init: RequestInit = { method, headers, cache: "no-store" };
  if (method === "POST") init.body = await req.text();

  if (process.env.NODE_ENV !== "production") {
    const masked = maskAuthorization(headers.get("authorization"));
    console.log("[proxy→backend]", method, target, "Authorization:", masked);
  }

  const res = await fetch(target, init);
  const text = await res.text();

  // 여전히 401이면 프론트 전역 인터셉터가 처리하도록 신호
  if (res.status === 401) {
    return NextResponse.json({ needRelogin: true }, { status: 401 });
  }

  const debugHeaders: Record<string, string> =
    process.env.NODE_ENV !== "production"
      ? {
          "x-debug-proxy-auth": headers.get("authorization") ? "present" : "absent",
          "x-debug-proxy-target": target,
        }
      : {};

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
      ...debugHeaders,
    },
  });
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function GET(req: NextRequest) {
  try {
    return await forward(req, "GET");
  } catch (e: unknown) {
    return NextResponse.json({ error: errorMessage(e) || "proxy error" }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    return await forward(req, "POST");
  } catch (e: unknown) {
    return NextResponse.json({ error: errorMessage(e) || "proxy error" }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest) {
  try {
    return await forward(req, "DELETE");
  } catch (e: unknown) {
    return NextResponse.json({ error: errorMessage(e) || "proxy error" }, { status: 500 });
  }
}
