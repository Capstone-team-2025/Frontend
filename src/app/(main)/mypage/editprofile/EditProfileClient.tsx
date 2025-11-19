"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import Button from "@/components/button/SignUpButton";
import cenkor from "cenkor";

export default function EditProfileClient({
  initialNickname,
  initialProfileUrl,
}: {
  initialNickname: string;
  initialProfileUrl: string | null;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || submitting) return;
    setSubmitting(true);
    if (cenkor(nickname.trim())) {
      alert("부적절한 단어가 포함되어 있어 닉네임을 변경할 수 없습니다.");
      return;
    }

    try {
      await axios.put(
        "/api/user/update",
        { nickname: nickname.trim() },
        { headers: { "Content-Type": "application/json" } }
      );
      router.replace("/mypage");
    } catch (err) {
      console.error(err);
      alert("수정 실패 또는 네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };
  const isDisabled =
    submitting ||
    !nickname.trim() ||
    nickname.trim() === (initialNickname ?? "").trim();
  return (
    <section className="mx-auto w-full max-w-[425px] pb-24 bg-white">
      <div className="relative h-50  bg-[#FB4E6F]">
        <div className="absolute left-1/2 bottom-0 translate-x-[-50%] translate-y-1/2">
          <div className="h-[120px] w-[120px] rounded-full bg-white p-1 shadow-md">
            <div className="relative h-full w-full overflow-hidden rounded-full bg-[#FF6F86]">
              <Image
                src={initialProfileUrl || "/images/default-avatar.png"}
                alt="프로필 이미지"
                fill
                className="object-cover"
                sizes="120px"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-5 my-16 rounded-2xl bg-white p-5">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="nickname"
              className="text-sm font-semibold text-neutral-800 "
            >
              사용자명
            </label>
            <input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={initialNickname || "닉네임"}
              className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-[15px] outline-none placeholder:text-neutral-300 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            variant="primary"
            fullWidth
            loading={submitting}
            disabled={isDisabled}
          >
            수정
          </Button>
        </form>
      </div>
    </section>
  );
}
