"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/button/SignUpButton";

const MAX = 1000;

export default function ContactClient() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    //field-sizing
    const el = taRef.current;
    if (!el) return;
    const supportsFieldSizing =
      CSS && CSS.supports && CSS.supports("field-sizing", "content");
    if (!supportsFieldSizing) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [text]);

  const submit = async () => {
    const context = text.trim();
    if (!context) return alert("내용을 입력해주세요.");
    if (context.length > MAX) return;

    try {
      setLoading(true);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
        cache: "no-store",
      });

      const raw = await res.text();
      let data: { success?: boolean; message?: string } | null = null;
      try {
        data = JSON.parse(raw);
      } catch {}

      if (!res.ok || !data?.success) {
        alert((data?.message ?? raw) || "전송 실패");
        return;
      }

      router.replace("/mypage");
    } catch {
      alert("전송 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-2 px-4">
      <p className="text-m font-bold mb-10">불편하셨던 사항들을 알려주세요.</p>
      <div className="border rounded-xl p-3 min-h-60">
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          placeholder={`고객님의 소중한 피드백을 통해
더 나은 서비스를 제공하겠습니다.`}
          className="w-full outline-none resize-none text-sm field-sizing-content leading-relaxed"
          rows={4}
        />
      </div>

      <div className="mt-10">
        <Button
          onClick={submit}
          disabled={!text.trim() || loading}
          loading={loading}
          fullWidth
          variant="primary"
          size="lg"
        >
          {loading ? "전송 중..." : "입력 완료"}
        </Button>
      </div>
    </div>
  );
}
