"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SearchInput from "@/app/(main)/map/overlays/SearchInput";
import GrayBackBtn from "@/components/button/GrayBackBtn";
import { unifiedSearch, fetchRecentStores, Store } from "@/services/search";

export default function SearchResultsScreen({ q }: { q: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Store[] | null>(null);
  const [queryText, setQueryText] = useState<string>(q);

  useEffect(() => setQueryText(q), [q]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const term = q.trim();
      if (!term) {
        const recent = await fetchRecentStores(20);
        if (alive) setItems(recent);
        return;
      }
      try {
        const data = await unifiedSearch(term, 30);
        if (alive) setItems(data);
      } catch (e) {
        console.error(e);
        if (alive) setItems([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [q]);

  const goOverlay = (text: string) => {
    const term = (text ?? "").trim();
    router.replace(
      `/map/search${term ? `?prefill=${encodeURIComponent(term)}` : ""}`,
      { scroll: false }
    );
  };

  const goResults = (text: string) => {
    const term = (text ?? "").trim();
    if (!term) return;
    router.replace(
      `/map/search/results?q=${encodeURIComponent(term)}`,
      { scroll: false }
    );
  };

  const normalize = (s: string) =>
    s
      .replace(/\([^)]*\)/g, "")
      .replace(/[·.\-_/]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const openOnMap = (s: Store) => {
    const params = new URLSearchParams();
    params.set("storeId", String(s.storeId));
    params.set("sheet", "store");
    params.set("name", s.name);
    router.push(`/map?${params.toString()}`);
  };

  const buildStoreLogoUrl = (storeId: number): string =>
    `https://api.parkruan.cc/api/stores/logo/${storeId}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
    >
      {/* 상단 바 */}
      <div className="border-b border-neutral-100">
        <div className="mx-auto w-full max-w-[425px] px-3 pt-[calc(env(safe-area-inset-top)+8px)] h-[56px] flex items-center gap-2">
          <div className="flex-1">
            <SearchInput
              defaultValue={queryText}
              placeholder="여기서 검색"
              onSearch={goResults}
              onChangeDebounced={(t: string) => setQueryText(t)}
              onFocus={() => goOverlay(queryText)}
              debounceMs={150}
              className="shadow-none border-0"
              iconSrc="/images/Search.png"
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
      </div>

      {/* 결과 리스트 */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-[425px]">
          {items === null && (
            <p className="px-4 py-3 text-neutral-400">불러오는 중…</p>
          )}
          {items?.length === 0 && (
            <p className="px-4 py-3 text-neutral-400">
              검색 결과가 없습니다.
            </p>
          )}
          {items && items.length > 0 && (
            <ul className="p-3 space-y-3">
              {items.map((s) => (
                <li
                  key={s.storeId}
                  className="flex gap-3 items-center p-2 border-b border-neutral-100 cursor-pointer"
                  onClick={() => openOnMap(s)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="w-14 h-14 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={buildStoreLogoUrl(s.storeId)}
                      alt={`${s.name} 로고`}
                      width={56}
                      height={56}
                      loading="lazy"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-rose-400">
                      {s.category ?? "매장"}
                    </div>
                    <div className="text-[16px] font-medium truncate">
                      {s.name}
                    </div>
                    {s.div2Category && (
                      <div className="text-xs text-neutral-500 truncate">
                        {s.div2Category}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
