// src/app/(auth)/signup/CarrierSelectClient.tsx (클라이언트)
"use client";
import { useRouter } from "next/navigation";
import GradeSelect from "@/components/selectmenu/GradeSelect";

const CARRIERS = ["SKT", "KT", "LG U+"] as const;

export default function CarrierSelectClient() {
  const router = useRouter();
  return (
    <GradeSelect
      title="통신사 선택"
      subtitle={`가입중인 통신사를 선택해보세요!
사용 중인 통신사에 따라 다양한 혜택 정보를 제공합니다.
가입 후에도 언제든 변경할 수 있습니다.`}
      options={[...CARRIERS]}
      onSubmit={(carrier) =>
        router.push(`/signup/grade?carrier=${encodeURIComponent(carrier)}`)
      }
    />
  );
}
