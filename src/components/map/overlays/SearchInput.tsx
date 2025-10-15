"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

type Props = {
  defaultValue?: string;
  placeholder?: string;
  onSearch: (q: string) => void;
  onChangeDebounced?: (q: string) => void;
  debounceMs?: number;
  className?: string;
  iconSrc?: string;     // 기본: /images/Search.png
  iconSize?: number;    // 기본: 22
};

export default function SearchInput({
  defaultValue = "",
  placeholder = "여기서 검색",
  onSearch,
  onChangeDebounced,
  debounceMs = 300,
  className = "",
  iconSrc = "/images/Search.png",
  iconSize = 22,
}: Props) {
  const [q, setQ] = useState(defaultValue);

  useEffect(() => {
    if (!onChangeDebounced) return;
    const t = setTimeout(() => onChangeDebounced(q), debounceMs);
    return () => clearTimeout(t);
  }, [q, onChangeDebounced, debounceMs]);

  const submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSearch(q.trim());
  };

  return (
    <form onSubmit={submit} role="search" className={["relative w-full", className].join(" ")}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="검색어 입력"
        className="
          w-full h-12 pr-12 pl-4
          rounded-2xl bg-white/90 backdrop-blur
          shadow-[0_6px_18px_rgba(0,0,0,0.12)]
          border border-white/70
          text-[15px] placeholder:text-neutral-400
          focus:outline-none focus:ring-2 focus:ring-rose-300
        "
      />

      <button
        type="submit"
        aria-label="검색"
        className="
          absolute right-2 top-1/2 -translate-y-1/2
          w-8 h-8 p-0 m-0
          bg-transparent border-0 outline-none
          flex items-center justify-center
          cursor-pointer
        "
      >
        <Image src={iconSrc} alt="" width={iconSize} height={iconSize} sizes={`${iconSize}px`} />
      </button>
    </form>
  );
}
