export const metadata = { title: "통신사/등급 재설정 페이지" };

import Header from "@/components/common/Header";
import SetMembershipClient from "./SetMembershipClient";
import { cookies } from "next/headers";

type Carrier = "SKT" | "KT" | "LGU+";

export default async function SetMembershipPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let initialCarrier: Carrier | undefined;
  let initialGrade: string | undefined;

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (token && backend) {
    try {
      const r = await fetch(`${backend}/api/membership/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (r.ok) {
        const me = await r.json();
        initialCarrier = me.carrier as Carrier | undefined;
        initialGrade = me.level as string | undefined;
      }
    } catch {}
  }

  return (
    <div>
      <Header title="통신사/등급 재설정" />
      <SetMembershipClient
        initialCarrier={initialCarrier}
        initialGrade={initialGrade}
      />
    </div>
  );
}
