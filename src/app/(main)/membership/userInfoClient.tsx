"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserInfo from "@/components/common/UserInfo";
import { extractUserFromMe, extractGrade, MeUser } from "@/lib/me";

type UserShape = { grade?: string | null };

function firstNonEmpty(...vals: Array<string | null | undefined>) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return "";
}

function pickBestUser({
  fromProps,
  fromAuth,
  fromLocal,
}: {
  fromProps?: UserShape | null;
  fromAuth?: UserShape | null;
  fromLocal?: UserShape | null;
}) {
  const grade = firstNonEmpty(
    fromProps?.grade,
    fromAuth?.grade,
    fromLocal?.grade
  );
  return { grade };
}

export default function MembershipUserInfo(props: { user?: UserShape | null }) {
  const { user: authUserRaw } = useAuth() as { user?: UserShape | null };
  const [localUser, setLocalUser] = useState<UserShape | null>(null);

  useEffect(() => {
    try {
      const g =
        localStorage.getItem("user_grade") ??
        localStorage.getItem("membership_grade") ??
        localStorage.getItem("level") ??
        undefined;
      setLocalUser({ grade: g });
    } catch {}
  }, []);

  const merged = useMemo(
    () =>
      pickBestUser({
        fromProps: props.user,
        fromAuth: authUserRaw,
        fromLocal: localUser,
      }),
    [props.user, authUserRaw, localUser]
  );

  useEffect(() => {
    const g = merged.grade ?? "";
    try {
      if (g) {
        localStorage.setItem("user_grade", g);
        localStorage.setItem("membership_grade", g);
        localStorage.setItem("level", g);
      }
    } catch {}
  }, [merged.grade]);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const raw = await res.text();
        if (!res.ok || !raw) return;
        const data: unknown = JSON.parse(raw);
        const u = extractUserFromMe(data);
        const g = extractGrade(u);
        if (!abort && g && g !== merged.grade) {
          setLocalUser({ grade: g });
        }
      } catch {}
    })();
    return () => {
      abort = true;
    };
  }, [merged.grade]);

  useEffect(() => {
    if (merged.grade) return;
    let abort = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const raw = await res.text();
        if (!res.ok || !raw) return;
        const data: unknown = JSON.parse(raw);
        const u: MeUser | undefined = extractUserFromMe(data);
        const g = extractGrade(u);
        if (!abort && g) setLocalUser({ grade: g });
      } catch {}
    })();
    return () => {
      abort = true;
    };
  }, [merged.grade]);

  return (
    <>
      <UserInfo grade={merged.grade ?? ""} condensed />
    </>
  );
}
