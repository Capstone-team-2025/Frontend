"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import axios from "axios";
import Button from "@/components/button/SignUpButton";

export default function CompleteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nickname = searchParams.get("nickname") || "";
  const carrier = searchParams.get("carrier") || "";
  const level = searchParams.get("level") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const handleComplete = async () => {
    if (!carrier || !level) {
      setError("통신사 또는 등급 정보가 없습니다");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await axios.post("/api/auth/signup/complete", { carrier, level });
      if (res.data.success) {
        router.replace("/map");
      } else {
        setError(res.data.message || "회원가입 완료 처리 중 오류가 발생했습니다");
      }
    } catch (err) {
      console.error(err);
      setError("서버 통신 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">
        {nickname ? `${nickname}님, 가입을 축하합니다!` : "가입을 축하합니다!"}
      </h1>

      {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 1 }}
        className="mt-16 grid gap-3"
        transition={{ duration: 0.6, type: "spring", stiffness: 150, delay: 0.3 }}
      >
        <span role="img" aria-label="축하" className="text-7xl">
          🎉
        </span>
      </motion.div>

      <div className="h-24" />
      <Button size="lg" fullWidth onClick={handleComplete} disabled={isSubmitting}>
        {isSubmitting ? "처리 중..." : "시작하기"}
      </Button>
    </>
  );
}
