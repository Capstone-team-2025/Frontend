"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Button from "@/components/button/SignUpButton";

export default function CompleteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nickname = searchParams.get("nickname") || "";
  const carrier = searchParams.get("carrier") || "";
  const level = searchParams.get("level") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // 페이지 로드 시 자동으로 백엔드에 데이터 전송
    const submitSignup = async () => {
      if (!carrier || !level) {
        setError("통신사 또는 등급 정보가 없습니다");
        return;
      }

      if (isSubmitting) return;

      setIsSubmitting(true);
      try {
        const response = await fetch("/api/auth/signup/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            carrier,
            level,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.message || "회원가입 완료 처리 중 오류가 발생했습니다");
          console.error("[Signup Complete Client] Error:", data);
        } else {
          console.log("[Signup Complete Client] Success:", data);
        }
      } catch (err) {
        console.error("[Signup Complete Client] Fetch error:", err);
        setError("회원가입 완료 처리 중 오류가 발생했습니다");
      } finally {
        setIsSubmitting(false);
      }
    };

    submitSignup();
  }, [carrier, level, isSubmitting]);

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight ">
        {nickname ? `${nickname}님, 가입을 축하합니다` : "가입을 축하합니다"}
      </h1>
      {error && (
        <div className="mt-4 text-red-500 text-sm">
          {error}
        </div>
      )}
      <motion.div
        initial={{ scale: 0, opacity: 0 }} // 작게 시작
        animate={{ scale: 1.2, opacity: 1 }} // 커지며 보이기
        className="mt-16 grid gap-3"
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 150,
          delay: 0.3,
        }} // 살짝 딜레이
      >
        <span role="img" aria-label="축하" className="text-7xl">
          🎉
        </span>
      </motion.div>
      <div className="h-24" />
      <Button
        size="lg"
        fullWidth
        onClick={() => router.push("/map")}
        disabled={isSubmitting}
      >
        {isSubmitting ? "처리 중..." : "시작하기"}
      </Button>
    </>
  );
}
