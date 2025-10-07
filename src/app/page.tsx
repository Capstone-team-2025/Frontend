//서버 컴포넌트
import Image from "next/image";

export default function Login() {
  return (
    <main className="min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <Image
              src="/icon.png"
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
          <a
            href="/api/auth/kakao" 
            className="block w-full rounded-xl border border-none bg-[#FEE500] py-3 font-semibold shadow-sm transition hover:brightness-95 active:brightness-90"
            aria-label="카카오로 로그인"
          >
            <span className="inline-flex w-full items-center justify-center gap-2 text-black">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path
                  d="M12 3C6.477 3 2 6.58 2 10.99c0 2.69 1.742 5.05 4.41 6.46l-.67 3.53a.6.6 0 0 0 .89.64l3.83-2.2c.84.14 1.7.21 2.54.21 5.523 0 10-3.58 10-7.99S17.523 3 12 3Z"
                  fill="black"
                />
              </svg>
              카카오 로그인
            </span>
          </a>
        </div>
      </div>
    </main>
  );
}
