import Header from "@/components/common/Header";
import MembershipClient from "./membershipClient";
import MembershipUserInfo from "./userInfoClient";
import { cookies } from "next/headers";
import { extractUserFromMe, extractGrade } from "@/lib/me";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MembershipPage() {
  let grade = "";

  try {
    const store = await cookies();
    const cookieHeader = store
      .getAll()
      .map((v) => `${v.name}=${v.value}`)
      .join("; ");

    const res = await fetch("/api/auth/me", {
      cache: "no-store",
      headers: { cookie: cookieHeader },
    });

    const raw = await res.text();
    if (res.ok && raw) {
      const data: unknown = JSON.parse(raw);
      const u = extractUserFromMe(data);
      grade = extractGrade(u);
    }
  } catch {}

  return (
    <main>
      <Header title="멤버십 카드" />
      <div className="pt-5">
        <MembershipUserInfo user={grade ? { grade } : undefined} />
        <MembershipClient />
      </div>
    </main>
  );
}
