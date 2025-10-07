// src/app/(auth)/signup/grade/GradeClient.tsx (클라)
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import GradeSelect from "@/components/selectmenu/GradeSelect";

const OPTIONS: Record<string, string[]> = {
  SKT: ["VIP", "GOLD", "SILVER"],
  KT: ["VVIP", "VIP", "골드", "실버", "화이트", "일반"],
  "LG U+": ["VVIP", "VIP", "다이아몬드"],
};

export default function GradeClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const carrier = sp.get("carrier") ?? "";
  return (
    <GradeSelect
      title={`${carrier} 멤버십 등급을 골라주세요.`}
      subtitle="정확한 혜택 안내를 위해 멤버십 등급을 선택해주세요."
      options={OPTIONS[carrier] ?? []}
      onSubmit={(grade) =>
        router.push(`/signup/done?carrier=${encodeURIComponent(carrier)}&grade=${encodeURIComponent(grade)}`)
      }
    />
  );
}
