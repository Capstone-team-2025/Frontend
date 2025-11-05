"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SearchInput from "@/app/(main)/map/overlays/SearchInput";
import GrayBackBtn from "@/components/button/GrayBackBtn";
import { suggestStoreNames, suggestByConsonant, isHangulConsonantOneChar } from "@/services/search";

export default function SearchScreen({ prefill = "" }: { prefill?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(!!prefill);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefill.trim()) {
      setOpen(true);
      runSuggest(prefill);
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [prefill]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const raf = requestAnimationFrame(() => {
      el.focus({ preventScroll: true });
      const len = el.value.length;
      try { el.setSelectionRange(len, len); } catch { /* noop */ }
    });

    const t = setTimeout(() => {
      if (document.activeElement !== el) {
        el.focus({ preventScroll: true });
      }
    }, 60);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  const runSuggest = async (text: string) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const term = text.trim();
    if (!term) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    try {
      const list = isHangulConsonantOneChar(term)
        ? await suggestByConsonant(term, 8)
        : await suggestStoreNames(term, 8);

      if (!ac.signal.aborted) {
        setSuggestions(list);
        setOpen(list.length > 0);
      }
    } catch {
    }
  };

  const goResults = (text: string) => {
    const term = text.trim();
    if (!term) return;
    router.replace(`/map/search/results?q=${encodeURIComponent(term)}`, {
      scroll: false,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white text-neutral-900 flex flex-col">
      <div className="mx-auto w-full max-w-[425px] px-3 pt-[calc(env(safe-area-inset-top)+8px)] flex items-center gap-2">
        <div className="flex-1">
          <SearchInput
            defaultValue={prefill}
            placeholder="여기서 검색"
            onSearch={goResults}
            onChangeDebounced={(text) => {
              runSuggest(text);
            }}
            debounceMs={180}
            iconSrc="/images/Search.png"
            ref={inputRef}
            leading={
              <GrayBackBtn
                onClick={() => router.push("/map")}
                className="rounded-full"
                size={30}
                iconSize={30}
              />
            }
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {open && suggestions.length > 0 && (
          <div className="mx-auto w-full max-w-[425px] px-3 py-2">
            <ul role="listbox" className="px-3 py-2">
              {suggestions.map((s, i) => (
                <li
                  key={s + i}
                  role="option"
                  aria-selected={i === highlight}
                  className={[
                    "px-2 py-3 cursor-pointer text-[16px] rounded-lg",
                    i === highlight ? "bg-rose-50" : "hover:bg-neutral-50",
                  ].join(" ")}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => goResults(s)}
                  title={s}
                >
                  <div className="truncate">{s}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
