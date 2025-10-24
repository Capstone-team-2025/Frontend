"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Barcode from "../barcode";
import Button from "@/components/button/SignUpButton";
import { extractUserFromMe, extractGrade, MeUser } from "@/lib/me";

const CARD_KEY = "membership_card_number";

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");
const fmt4 = (s: string) =>
  onlyDigits(s)
    .replace(/(.{4})/g, "$1 ")
    .trim();

function validateCard(raw: string) {
  const num = onlyDigits(raw);
  return {
    ok: /^\d{16}$/.test(num),
    normalized: num,
    message: "카드번호는 숫자 16자리여야 합니다.",
  };
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

async function getGradeFromMe(): Promise<string> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const raw = await res.text();
    if (!res.ok || !raw) return "";
    const data: unknown = JSON.parse(raw);
    const u: MeUser | undefined = extractUserFromMe(data);
    return extractGrade(u);
  } catch {
    return "";
  }
}

export default function AddClient() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedNum = localStorage.getItem(CARD_KEY) || "";
    setInput(fmt4(storedNum));
  }, []);

  const digits = useMemo(() => onlyDigits(input), [input]);

  useEffect(() => {
    if (!digits) {
      setError("카드번호를 입력해주세요.");
      return;
    }
    const { ok, message } = validateCard(digits);
    setError(ok ? null : message);
  }, [digits]);

  const patchCard = async (cardNumber: string | null, grade: string | null) => {
    const res = await fetch("/api/membership/card-number", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardNumber, grade }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    try {
      return (await res.json()) as unknown;
    } catch {
      return {};
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { ok, normalized, message } = validateCard(digits);
    if (!ok) {
      setError(message);
      return;
    }
    setSubmitting(true);
    try {
      const localGrade =
        localStorage.getItem("user_grade") ||
        localStorage.getItem("membership_grade") ||
        "";

      const grade = localGrade || (await getGradeFromMe());

      await patchCard(normalized, grade || null);

      if (grade) {
        localStorage.setItem("user_grade", grade);
        localStorage.setItem("membership_grade", grade);
        localStorage.setItem("level", grade);
      }

      localStorage.setItem(CARD_KEY, normalized);
      alert("완료되었습니다.");
      router.replace("/membership");
      router.refresh();
    } catch (err: unknown) {
      alert(`등록 실패: ${getErrorMessage(err)}`);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <form onSubmit={onSubmit} className="px-5 pb-10">
      <label className="block text-sm text-gray-700 mt-6 mb-2">
        카드 번호 <span className="text-rose-500 text-xs">필수</span>
      </label>
      <input
        inputMode="numeric"
        pattern="[0-9 ]*"
        placeholder="숫자 16자리"
        value={input}
        onChange={(e) => setInput(fmt4(e.target.value))}
        aria-invalid={!!error}
        className="w-full h-12 rounded-xl border border-gray-300 px-4 outline-none"
      />
      {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}

      <div className="mt-6 rounded-xl border border-gray-200 p-4 flex items-center justify-center">
        {digits ? (
          <Barcode value={digits} height={80} />
        ) : (
          <span className="text-gray-400 text-sm">바코드 미리보기</span>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        className="mt-6"
        disabled={!!error || submitting}
        loading={submitting}
      >
        완료
      </Button>
    </form>
  );
}
