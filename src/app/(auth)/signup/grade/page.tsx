// src/app/(auth)/signup/grade/page.tsx
import { Suspense } from "react";
import GradeClient from "./GradeClient";

export const dynamic = "force-dynamic"; // (권장) 프리렌더 끔 → CSR 파라미터 이슈 방지

export default function GradePage({
  searchParams,
}: {
  searchParams: { carrier?: string };
}) {
  const carrier = searchParams.carrier ?? "";

  return (
    <main className="min-h-dvh bg-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full text-center">
            <Suspense fallback={null}>
              <GradeClient carrier={carrier} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
