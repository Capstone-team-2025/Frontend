"use client";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

export default function Header({ title }: { title: string }) {
  const pathname = usePathname();
  const router = useRouter();

  let bgColor = "bg-white";
  if (
    pathname.startsWith("/mypage/editprofile") ||
    pathname.startsWith("/mypage/favorites")
  ) {
    bgColor = "bg-[#FB4E6F]";
  }
  const showBackButton =
    pathname.startsWith("/mypage/") && pathname !== "/mypage";
  const isPink = bgColor === "bg-[#FB4E6F]";
  const backIcon = isPink ? "/images/WBack.svg" : "/images/BBack.svg";
  const textColor = isPink ? "text-white" : "text-gray-700";
  return (
    <header
      className={`sticky top-0 z-50 flex items-center justify-center px-3 py-5 ${bgColor}`}
    >
      {showBackButton && (
        <button
          onClick={() => router.back()}
          className="absolute left-4 flex items-center justify-center"
          aria-label="뒤로가기"
        >
          <Image
            src={backIcon}
            alt="뒤로가기 버튼"
            width={20}
            height={20}
            className="object-contain"
          />
        </button>
      )}
      <h1 className={`font-bold text-xl text-center ${textColor}`}>{title}</h1>
    </header>
  );
}
