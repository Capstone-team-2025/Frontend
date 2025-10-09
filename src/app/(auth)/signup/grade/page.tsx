// src/app/(auth)/signup/grade/page.tsx
import { Suspense } from "react";
import GradeClient from "./GradeClient";

export const dynamic = "force-dynamic"; // (권장) 프리렌더 끔 → CSR 파라미터 이슈 방지

export default  async  function GradePage({
  searchParams,
}: {
  searchParams: Promise<{ carrier?: string | string[] }>;
}) {
  const sp = await searchParams;
  const carrier =
    (Array.isArray(sp.carrier) ? sp.carrier[0] : sp.carrier) ?? "";

  return (
    <Suspense fallback={null}>
      <GradeClient carrier={carrier} />
    </Suspense>
  );
}
