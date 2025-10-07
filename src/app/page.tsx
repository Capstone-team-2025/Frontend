//서버 컴포넌트
import Image from "next/image";

export default function Login() {
  return (
    <main className="min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <Image
              src="/images/icon.png"
              alt="MAPNEFIT 아이콘"
              width={150}
              height={178}
              priority
            />
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-black">MAPNE</span>
              <span className="text-[#ff2f87]">FIT</span>
            </h1>
          </div>
        </div>

        <div className="px-5 pb-6">
          <a href="/api/auth/kakao" aria-label="카카오로 로그인">
            <Image
              src="/kakao_login_large_wide.png"
              alt="카카오 로그인"
              width={600} height={90}
              priority
              className="hidden sm:block mx-auto"
            />
            <Image
              src="/kakao_login_large_wide.png"
              alt="카카오 로그인"
              width={366}
              height={90}
              priority
              className="block sm:hidden mx-auto"
            />
          </a>
        </div>

      </div>
    </main>
  );
}
