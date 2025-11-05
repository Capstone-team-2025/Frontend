"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import KakaoMap from "./KakaoMap";
import BottomSheet from "./BottomSheet/BottomSheet";
import StoreBottomSheet from "./BottomSheet/StoreBottomSheet";
import PlaceDetailSheet from "./BottomSheet/PlaceDetailSheet";
import MapOverlays from "./overlays/MapOverlays";
import { useNearbyAll } from "./NearbyAllPlaces";
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

type LatLng = { lat: number; lng: number };

const BAEKSEOK_UNIV: LatLng = { lat: 36.8398, lng: 127.1849 };

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
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const {
    center: nearbyCenter,
    loading: nearbyLoading,
    error: nearbyError,
    flat: nearbyAllFlat,
    reload: reloadNearby,
  } = useNearbyAll();

  const [sheetOpen, setSheetOpen] = useState(initialSheetOpen);
  const [sheetDragging, setSheetDragging] = useState(false);
  const [sheetVisiblePx, setSheetVisiblePx] = useState(0);

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

  const [userPos, setUserPos] = useState<LatLng | null>(null);

  useEffect(() => {
    if (!userPos && nearbyCenter) setUserPos(nearbyCenter);
  }, [nearbyCenter, userPos]);

  const [places, setPlaces] = useState<Place[] | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[] | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [mode, setMode] = useState<"brand" | "category" | null>(
    initialStoreId ? "brand" : null
  );
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);

  const [manualCenter, setManualCenter] = useState<LatLng | null>(null);

  const [sheetMode, setSheetMode] = useState<"list" | "detail">(
    initialStoreId ? "list" : "detail"
  );

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
        setSheetMode("list");
        setSelectedPlace(null);
      } catch (e) {
        console.error(e);
        if (alive) setPlaces([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [initialStoreId, userPos]);

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

  const favoritePlaceIds = useMemo(() => {
    if (!favorites) return new Set<string>();
    return new Set(favorites.map((f) => String(f.placeId)));
  }, [favorites]);

  async function handleCategoryChange(ids: string[]) {
    const key = ids[0] as CategoryKey | undefined;
    if (!key) {
      setSelectedCategory(null);
      setMode(null);
      setSelectedPlace(null);
      setPlaces([]);
      setSheetOpen(false);
      setSheetMode("detail");
      return;
    }
    if (!userPos) return;

    try {
      setCategoryLoading(true);
      const { data } = await fetchNearbyByCategoryFlat(userPos.lat, userPos.lng, key);
      setSelectedCategory(key);
      setMode("category");
      setPlaces(data);
      setSheetMode("list");
      setSelectedPlace(null);
      setSheetOpen(true);
    } catch (e) {
      console.error("카테고리 검색 실패:", getErrorMessage(e));
      setPlaces([]);
    } finally {
      setCategoryLoading(false);
    }
  }

  async function onToggleFavoritePlace(p: Place, next: boolean) {
    const placeIdNum = Number(p.placeId);
    if (!Number.isFinite(placeIdNum)) {
      console.warn("placeId 파싱 실패:", p.placeId);
      return;
    }
    const placeName = p.placeName ?? "";

    const categoryGuess =
      (p as { category?: string }).category ??
      selectedStore?.category ??
      (selectedCategory ? CATEGORY_LABEL[selectedCategory] : "");

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
            category: categoryGuess,
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
              category: categoryGuess,
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
        : (manualCenter ?? nearbyCenter ?? BAEKSEOK_UNIV),
    [selectedPlace, manualCenter, nearbyCenter]
  );

  useEffect(() => {
    if (selectedPlace) setManualCenter(null);
  }, [selectedPlace]);

  const nearbyPlaces: Place[] = useMemo(
    () => nearbyAllFlat.map(({ brandColor, ...rest }) => rest),
    [nearbyAllFlat]
  );

  const onViewOnMap = () => setSheetOpen(false);

  const goDetail = (p: Place) => {
    const qs = new URLSearchParams({
      placeId: String(p.placeId ?? ""),
      name: p.placeName ?? "",
    }).toString();
    router.push(`/map/store?${qs}`);
  };

  const showList =
    (mode === "brand" && !!initialStoreId) ||
    (mode === "category" && (places?.length ?? 0) > 0);

  return (
    <div ref={anchorRef} className="w-full h-full relative">
      <MapOverlays onCategoryChange={handleCategoryChange} />

      {categoryLoading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 text-xs bg-black/70 text-white px-2 py-1 rounded">
          카테고리 검색 중…
        </div>
      )}

      {mode === null && nearbyLoading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 text-xs bg-black/70 text-white px-2 py-1 rounded">
          주변 할인 매장 불러오는 중…
        </div>
      )}
      {mode === null && nearbyError && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 text-xs bg-red-600/80 text-white px-2 py-1 rounded">
          {nearbyError}
        </div>
      )}

      <KakaoMap
        height="100%"
        center={mapCenter}
        markers={(mode === "brand" || mode === "category") ? (places ?? []) : nearbyPlaces}
        draggable={!sheetDragging}
        onMarkerClick={(p: Place) => {
          setSelectedPlace(p);
          setSheetMode("detail");
          setSheetOpen(true);
        }}
        onMapClick={() => {
          if (mode === null) {
            setSelectedPlace(null);
            setSheetOpen(false);
            setSheetMode("detail");
          }
        }}
        onCenterChange={(c) => {
          setManualCenter(c);
          setUserPos(c);
          if (mode === null) {
            reloadNearby({ center: c });
          }
        }}
        myLocationBottomOffset={sheetVisiblePx}
        myLocationBaseBottomPx={100}
        myLocationDragging={sheetDragging}
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
        anchorRef={anchorRef}
        onVisibleHeightChange={setSheetVisiblePx}
      >
        {sheetMode === "detail" && selectedPlace ? (
          <PlaceDetailSheet
            place={selectedPlace}
            onBackToList={
              (mode === "brand" || mode === "category") && (places?.length ?? 0) > 0
                ? () => setSheetMode("list")
                : undefined
            }
            favoritePlaceIds={favoritePlaceIds}
            onToggleFavoritePlace={onToggleFavoritePlace}
            onOpenDetail={goDetail}
          />
        ) : showList ? (
          <StoreBottomSheet
            store={{
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
            onSelect={goDetail}
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
