"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import KakaoMap from "./KakaoMap";
import BottomSheet from "./BottomSheet/BottomSheet";
import StoreBottomSheet from "./BottomSheet/StoreBottomSheet";
import MapOverlays from "./overlays/MapOverlays";
import {
  fetchNearbyByStore,
  fetchNearbyByCategoryFlat,
  type CategoryKey,
  type Place,
} from "@/services/places";
import {
  fetchFavorites,
  addFavorite,
  removeFavorite,
  type FavoriteItem,
} from "@/services/favorites";

type StoreLite = {
  storeId?: number;
  name: string;
  category?: string;
  div2Category?: string;
};

const BAEKSEOK_UNIV = { lat: 36.8398, lng: 127.1849 };

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  food: "식음료",
  shop: "쇼핑/소매",
  culture: "문화/여가",
  mobility: "모빌리티",
  life: "라이프",
  travel: "여행",
};

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return String(e);
}

export default function MapContainer({
  initialKeyword,
  initialCategory,
  initialSheetOpen = false,
  initialName = "",
  initialStoreId,
}: {
  initialKeyword?: string;
  initialCategory?: string;
  initialSheetOpen?: boolean;
  initialName?: string;
  initialStoreId?: number;
}) {
  const router = useRouter();

  const [sheetOpen, setSheetOpen] = useState(initialSheetOpen);
  const [, setSheetDragging] = useState(false);

  const selectedStore: StoreLite | null = useMemo(
    () =>
      initialSheetOpen
        ? {
            name: initialName || initialKeyword || "",
            category: initialCategory,
            storeId: initialStoreId,
          }
        : null,
    [initialSheetOpen, initialName, initialKeyword, initialCategory, initialStoreId]
  );

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[] | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [mode, setMode] = useState<"brand" | "category" | null>(
    initialStoreId ? "brand" : null
  );
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setUserPos(BAEKSEOK_UNIV);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserPos(BAEKSEOK_UNIV),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!userPos || !initialStoreId) return;
      setPlaces(null);
      try {
        const { data } = await fetchNearbyByStore(initialStoreId, userPos.lat, userPos.lng);
        if (!alive) return;
        setPlaces(data ?? []);
        setMode("brand");
        setSheetOpen(true);
        if (data?.[0]) setSelectedPlace(data[0]);
      } catch (e) {
        console.error(e);
        if (alive) setPlaces([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [initialStoreId, userPos]);

  // 즐겨찾기 초기 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchFavorites();
        if (alive) setFavorites(data);
      } catch (e) {
        console.error("즐겨찾기 로드 실패", e);
        if (alive) setFavorites([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // placeId Set (버튼 active 판별용)
  const favoritePlaceIds = useMemo(() => {
    if (!favorites) return new Set<string>();
    return new Set(favorites.map((f) => String(f.placeId)));
  }, [favorites]);

  // MapOverlays 카테고리 선택 변경 핸들러
  async function handleCategoryChange(ids: string[]) {
    const key = ids[0] as CategoryKey | undefined;
    if (!key) {
      setSelectedCategory(null);
      setMode(null);
      setSelectedPlace(null);
      setPlaces([]);
      setSheetOpen(false);
      return;
    }
    if (!userPos) return;

    try {
      setCategoryLoading(true);
      const { data } = await fetchNearbyByCategoryFlat(userPos.lat, userPos.lng, key);
      setSelectedCategory(key);
      setMode("category");
      setPlaces(data);
      if (data[0]) {
        setSelectedPlace(data[0]);
        setSheetOpen(true);
      }
    } catch (e) {
      console.error("카테고리 검색 실패:", getErrorMessage(e));
      setPlaces([]);
    } finally {
      setCategoryLoading(false);
    }
  }

  // 즐겨찾기 토글
  async function onToggleFavoritePlace(p: Place, next: boolean) {
    const placeIdNum = Number(p.placeId);
    if (!Number.isFinite(placeIdNum)) {
      console.warn("placeId 파싱 실패:", p.placeId);
      return;
    }
    const placeName = p.placeName ?? "";

    // 낙관적 업데이트
    setFavorites((prev) => {
      if (!prev) return prev;
      const exists = prev.some((f) => f.placeId === placeIdNum);
      if (next && !exists) {
        return [
          {
            favoriteId: -1,
            userId: -1,
            placeId: placeIdNum,
            placeName,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ];
      }
      if (!next && exists) {
        return prev.filter((f) => f.placeId !== placeIdNum);
      }
      return prev;
    });

    try {
      if (next) {
        const item = await addFavorite(placeIdNum, placeName);
        setFavorites((prev) => {
          if (!prev) return prev;
          const idx = prev.findIndex((f) => f.placeId === placeIdNum && f.favoriteId === -1);
          if (idx === -1) return prev;
          const copy = prev.slice();
          copy[idx] = item;
          return copy;
        });
      } else {
        await removeFavorite(placeIdNum);
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg === "DUPLICATED_FAVORITE") return;

      // 롤백
      setFavorites((prev) => {
        if (!prev) return prev;
        const exists = prev.some((f) => f.placeId === placeIdNum);
        if (next && exists) {
          return prev.filter((f) => !(f.placeId === placeIdNum && f.favoriteId === -1));
        }
        if (!next && !exists) {
          return [
            {
              favoriteId: -1,
              userId: -1,
              placeId: placeIdNum,
              placeName,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ];
        }
        return prev;
      });
    }
  }

  const mapCenter = useMemo(
    () =>
      selectedPlace
        ? { lat: selectedPlace.latitude, lng: selectedPlace.longitude }
        : userPos ?? BAEKSEOK_UNIV,
    [selectedPlace, userPos]
  );

  const onViewOnMap = () => setSheetOpen(false);

  const showList =
    (mode === "brand" && !!initialStoreId) ||
    (mode === "category" && (places?.length ?? 0) > 0);

  return (
    <div className="w-full h-full relative">
      <MapOverlays onCategoryChange={handleCategoryChange} />

      {categoryLoading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 text-xs bg-black/70 text-white px-2 py-1 rounded">
          카테고리 검색 중…
        </div>
      )}

      <KakaoMap
        height="100%"
        center={mapCenter}
        markers={places ?? []}
        onMarkerClick={(p: Place) => {
          setSelectedPlace(p);
          setSheetOpen(true);
        }}
        myLocationBottomOffset={0}
        myLocationBaseBottomPx={100}
        myLocationDragging={false}
      />

      <BottomSheet
        open={sheetOpen}
        onOpenChange={(v) => {
          setSheetOpen(v);
          if (!v) setSelectedPlace(null);
        }}
        defaultRatio={0.5}
        fullRatio={0.66}
        onDraggingChange={setSheetDragging}
      >
        {showList ? (
          <StoreBottomSheet
            store={{
              // brand 모드: 기존 스토어 정보
              // category 모드: 카테고리 이름으로 타이틀 구성
              storeId: mode === "brand" ? initialStoreId : undefined,
              name:
                mode === "brand"
                  ? (selectedStore?.name || initialName || initialKeyword || "")
                  : (selectedCategory ? CATEGORY_LABEL[selectedCategory] : "주변 매장"),
              category:
                mode === "brand" ? initialCategory : selectedCategory ?? undefined,
            }}
            places={places ?? []}
            selected={selectedPlace ?? undefined}
            onSelect={(p: Place) => {
              setSelectedPlace(p);
              const qs = new URLSearchParams({
                placeId: String(p.placeId ?? ""),
                name: p.placeName ?? "",
              }).toString();
              router.push(`/map/store?${qs}`);
            }}
            onViewOnMap={onViewOnMap}
            favoritePlaceIds={favoritePlaceIds}
            onToggleFavoritePlace={onToggleFavoritePlace}
          />
        ) : (
          <div className="p-4 text-neutral-500">매장을 선택해 주세요.</div>
        )}
      </BottomSheet>
    </div>
  );
}
