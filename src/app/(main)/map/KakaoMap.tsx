"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import UserLocationRadius from "./overlays/UserLocationRadius";
import MyLocationButton from "./overlays/MyLocationButton";
import type { Place } from "@/services/places";

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
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setAccuracy(Math.round(accuracy));
      },
      () => {
        setUserLocation(null);
        setAccuracy(null);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    watchIdRef.current = id;
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
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
                markerSize={{ width: 28, height: 34 }}
              />
            )}

            {markers.map((p) => (
              <MapMarker
                key={p.placeId}
                position={{ lat: p.latitude, lng: p.longitude }}
                onClick={() => onMarkerClick?.(p)}
              />
            ))}
          </Map>

          {showMyLocationButton && (
            <MyLocationButton
              onClick={recenterToUser}
              bottomOffset={myLocationBottomOffset}
              baseBottomPx={myLocationBaseBottomPx}
              dragging={myLocationDragging}
            />
          )}
        </>
      ) : (
        <div>지도를 불러오는 중...</div>
      )}
    </div>
  );
}