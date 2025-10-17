import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getMessage(v: unknown): string | undefined {
  if (typeof v === "object" && v && "message" in v) {
    const m = (v as { message?: unknown }).message;
    return typeof m === "string" ? m : undefined;
  }
  return undefined;
}

function prettyMessage(
  data: unknown,
  text: string,
  status: number,
  fallback: string
) {
  const msg = getMessage(data) ?? (text || "");
  if (msg) return msg;
  if (status >= 500)
    return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  return fallback;
}

export async function PATCH(req: Request) {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
      return Response.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL;

    const { carrier, level } = (await req.json().catch(() => ({}))) as {
      carrier?: string;
      level?: string;
    };

    if (!carrier || !level) {
      return Response.json(
        { success: false, message: "carrier와 level은 필수입니다." },
        { status: 400 }
      );
    }

    const carrierMap: Record<string, string> = {
      SKT: "SKT",
      KT: "KT",
      "LGU+": "LGU+",
    };

    const upstream = await fetch(`${backend}/api/membership/update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        carrier: carrierMap[carrier] ?? carrier,
        level: level.toUpperCase(), 
      }),
      cache: "no-store",
    });

    const text = await upstream.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {}

    if (!upstream.ok) {
      console.error("[membership:update] backend error", {
        status: upstream.status,
        text,
      });
      return Response.json(
        {
          success: false,
          message: prettyMessage(data, text, upstream.status, "업데이트 실패"),
        },
        { status: upstream.status }
      );
    }

    return Response.json(data, { status: upstream.status });
  } catch (err) {
    console.error("[membership:update] route error", err);
    return Response.json(
      { success: false, message: "예기치 못한 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
