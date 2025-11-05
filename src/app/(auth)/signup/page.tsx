import type { Metadata } from "next";
import CarrierSelectClient from "./SelectClient";

export const metadata: Metadata = {
  title: "회원가입페이지",
};

export default function SignupPage() {
  return (
    <main className="min-h-dvh bg-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full text-center">
            <CarrierSelectClient />
          </div>
        </div>
      </div>
    </main>
  );
}
