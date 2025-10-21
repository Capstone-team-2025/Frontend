"use client";

import Image from "next/image";
import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";

type Props = {
  defaultValue?: string;
  placeholder?: string;
  onSearch: (q: string) => void;
  onChangeDebounced?: (q: string) => void;
  debounceMs?: number;
  className?: string;
  iconSrc?: string;
  iconSize?: number;
  leading?: React.ReactNode;
  inputClassName?: string;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
};

export default forwardRef<HTMLInputElement, Props>(function SearchInput(
  {
    defaultValue = "",
    placeholder = "여기서 검색",
    onSearch,
    onChangeDebounced,
    debounceMs = 300,
    className = "",
    iconSrc = "/images/Search.png",
    iconSize = 22,
    leading,
    inputClassName = "",
    onFocus
  }: Props,
  ref
) {
  const [q, setQ] = useState(defaultValue);
  const inputEl = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => inputEl.current as HTMLInputElement);

  useEffect(() => {
    if (!onChangeDebounced) return;
    const t = setTimeout(() => onChangeDebounced(q), debounceMs);
    return () => clearTimeout(t);
  }, [q, onChangeDebounced, debounceMs]);

  const submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSearch(q.trim());
  };

  const leftPadClass = leading ? "pl-12" : "pl-4";

  return (
    <form onSubmit={submit} role="search" className={["relative w-full", className].join(" ")}>
      {leading && (
        <div
          className="
            absolute left-2 top-1/2 -translate-y-1/2
            w-7 h-7 flex items-center justify-center
            z-10
          "
        >
          {leading}
        </div>
      )}

      <input
        ref={inputEl}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        aria-label="검색어 입력"
        className={[
          "w-full h-12 pr-12",
          leftPadClass,
          "rounded-2xl bg-white/90 backdrop-blur",
          "shadow-[0_6px_18px_rgba(0,0,0,0.12)]",
          "border border-white/70",
          "text-[15px] placeholder:text-neutral-400",
          "focus:outline-none focus:ring-2 focus:ring-rose-300",
          inputClassName,
        ].join(" ")}
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
});
