// src/app/(auth)/signup/grade/GradeClient.tsx
"use client";
import { useRouter } from "next/navigation";
import GradeSelect from "@/components/selectmenu/GradeSelect";

const OPTIONS: Record<string, string[]> = {
  SKT: ["VIP", "GOLD", "SILVER"],
  KT: ["VVIP", "VIP", "골드", "실버", "화이트", "일반"],
  "LG U+": ["VVIP", "VIP", "다이아몬드"],
};

export default function GradeClient({ carrier }: { carrier: string }) {
  const router = useRouter();

  const options = OPTIONS[carrier] ?? [];

  return (
    <GradeSelect
      title={`${carrier || "통신사"} 멤버십 등급을 골라주세요.`}
      subtitle="정확한 혜택 안내를 위해 멤버십 등급을 선택해주세요."
      options={options}
      onSubmit={(grade) =>
        router.push(
          `/signup/complete?carrier=${encodeURIComponent(
            carrier
          )}&level=${encodeURIComponent(grade)}`
        )
      }
    />
  );
}
