export const dynamic = "force-dynamic";
import { cookies } from "next/headers";

type Membership = {
  membershipId: number;
  userId: number;
  carrier: "SKT" | "KT" | "LGU+";
  level: string;
  levelDisplayName?: string;
  cardNumber?: string;
  alertEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function GET() {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
      return Response.json(
        { success: false, message: "Unauthorized: no auth_token" },
        { status: 401 }
      );
    }

    const base = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!base) {
      return Response.json(
        { success: false, message: "NEXT_PUBLIC_BACKEND_URL missing" },
        { status: 500 }
      );
    }

    const r = await fetch(`${base}/api/membership/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const text = await r.text();
    if (!r.ok) {
      return Response.json(
        { success: false, message: `backend ${r.status}: ${text}` },
        { status: r.status }
      );
    }

    let payload: Membership;
    try {
      payload = JSON.parse(text) as Membership;
    } catch {
      return Response.json({ success: true, membership: { raw: text } }, { status: 200 });
    }

    return Response.json({ success: true, membership: payload }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}
