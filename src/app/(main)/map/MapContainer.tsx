"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import KakaoMap from "./KakaoMap";
import BottomSheet from "./BottomSheet/BottomSheet";
import StoreBottomSheet from "./BottomSheet/StoreBottomSheet";
import { fetchNearbyByStore, type Place } from "@/services/places";

type StoreLite = {
  storeId?: number;
  name: string;
  category?: string;
  div2Category?: string;
};

const BAEKSEOK_UNIV = { lat: 36.832361, lng: 127.182118 };

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
    return () => {
      alive = false;
    };
  }, [initialStoreId, userPos]);

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
        myLocationBottomOffset={effectiveOffset}
        myLocationBaseBottomPx={baseBottomPx}
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
          />
        ) : (
          <div className="p-4 text-neutral-500">매장을 선택해 주세요.</div>
        )}
      </BottomSheet>
    </div>
  );
}
