"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/button/SignUpButton";

export default function CompleteClient() {
  const router = useRouter();
  const nickname = useSearchParams().get("nickname") || "";

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight ">
        {nickname ? `${nickname}님, 가입을 축하합니다` : "가입을 축하합니다"}
      </h1>
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
      <Button size="lg" fullWidth onClick={() => router.push("/map")}>
        시작하기
      </Button>
    </>
  );
}
