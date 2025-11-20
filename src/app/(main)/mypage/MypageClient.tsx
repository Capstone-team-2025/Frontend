"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import ConfirmModal from "@/components/modal/ConfirmModal";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

type Carrier = "SKT" | "KT" | "LGU+";
type User = {
  nickname: string;
  grade: string;
  profile: string;
  carrier: Carrier;
};
type Item = { label: string; href?: string; action?: () => void };

export default function MypageClient({ user }: { user: User }) {
  const router = useRouter();
  const { logout, deleteAccount } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);

  const handleLogout = async () => {
    setLogoutOpen(false);
    await logout();
  };
  const handleQuit = async () => {
    setQuitOpen(false);
    try {
      await deleteAccount();
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("회원탈퇴에 실패했습니다. 재로그인 후 시도해주세요.");
    }
  };
  const items: Item[] = [
    { label: "통신사/등급 재설정", href: "/mypage/setmembership" },
    { label: "내가 즐겨찾기한 매장", href: "/mypage/favorites" },
    { label: "문의하기", href: "/mypage/contact" },
    {
      label: "로그아웃",
      action: () => setLogoutOpen(true),
    },
  ];

  const onClickItem = (item: Item) => {
    if (item.href) router.push(item.href);
    else item.action?.();
  };

  const gradeColors: Record<string, Record<string, string>> = {
    SKT: {
      VIP: "bg-[#EE3356] text-white",
      GOLD: "bg-[#FFBB04] text-white",
      SILVER: "bg-[#71CBD3] text-white",
    },
    KT: {
      VVIP: "bg-[#D71826] text-white",
      VIP: "bg-[#252525] text-white",
      GOLD: "bg-[#8F6133] text-white",
      SILVER: "bg-[#7C7C7C] text-white",
      WHITE: "bg-[#ffffff]  text-gray-800",
      일반: "bg-[#ffffff]  text-gray-800",
    },
    LGU: {
      VVIP: "bg-[#E5007E] text-white",
      VIP: "bg-[#EE5CAC] text-white",
      다이아몬드: "bg-[#7D49B1] text-white",
    },
  };
  const carrierKey =
    (user.carrier?.toUpperCase().replace("+", "") as "SKT" | "KT" | "LGU") ||
    "KT";

  const badgeClass =
    gradeColors[carrierKey]?.[user.grade] || "bg-gray-400 text-white";
  return (
    <main className="p-5">
      <Link
        href="/mypage/editprofile"
        className="flex items-center justify-between mb-10 cursor-pointer">
        <section className="flex items-center gap-3">
          <div className="relative size-[56px] flex items-center justify-center rounded-full bg-[#FE8E8E] overflow-hidden">
            <Image
              src={user.profile || "/images/default-avatar.png"} // fallback
              alt="프로필 이미지"
              fill
              className="object-cover"
              sizes="56px"
              priority
            />
          </div>

          <div className="flex flex-col">
            <div className="font-bold">{user.nickname}</div>
            <span
              className={`mt-1 w-fit inline-block rounded-full px-3 py-1 text-[13px] font-bold ${badgeClass}`}>
              {user.grade}
            </span>
          </div>
        </section>

        <Image
          src="/images/ForwardBTN-gray.png"
          alt="프로필 변경 이동"
          width={20}
          height={20}
          className="shrink-0"
        />
      </Link>
      <nav className="flex flex-col">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => onClickItem(item)}
            className="flex w-full items-center justify-between py-4 text-left"
            aria-label={item.label}>
            <span className="text-[15px] font-semibold">{item.label}</span>
            <Image
              src="/images/ForwardBTN-gray.png"
              alt="다음버튼"
              width={20}
              height={20}
              className="shrink-0"
            />
          </button>
        ))}
      </nav>

      <button
        className="mt-15  border-b text-xs text-neutral-400"
        onClick={() => setQuitOpen(true)}>
        회원탈퇴
      </button>
      <ConfirmModal
        open={logoutOpen}
        title="로그아웃 하시겠습니까?"
        confirmText="확인"
        confirmColor="pink"
        onConfirm={handleLogout}
        onClose={() => setLogoutOpen(false)}
      />
      <ConfirmModal
        open={quitOpen}
        title="정말 탈퇴하시겠어요?"
        confirmText="탈퇴"
        confirmColor="black"
        onConfirm={handleQuit}
        onClose={() => setQuitOpen(false)}
      />
    </main>
  );
}
