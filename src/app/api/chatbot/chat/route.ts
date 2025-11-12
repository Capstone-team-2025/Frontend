import { NextResponse } from "next/server";

type ChatRequest = {
  message: string;
  latitude?: number;
  longitude?: number;
  sessionId?: string;
};

type ChatResponse = {
  success: boolean | string;
  message: string;
  response: string;
  sessionId: string;
  timestamp: string; 
  data?: unknown;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<ChatRequest>;
    const auth = req.headers.get("authorization") ?? "";
    const BE = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8080").replace(/\/$/, "");

    const beRes = await fetch(`${BE}/api/chatbot/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify(body),
    });

    let data: ChatResponse;
    try {
      data = (await beRes.json()) as ChatResponse;
    } catch {
      data = {
        success: false,
        message: "서버 연결 실패",
        response: "",
        sessionId: "",
        timestamp: new Date().toISOString(),
      };
    }

    return NextResponse.json(data, { status: beRes.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "unknown";
    const err: ChatResponse = {
      success: false,
      message: "proxy error",
      response: `서버 연결 실패: ${msg}`,
      sessionId: "",
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(err, { status: 502 });
  }
}
