import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function pickMessage(v: unknown): string | undefined {
  if (typeof v === "object" && v && "message" in v) {
    const m = (v as { message?: unknown }).message;
    return typeof m === "string" ? m : undefined;
  }
  return undefined;
}

export async function POST(req: Request) {
  try {
    const { context } = (await req.json().catch(() => ({}))) as { context?: string };
    if (!context?.trim()) {
      return Response.json({ success: false, message: "내용을 입력해주세요." }, { status: 400 });
    }

    const backend =process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backend) {
      console.warn("[contact] BACKEND_URL 미설정 - 로컬 로그로 대체 저장");
      console.log("[FEEDBACK:local]", context);
      return Response.json({ success: true, data: null });
    }

    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
      return Response.json({ success: false, message: "로그인이 필요합니다." }, { status: 401 });
    }

    let upstream: Response;
    try {
      upstream = await fetch(`${backend}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ context }),
        cache: "no-store",
      });
    } catch (e) {
      console.error("[contact] fetch 실패 - 백엔드와 통신 불가", e);
      return Response.json(
        { success: false, message: "서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요." },
        { status: 502 }
      );
    }

    const text = await upstream.text();
    let data: unknown = null;
    try { data = JSON.parse(text); } catch {}

    if (!upstream.ok) {
      console.error("[contact] backend error", { status: upstream.status, text });
      const msg = pickMessage(data) ?? (text || "");
      const friendly =
        upstream.status === 404
          ? "문의 API가 준비되지 않았습니다."
          : upstream.status >= 500
          ? "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
          : msg || "문의 등록에 실패했습니다.";
      return Response.json({ success: false, message: friendly }, { status: upstream.status });
    }

    return Response.json({ success: true, data: data ?? null });
  } catch (err) {
    console.error("[contact] route error", err);
    return Response.json({ success: false, message: "예기치 못한 오류가 발생했습니다." }, { status: 500 });
  }
}
