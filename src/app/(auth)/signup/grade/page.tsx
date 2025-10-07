// src/app/(auth)/signup/grade/page.tsx (서버)
import GradeClient from "./GradeClient";

export default function GradePage() {
  return (
    <main className="min-h-dvh bg-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full text-center">
            <GradeClient />
          </div>
        </div>
      </div>
    </main>
  );
}