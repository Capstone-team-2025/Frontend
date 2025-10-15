"use client";
import { usePathname } from "next/navigation";

export default function Header({ title }: { title: string }) {
  const pathname = usePathname();

  let bgColor = "bg-white"; 
  if (pathname.startsWith("/mypage/editprofile")|| pathname.startsWith("/mypage/favorites")) {
    bgColor = "bg-[#FB4E6F]"; 
  } 
  return (
    <header className={`sticky px-3 py-5 ${bgColor}`}>
      <h1 className="flex justify-center font-bold text-xl ">{title}</h1>
    </header>
  );
}
