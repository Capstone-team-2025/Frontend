"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/common/Header";
import FavoriteButton from "@/components/button/FavoriteButton";
import { fetchFavorites, removeFavorite, type FavoriteItem } from "@/services/favorites";
import CategoryChips, { type Chip } from "@/app/(main)/map/overlays/CategoryChips";

import {
  suggestStoreNames,
  suggestByConsonant,
  autocompleteStores,
  autocompleteByConsonant,
  isHangulConsonantOneChar,
  FIRST_CATEGORIES,
} from "@/services/search";

function normalizeCategoryKey(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (s.includes("식") || s.includes("음료") || s.includes("food")) return "food";
  if (s.includes("쇼핑") || s.includes("소매") || s.includes("shop")) return "shop";
  if (s.includes("문화") || s.includes("여가") || s.includes("culture")) return "culture";
  if (s.includes("모빌리티") || s.includes("교통") || s.includes("mobility") || s.includes("transport")) return "mobility";
  if (s.includes("라이프") || s.includes("생활") || s.includes("life")) return "life";
  if (s.includes("여행") || s.includes("travel") || s.includes("tour")) return "travel";
  return s;
}
function getCategoryKeyFromFavorite(it: FavoriteItem): string | undefined {
  const r = it as { category?: unknown; div2Category?: unknown; divCategory?: unknown };
  if (typeof r.category === "string") return normalizeCategoryKey(r.category);
  if (typeof r.div2Category === "string") return normalizeCategoryKey(r.div2Category);
  if (typeof r.divCategory === "string") return normalizeCategoryKey(r.divCategory);
  return undefined;
}
function makeInitials(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "•";
  const words = trimmed.split(/\s+/);
  const isAscii = /^[\x00-\x7F]+$/.test(trimmed);
  if (isAscii) {
    const first = words[0]?.[0] ?? "";
    const second = words[1]?.[0] ?? (words[0]?.[1] ?? "");
    return (first + second).toUpperCase();
  }
  return trimmed.slice(0, 2);
}

type SuggestItem =
  | { kind: "category"; text: string; catId: string }
  | { kind: "name"; text: string };

const FIRST_LABEL_TO_ID: Record<string, string> = {
  "식음료": "food",
  "쇼핑/소매": "shop",
  "문화/엔터테인먼트": "culture",
  "모빌리티": "mobility",
  "라이프": "life",
  "여행": "travel",
};

const LISTBOX_ID = "fav-suggest-list";
const optionId = (idx: number) => `fav-suggest-opt-${idx}`;

export default function FavoritesView() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [q, setQ] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string[]>([]);
  const [openSuggest, setOpenSuggest] = useState<boolean>(false);
  const [suggests, setSuggests] = useState<SuggestItem[]>([]);
  const [focusIdx, setFocusIdx] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await fetchFavorites();
        if (!alive) return;
        setItems(list);
      } catch {
        setError("즐겨찾기 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 자동완성 (카테고리 + 브랜드/상호명)
  useEffect(() => {
    const t = setTimeout(async () => {
      const term = q.trim();
      if (!term) {
        setSuggests([]);
        setOpenSuggest(false);
        setFocusIdx(-1);
        return;
      }

      try {
        const lower = term.toLowerCase();
        const firstCats = FIRST_CATEGORIES.filter((c) => c.toLowerCase().includes(lower));
        const catItems: SuggestItem[] = firstCats.map((c) => ({
          kind: "category",
          text: c,
          catId: FIRST_LABEL_TO_ID[c] ?? normalizeCategoryKey(c),
        }));

        const nameList = isHangulConsonantOneChar(term)
          ? await suggestByConsonant(term, 8)
          : await suggestStoreNames(term, 8);

        const byAutoComplete = isHangulConsonantOneChar(term)
          ? await autocompleteByConsonant(term, 8)
          : await autocompleteStores(term, 8);
        const moreNames = byAutoComplete.map((s) => s.name);

        const seen = new Set<string>();
        const nameItems: SuggestItem[] = [...nameList, ...moreNames]
          .filter((n) => {
            const key = n.trim();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map((n) => ({ kind: "name", text: n }));

        setSuggests([...catItems, ...nameItems].slice(0, 12));
        setOpenSuggest(true);
        setFocusIdx(-1);
      } catch (e) {
        console.error("자동완성 실패", e);
        setSuggests([]);
        setOpenSuggest(false);
        setFocusIdx(-1);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  // 인풋 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (e.target instanceof Node && !boxRef.current.contains(e.target)) {
        setOpenSuggest(false);
        setFocusIdx(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // 검색 + 카테고리 필터
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let arr = items;

    const selected = selectedCat[0];
    if (selected) {
      arr = arr.filter((i) => getCategoryKeyFromFavorite(i) === selected);
    }

    if (t.length > 0) {
      arr = arr.filter((i) => i.placeName.toLowerCase().includes(t));
    }
    return arr;
  }, [items, q, selectedCat]);

  const handleFavChange = useCallback((placeId: number, nextOn: boolean) => {
    if (!nextOn) setItems((prev) => prev.filter((i) => i.placeId !== placeId));
  }, []);

  const CATEGORIES: ReadonlyArray<Chip> = [
    { id: "food", label: "식음료", iconSrc: "/images/category_icon/dining-room.png" },
    { id: "shop", label: "쇼핑/소매", iconSrc: "/images/category_icon/shopping-bag.png" },
    { id: "culture", label: "문화/여가", iconSrc: "/images/category_icon/movie-projector.png" },
    { id: "mobility", label: "모빌리티", iconSrc: "/images/category_icon/taxi.png" },
    { id: "life", label: "라이프", iconSrc: "/images/category_icon/home.png" },
    { id: "travel", label: "여행", iconSrc: "/images/category_icon/world-map.png" },
  ] as const;

  const applySuggestion = (s: SuggestItem) => {
    if (s.kind === "category") {
      setSelectedCat([s.catId]);
      setQ("");
    } else {
      setQ(s.text);
    }
    setOpenSuggest(false);
    setFocusIdx(-1);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!openSuggest || suggests.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx((prev) => (prev + 1) % suggests.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx((prev) => (prev <= 0 ? suggests.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      if (focusIdx >= 0 && focusIdx < suggests.length) {
        e.preventDefault();
        applySuggestion(suggests[focusIdx]);
      }
    } else if (e.key === "Escape") {
      setOpenSuggest(false);
      setFocusIdx(-1);
    }
  };

  return (
    <div className="min-h-dvh bg-white">
      <Header title="즐겨찾기한 매장" />

      {/* 검색바 + 자동완성 */}
      <div className="px-4 pt-4" ref={boxRef}>
        <div className="relative">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
              <path
                d="M21 21l-4.2-4.2M10.8 18.6a7.8 7.8 0 1 1 0-15.6 7.8 7.8 0 0 1 0 15.6z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              ref={inputRef}
              value={q}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
              onFocus={() => {
                if (suggests.length > 0) setOpenSuggest(true);
              }}
              onKeyDown={onKeyDown}
              placeholder="검색"
              className="w-full outline-none text-sm"
              role="combobox"
              aria-autocomplete="list"
              aria-haspopup="listbox"
              aria-expanded={openSuggest}
              aria-controls={openSuggest ? LISTBOX_ID : undefined}
              aria-activedescendant={
                openSuggest && focusIdx >= 0 ? optionId(focusIdx) : undefined
              }
            />
          </div>

          {openSuggest && suggests.length > 0 && (
            <ul
              id={LISTBOX_ID}
              role="listbox"
              className="absolute z-10 mt-1 w-full max-h-72 overflow-auto rounded-xl border border-gray-200 bg-white shadow"
            >
              {suggests.map((s, idx) => (
                <li
                  key={`${s.kind}:${s.text}:${idx}`}
                  id={optionId(idx)}
                  role="option"
                  aria-selected={idx === focusIdx}
                  className={[
                    "px-4 py-2 text-sm cursor-pointer flex items-center gap-2",
                    idx === focusIdx ? "bg-gray-100" : "bg-white",
                  ].join(" ")}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(s)}
                  onMouseEnter={() => setFocusIdx(idx)}
                >
                  <span>{s.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 카테고리 칩 */}
      <div className="px-2 mt-2">
        <CategoryChips
          items={CATEGORIES}
          selectedIds={selectedCat}
          singleSelect
          onToggle={(_, next) => setSelectedCat(next)}
          className="max-w-full"
        />
      </div>

      {/* 목록 */}
      <div className="px-4 pb-8">
        {loading && <div className="py-12 text-center text-gray-500 text-sm">불러오는 중…</div>}
        {error && <div className="py-12 text-center text-red-500 text-sm">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">조건에 맞는 즐겨찾기가 없습니다.</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {filtered.map((f) => (
            <FavoriteCard key={f.placeId} item={f} onFavChange={handleFavChange} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FavoriteCard({
  item,
  onFavChange,
}: {
  item: FavoriteItem;
  onFavChange: (placeId: number, nextOn: boolean) => void;
}) {
  const initials = useMemo(() => makeInitials(item.placeName), [item.placeName]);

  return (
    <div
      className="relative rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow transition bg-white"
      role="button"
      tabIndex={0}
    >
      <div className="absolute right-3 top-3">
        <FavoriteButton
          active
          ariaLabel={`${item.placeName} 즐겨찾기`}
          onChange={async (nextOn: boolean) => {
            if (!nextOn) {
              try {
                await removeFavorite(item.placeId);
                onFavChange(item.placeId, nextOn);
              } catch (e) {
                console.error("즐겨찾기 삭제 실패", e);
              }
            }
          }}
        />
      </div>

      <div className="flex flex-col items-center text-center gap-3 pt-2 pb-1">
        <div className="mx-auto h-24 w-24 rounded-full border border-gray-200 flex items-center justify-center text-xl font-semibold">
          {initials}
        </div>
        <div className="text-base font-medium leading-snug break-keep">
          {item.placeName}
        </div>
      </div>
    </div>
  );
}
