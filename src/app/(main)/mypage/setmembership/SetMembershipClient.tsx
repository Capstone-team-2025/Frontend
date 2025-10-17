"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Carrier = "SKT" | "KT" | "LGU+";
type ApiResponse = {
  success?: boolean;
  message?: string;
  membership?: {
    membershipId: number;
    userId: number;
    carrier: string;
    level: string;
    cardNumber: string;
    alertEnabled: boolean;
  };
};

export default function SetMembershipClient({
  initialCarrier,
  initialGrade,
}: {
  initialCarrier?: Carrier;
  initialGrade?: string;
}) {
  const router = useRouter(); 

  const [carrier, setCarrier] = useState<Carrier | "">("");
  const [grade, setGrade] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCarrier(
      initialCarrier ?? ((localStorage.getItem("carrier") as Carrier) || "")
    );
    setGrade(initialGrade ?? localStorage.getItem("level") ?? "");
  }, [initialCarrier, initialGrade]);

  const save = async () => {
    if (!carrier || !grade || saving) return;
    setSaving(true);
    try {
      const levelForServer = grade.trim().toUpperCase();

      const res = await fetch("/api/membership/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier, level: levelForServer }),
      });

      const data: ApiResponse = await res.json().catch(() => ({} as ApiResponse));

      if (!res.ok || !data?.success) {
        alert(data?.message ?? "저장 실패");
        return;
      }

      localStorage.setItem("carrier", carrier);
      localStorage.setItem("level", grade);

      router.replace("/mypage"); 
    } catch {
      alert("네트워크 오류로 저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-neutral-600">현재 설정을 변경하세요.</p>

      <div className="grid grid-cols-3 gap-2">
        {(["SKT", "KT", "LG U+"] as Carrier[]).map((c) => (
          <button
            key={c}
            onClick={() => setCarrier(c)}
            className={`h-11 rounded-xl border ${
              carrier === c ? "border-black font-semibold" : "border-neutral-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <select
        className="w-full h-11 border rounded-xl px-3"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
      >
        <option value="" disabled>등급 선택</option>
        <option>VVIP</option>
        <option>VIP</option>
        <option>Gold</option>
        <option>Silver</option>
        <option>Basic</option>
      </select>

      <div className="h-6" />
      <button
        onClick={save}
        disabled={!carrier || !grade || saving}
        className="w-full h-12 rounded-xl bg-black text-white disabled:opacity-30"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
