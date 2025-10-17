"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Carrier = "SKT" | "KT" | "LGU+";
type Grade =
  | "VIP"
  | "GOLD"
  | "SILVER"
  | "VVIP"
  | "골드"
  | "실버"
  | "화이트"
  | "일반"
  | "다이아몬드";

type CarrierGradeOptions = Partial<Record<Carrier, Grade[]>>;

const DEFAULT_GRADES_BY_CARRIER: Record<Carrier, Grade[]> = {
  SKT: ["VIP", "GOLD", "SILVER"],
  KT: ["VVIP", "VIP", "골드", "실버", "화이트", "일반"],
  "LGU+": ["VVIP", "VIP", "다이아몬드"],
};

const CARRIER_LABEL: Record<Carrier, string> = {
  SKT: "SKT",
  KT: "KT",
  "LGU+": "LGU+",
};

type UpdateResponse = {
  success: boolean;
  message?: string;
  membership?: {
    membershipId: number;
    userId: number;
    carrier: Carrier;
    level: Grade;
    cardNumber: string;
    alertEnabled: boolean;
  };
};

export default function SetMembershipClient({
  initialCarrier,
  initialGrade,
  gradeOptions,
}: {
  initialCarrier?: Carrier;
  initialGrade?: string;
  gradeOptions?: CarrierGradeOptions;
}) {
  const router = useRouter();

  const [viewCarrier, setViewCarrier] = useState<Carrier | "">("");
  const [viewGrade, setViewGrade] = useState<string>("");

  const [formCarrier, setFormCarrier] = useState<Carrier | "">("");
  const [formGrade, setFormGrade] = useState<Grade | "">("");

  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const carrierFromStorage =
      (localStorage.getItem("carrier") as Carrier | null) ?? null;
    const levelFromStorage = localStorage.getItem("level") ?? undefined;

    const initCarrier = initialCarrier ?? carrierFromStorage ?? "";
    const initGrade = (initialGrade ?? levelFromStorage ?? "") as string;

    setViewCarrier(initCarrier);
    setViewGrade(initGrade);

    setFormCarrier(initCarrier);
  }, [initialCarrier, initialGrade]);

  const allowedGrades: Grade[] = useMemo(() => {
    if (!formCarrier) return [];
    const table = gradeOptions ?? DEFAULT_GRADES_BY_CARRIER;
    return table[formCarrier] ?? [];
  }, [formCarrier, gradeOptions]);

  useEffect(() => {
    if (!formCarrier) return;
    if (!allowedGrades.includes(formGrade as Grade)) {
      setFormGrade("" as Grade | "");
    }
  }, [formCarrier, allowedGrades]);

  const save = async () => {
    if (!formCarrier || !formGrade || saving) {
      alert("통신사와 등급을 모두 선택해주세요.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        carrier: formCarrier as Carrier,
        level: formGrade as Grade,
      };

      const res = await fetch("/api/membership/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: UpdateResponse | null = null;
      try {
        data = JSON.parse(text) as UpdateResponse;
      } catch {
        data = null;
      }

      if (!res.ok || !data?.success) {
        const msg = data?.message || text || "저장 실패";
        alert(msg);
        return;
      }
      localStorage.setItem("level", payload.level);

      router.replace("/mypage");
    } catch {
      alert("네트워크 오류로 저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <p className="text-m font-bold">현재 통신사 정보</p>
      <div className="rounded-2xl bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {viewCarrier ? String(viewCarrier)[0] : "?"}
            </span>
          </div>
          <div className="flex flex-col">
            <p className="text-[15px] font-medium">
              {viewCarrier ? CARRIER_LABEL[viewCarrier as Carrier] : "미설정"}
            </p>
            <div className="mt-1">
              {viewGrade && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-800 text-[11px] text-white font-semibold">
                  {viewGrade}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-neutral-400">사용중</p>
      </div>

      <div className="space-y-2">
        <p className="text-m font-bold text-neutral-600">통신사</p>
        <div className="relative">
          <select
            className="w-full h-11 rounded-xl border border-neutral-200 px-3 shadow-sm bg-white appearance-none"
            value={formCarrier}
            onChange={(e) => setFormCarrier(e.target.value as Carrier)}
          >
            <option value="" disabled>
              통신사 선택
            </option>
            <option value="SKT">SK Telecom</option>
            <option value="KT">KT</option>
            <option value="LGU+">LG U+</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M5 7l5 6 5-6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-m font-bold text-neutral-600">등급 설정</p>
        <div className="relative">
          <select
            className="w-full h-11 rounded-xl border border-neutral-200 px-3 shadow-sm bg-white appearance-none disabled:opacity-50"
            value={formGrade}
            onChange={(e) => setFormGrade(e.target.value as Grade)}
            disabled={!formCarrier || allowedGrades.length === 0}
          >
            <option value="" disabled>
              등급 선택
            </option>
            {allowedGrades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M5 7l5 6 5-6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
        {!formCarrier && (
          <p className="text-xs text-rose-500">먼저 통신사를 선택하세요.</p>
        )}
      </div>

      <div className="pt-2">
        <button
          onClick={save}
          disabled={!formCarrier || !formGrade || saving}
          className="w-full h-12 rounded-xl bg-[#FB4E6F] text-white font-semibold disabled:opacity-40 shadow-sm"
        >
          {saving ? "..." : "수정"}
        </button>
      </div>
    </div>
  );
}
