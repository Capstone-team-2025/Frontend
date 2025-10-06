"use client";
import Image from "next/image";

export default function SignUp() {
  const kakaoLogin = () => {
    window.location.href = "/api/auth/kakao";
  };

  return (
    <main className="min-h-dvh flex flex-col">
        {/* 아이콘 & 로고 영역 */}
        <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Image src="/icon.png" alt="MAPNEFIT 아이콘" width={150} height={178} priority className="object-contain" />
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-black">MAPNE</span>
            <span className="text-[#ff2f87]">FIT</span>
          </h1>
        </div>
      </div>

        {/* 하단 버튼 */}
        <div className="px-5 pb-6">
          <button
            onClick={kakaoLogin}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold shadow-sm border"
            style={{ backgroundColor: "#FEE500", borderColor: "#e3d200" }}
          >
            {/* 카카오 말풍선 아이콘 */}
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
              <path
                d="M12 3C6.477 3 2 6.58 2 10.99c0 2.69 1.742 5.05 4.41 6.46l-.67 3.53a.6.6 0 0 0 .89.64l3.83-2.2c.84.14 1.7.21 2.54.21 5.523 0 10-3.58 10-7.99S17.523 3 12 3Z"
                fill="black"
              />
            </svg>
            <span className="text-black">카카오 로그인</span>
          </button>
        </div>
    </main>
  );
}