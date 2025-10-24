"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Barcode from "./barcode";

const CARD_KEY = "membership_card_number";

function loadLocal() {
  if (typeof window === "undefined") return { num: "" };
  return { num: localStorage.getItem(CARD_KEY) || "" };
}

function formatGroups4(s: string) {
  return (s || "")
    .replace(/\D/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export default function MembershipClient() {
  const [num, setNum] = useState("");

  useEffect(() => {
    const { num } = loadLocal();
    setNum(num);
  }, []);

  if (!num) {
    return (
      <div className="p-5">
        <p>
          등록된 카드가 없어요! <br /> 카드를 등록하고 더욱 편리하게 이용하세요!
        </p>
        <Link
          href="/membership/add"
          className="mt-6 block rounded-xl bg-[#EEEEF0] p-5"
        >
          <div className="flex items-center justify-between">
            <span>바코드 등록하기</span>
            <span className="w-8 h-8 rounded-full flex items-center justify-center border text-gray-400">
              ＋
            </span>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <section className="mt-4">
      <div className="px-5 mt-2">
        <div className="text-sm mb-2">내 카드</div>
        <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-center">
          <Barcode value={num} height={70} />
        </div>
        <div className="text-center text-lg tracking-widest mt-3">
          {formatGroups4(num)}
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href="/membership/add"
            className="flex-1 h-11 rounded-xl border border-gray-300 flex items-center justify-center"
          >
            수정하기
          </Link>
          <button
            className="flex-1 h-11 rounded-xl bg-gray-100"
            onClick={() => {
              localStorage.removeItem(CARD_KEY);
              location.reload();
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </section>
  );
}
