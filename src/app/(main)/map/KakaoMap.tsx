"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import UserLocationRadius from "./overlays/UserLocationRadius";
import MyLocationButton from "./overlays/MyLocationButton";
import type { Place, CategoryKey } from "@/services/places";

// --------------------- 마커 이미지 ---------------------
const ICON_SIZE = { width: 27, height: 40 } as const;
const ICON_OFFSET = { x: ICON_SIZE.width / 2, y: ICON_SIZE.height } as const; // 하단 중앙 앵커

type MarkerImageDef = {
  src: string;
  size: typeof ICON_SIZE;
  options: { offset: typeof ICON_OFFSET; alt?: string };
};

const CATEGORY_MARKER: Record<CategoryKey, MarkerImageDef> = {
  cafe: { src: "/images/MapMarker/cafe.png", size: ICON_SIZE, options: { offset: ICON_OFFSET, alt: "카페" } },
  CVS: { src: "/images/MapMarker/cvs.png", size: ICON_SIZE, options: { offset: ICON_OFFSET, alt: "편의점" } },
  food: { src: "/images/MapMarker/food.png", size: ICON_SIZE, options: { offset: ICON_OFFSET, alt: "식당" } },
  movie: { src: "/images/MapMarker/movie.png", size: ICON_SIZE, options: { offset: ICON_OFFSET, alt: "영화" } },
  shoping: { src: "/images/MapMarker/shopping.png", size: ICON_SIZE, options: { offset: ICON_OFFSET, alt: "쇼핑/소매" } },
  culture: { src: "/images/MapMarker/culture.png", size: ICON_SIZE, options: { offset: ICON_OFFSET, alt: "문화/여가" } },
  hotel: { src: "/images/MapMarker/hotel.png", size: ICON_SIZE, options: { offset: ICON_OFFSET, alt: "호텔/리조트" } },
  life: { src: "/images/MapMarker/life.png", size: ICON_SIZE, options: { offset: ICON_OFFSET, alt: "라이프" } },
};

const LIKE_MARKER: MarkerImageDef = {
  src: "/images/MapMarker/like.png",
  size: ICON_SIZE,
  options: { offset: ICON_OFFSET, alt: "즐겨찾기" },
};

const DEFAULT_MARKER: MarkerImageDef = CATEGORY_MARKER.shoping;

type PlaceExtended = Place & {
  categoryKey?: CategoryKey | null;
  categoryName?: "카페" | "편의점" | "식당" | "영화" | "쇼핑/소매" | "문화/엔터테인먼트" | "라이프" | "호텔/리조트" | null;
};

const CATEGORY_NAME_TO_KEY: Record<
  NonNullable<PlaceExtended["categoryName"]>,
  CategoryKey
> = {
  "카페": "cafe",
  "편의점": "CVS",
  "식당": "food",
  "영화": "movie",
  "쇼핑/소매": "shoping",
  "문화/엔터테인먼트": "culture",
  "라이프": "life",
  "호텔/리조트": "hotel",
};

function resolveCategoryKey(p: Place): CategoryKey | null {
  const ep = p as PlaceExtended;
  if (ep.categoryKey) return ep.categoryKey;
  if (!ep.categoryName) return null;
  return CATEGORY_NAME_TO_KEY[ep.categoryName] ?? null;
}
// ------------------------------------------

type LatLng = { lat: number; lng: number };

type KakaoMapsMinimal = {
  load: (cb: () => void) => void;
  LatLng: new (lat: number, lng: number) => unknown;
};
type KakaoNS = { maps?: KakaoMapsMinimal };
type KakaoWindow = Window & { kakao?: KakaoNS };

type KakaoMapInstance = {
  setCenter: (latlng: unknown) => void;
  panTo?: (latlng: unknown) => void;
  getCenter: () => { getLat(): number; getLng(): number };
};

type MarkerMode = "normal" | "favorites";

// 위치 권한 관련 에러 상태 타입
type LocationPermissionError = "denied";

type Props = {
  center: LatLng;
  height?: number | string;
  showMyLocationButton?: boolean;
  markers?: Place[];
  onMarkerClick?: (p: Place) => void;
  onCenterChange?: (c: LatLng) => void;
  myLocationBottomOffset?: number;
  myLocationBaseBottomPx?: number;
  myLocationDragging?: boolean;
  onMapClick?: () => void;
  draggable?: boolean;
  markerMode?: MarkerMode;
  favoritePlaceIds?: ReadonlySet<string>;
  onLocationPermissionDenied?: (reason: LocationPermissionError) => void;
};

export default function KakaoMap({
  center,
  height = "100%",
  showMyLocationButton = true,
  markers = [],
  onMarkerClick,
  onCenterChange,
  myLocationBottomOffset = 0,
  myLocationBaseBottomPx = 100,
  myLocationDragging = false,
  onMapClick,
  draggable = true,
  markerMode = "normal",
  favoritePlaceIds,
  onLocationPermissionDenied,
}: Props) {
  const [ready, setReady] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const mapRef = useRef<KakaoMapInstance | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const firstFixAppliedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as KakaoWindow;
    if (w.kakao?.maps) setReady(true);
  }, []);

  useEffect(() => {
    const w = window as KakaoWindow;
    const LatLngCtor = w.kakao?.maps?.LatLng;
    if (!mapRef.current || !LatLngCtor || !center) return;
    const latlng = new LatLngCtor(center.lat, center.lng);
    mapRef.current.setCenter(latlng);
  }, [center]);

  useEffect(() => {
    if (!ready || !("geolocation" in navigator)) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy: rawAccuracy } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setAccuracy(Math.round(rawAccuracy));
      },
      () => {
        setUserLocation(null);
        setAccuracy(null);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    watchIdRef.current = id;
    return () => {
      const geo =
        typeof navigator !== "undefined" ? navigator.geolocation : undefined;
      const wid = watchIdRef.current;
      if (wid !== null && geo && typeof geo.clearWatch === "function") {
        geo.clearWatch(wid);
      }
      watchIdRef.current = null;
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !userLocation || firstFixAppliedRef.current) return;
    firstFixAppliedRef.current = true;

    const w = window as KakaoWindow;
    const LatLngCtor = w.kakao?.maps?.LatLng;
    if (mapRef.current && LatLngCtor) {
      const latlng = new LatLngCtor(userLocation.lat, userLocation.lng);
      if (typeof mapRef.current.panTo === "function") {
        mapRef.current.panTo(latlng);
      } else {
        mapRef.current.setCenter(latlng);
      }
    }
    onCenterChange?.(userLocation);
  }, [ready, userLocation, onCenterChange]);

  const recenterToUser = () => {
    const w = window as KakaoWindow;
    const LatLngCtor = w.kakao?.maps?.LatLng;
    if (userLocation && mapRef.current && LatLngCtor) {
      const latlng = new LatLngCtor(userLocation.lat, userLocation.lng);
      mapRef.current.panTo?.(latlng);
      onCenterChange?.(userLocation);
    }
  };

  // 내 위치 버튼 클릭 시: 권한이 아예 거부된 상태면 부모에게 알리고, 아니면 기존 동작(recenter) 수행
  const handleMyLocationClick = async () => {
    if (typeof navigator !== "undefined" && "permissions" in navigator) {
      try {
        const navWithPermissions = navigator as Navigator & {
          permissions: {
            query: (
              descriptor:
                | PermissionDescriptor
                | { name: "geolocation" }
            ) => Promise<PermissionStatus>;
          };
        };

        const status = await navWithPermissions.permissions.query({
          name: "geolocation",
        });

        if (status.state === "denied") {
          onLocationPermissionDenied?.("denied");
          return;
        }
      } catch {
      }
    }

    recenterToUser();
  };

  const bottomPx =
    (myLocationBottomOffset > 0
      ? myLocationBottomOffset
      : myLocationBaseBottomPx) + 8;

  return (
    <div className="relative" style={{ width: "100%", height }}>
      {!ready && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&libraries=services,clusterer`}
          strategy="afterInteractive"
          onLoad={() => {
            const w = window as KakaoWindow;
            w.kakao?.maps?.load(() => setReady(true));
          }}
        />
      )}

      {ready ? (
        <>
          <Map
            center={center}
            level={4}
            style={{ width: "100%", height: "100%" }}
            draggable={draggable}
            onCreate={(map) => {
              mapRef.current = map as unknown as KakaoMapInstance;
            }}
            onDragEnd={(target) => {
              const map = target as unknown as KakaoMapInstance;
              const c = map.getCenter();
              onCenterChange?.({ lat: c.getLat(), lng: c.getLng() });
            }}
            onClick={() => {
              onMapClick?.();
            }}
          >
            {userLocation && (
              <UserLocationRadius
                center={userLocation}
                radiusMeters={accuracy ?? 300}
                showCircle={false}
                showMarker={true}
                markerSize={{ width: 30, height: 45 }}
              />
            )}

            {markers.map((p) => {
              const key = resolveCategoryKey(p);

              const isFavorite =
                favoritePlaceIds !== undefined
                  ? favoritePlaceIds.has(String(p.placeId))
                  : false;

              const image =
                markerMode === "favorites" || isFavorite
                  ? LIKE_MARKER
                  : key
                  ? CATEGORY_MARKER[key]
                  : DEFAULT_MARKER;

              return (
                <MapMarker
                  key={p.placeId}
                  position={{ lat: p.latitude, lng: p.longitude }}
                  image={image}
                  onClick={() => onMarkerClick?.(p)}
                />
              );
            })}
          </Map>

          {showMyLocationButton && (
            <MyLocationButton
              onClick={handleMyLocationClick}
              bottomPx={bottomPx}
              dragging={myLocationDragging}
            />
          )}
        </>
      ) : (
        <div></div>
      )}
    </div>
  );
}
