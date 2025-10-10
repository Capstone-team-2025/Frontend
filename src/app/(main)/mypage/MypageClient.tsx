"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmModal from "@/components/modal/ConfirmModal";

type User = { nickname: string; grade: string; profile: string };
type Item = { label: string; href?: string; action?: () => void };

export default function MyPageClient({ user }: { user: User }) {
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);

  const handleLogout = async () => {
    setLogoutOpen(false);
    router.replace("/");
  };
  const handleQuit = async () => {
    setQuitOpen(false);
    router.replace("/"); //탈퇴 우선 로그아웃이랑 같게 처리
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
  return (
    <main>
      <section className="flex items-center gap-3 mb-40">
        <div className="h-13 w-13 flex items-center justify-center rounded-full bg-[#FE8E8E] ">
          {user.profile}
        </div>
        <div className="flex flex-col">
          <div className="font-bold">{user.nickname}</div>
          <span className="mt-1 inline-block rounded-full px-3 py-1 text-[13px] font-bold bg-[#D71826] text-white">
            {user.grade}
          </span>
        </div>
      </section>

      <nav className="flex flex-col">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => onClickItem(item)}
            className="flex w-full items-center justify-between py-4 text-left"
            aria-label={item.label}
          >
            <span className="text-[15px] font-semibold">{item.label}</span>
            <span className="text-400">? </span>
          </button>
        ))}
      </nav>

      <button
        className="mt-15  border-b text-xs text-neutral-400"
        onClick={() => setQuitOpen(true)}
      >
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
