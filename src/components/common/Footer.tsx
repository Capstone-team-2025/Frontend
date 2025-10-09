"use client";

import { useRouter, usePathname } from "next/navigation";

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  const menus = [
    { name: "할인지도", path: "/map" },
    { name: "AI추천", path: "/chatbot" },
    { name: "할인지갑", path: "/membership" },
    { name: "프로필", path: "/mypage" },
  ];
  return (
    <footer className="sticky bottom-0 w-full bg-white border-none rounded-t-[30px] ">
      <div className="flex justify-around py-3">
        {menus.map((menu) => {
          const isActive = pathname.startsWith(menu.path);
          return (
            <button
              key={menu.name}
              onClick={() => router.push(menu.path)}
              className="flex flex-col items-center text-xs"
            >
              <div
                className={`w-9 h-9 mb-1 transition-colors duration-200 ${
                  isActive ? "bg-[#FB4E6F]" : "bg-[#C9C9C9]"
                }`}
              />
              <span className="text-black">{menu.name}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
