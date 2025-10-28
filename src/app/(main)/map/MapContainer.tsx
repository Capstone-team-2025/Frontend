// C:\Users\User\Desktop\capstonepj\mapnefit\src\app\(main)\map\MapContainer.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import KakaoMap from "./KakaoMap";
import BottomSheet from "./BottomSheet/BottomSheet";
import StoreBottomSheet from "./BottomSheet/StoreBottomSheet";
import { fetchNearbyByStore, type Place } from "@/services/places";
import { fetchFavorites, addFavorite, removeFavorite, type FavoriteItem, } from "@/services/favorites";

type StoreLite = {
  storeId?: number;
  name: string;
  category?: string;
  div2Category?: string;
};

const BAEKSEOK_UNIV = { lat: 36.8398, lng: 127.1849 };

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
  const [sheetHeight, setSheetHeight] = useState(0);
  const [sheetDragging, setSheetDragging] = useState(false);

  const GAP = 4;
  const effectiveOffset = sheetOpen ? (sheetHeight + GAP) : 0;
  const baseBottomPx = 100;
  const [selectedStore, setSelectedStore] = useState<StoreLite | null>(
    initialSheetOpen
      ? { name: initialName || initialKeyword || "", category: initialCategory, storeId: initialStoreId }
      : null
  );

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // 즐겨찾기 상태
  const [favorites, setFavorites] = useState<FavoriteItem[] | null>(null);

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
        setSheetOpen(true);
        if (data?.[0]) setSelectedPlace(data[0]);
      } catch (e) {
        console.error(e);
        if (alive) setPlaces([]);
      }
    })();
    return () => { alive = false; };
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
    return () => { alive = false; };
  }, []);

  // placeId Set (버튼 active 판별용)
  const favoritePlaceIds = useMemo(() => {
    if (!favorites) return new Set<string>();
    return new Set(favorites.map((f) => String(f.placeId)));
  }, [favorites]);

  // 토글 핸들러
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
        // 서버 반영 성공 → 임시 항목을 실제 응답으로 치환
        const item = await addFavorite(placeIdNum, placeName); // 항상 FavoriteItem
        setFavorites((prev) => {
          if (!prev) return prev;
          const idx = prev.findIndex(
            (f) => f.placeId === placeIdNum && f.favoriteId === -1
          );
          if (idx === -1) return prev;
          const copy = prev.slice();
          copy[idx] = item;
          return copy;
        });
      } else {
        await removeFavorite(placeIdNum);
      }
    } catch (err: any) {
      // 예외 처리
      if (err?.message === "DUPLICATED_FAVORITE") {
        return;
      }
      setFavorites((prev) => {
        if (!prev) return prev;
        const exists = prev.some((f) => f.placeId === placeIdNum);
        // 추가 실패 롤백: 방금 넣은 임시 항목 제거
        if (next && exists) {
          return prev.filter(
            (f) => !(f.placeId === placeIdNum && f.favoriteId === -1)
          );
        }
        // 삭제 실패 롤백: 없으면 다시 임시 항목 복원
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

  const onViewOnMap = (_: StoreLite) => {
    setSheetOpen(false);
  };

  return (
    <div className="w-full h-full">
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
        onVisibleHeightChange={setSheetHeight}
        onDraggingChange={setSheetDragging}
      >
        {initialStoreId ? (
          <StoreBottomSheet
            store={{
              storeId: initialStoreId,
              name: selectedStore?.name || initialName || initialKeyword || "",
              category: initialCategory,
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
            // 즐겨찾기 연동
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
