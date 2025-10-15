"use client";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const menus = [
    { name: "할인지도", path: "/map", icon: "Location" },
    { name: "AI추천", path: "/chatbot", icon: "Chatbot" },
    { name: "할인지갑", path: "/membership", icon: "Wallet" },
    { name: "프로필", path: "/mypage", icon: "User" },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom,0px)] ">
      <nav
        className="mx-auto w-full max-w-[425px] bg-white shadow-[0_-1px_6px_rgba(0,0,0,0.08)]"
        role="navigation"
        aria-label="앱 하단 탭"
      >
        <div className="flex justify-between py-2 px-6">
          {menus.map((menu) => {
            const isActive = pathname.startsWith(menu.path);
            const base = `/images/${menu.icon}`;
            const iconSrc = isActive ? `${base}_A.png` : `${base}.png`;
            return (
              <button
                key={menu.name}
                onClick={() => router.push(menu.path)}
                className="flex flex-col items-center text-xs"
              >
                <Image
                  src={iconSrc}
                  alt={menu.name}
                  className="mb-1"
                  width={32}
                  height={32}
                />
                <span className="text-black">{menu.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
