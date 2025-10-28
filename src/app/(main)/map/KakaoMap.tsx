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
};

type Props = {
  center?: LatLng;
  height?: number | string;
  showMyLocationButton?: boolean;
  markers?: Place[];
  onMarkerClick?: (p: Place) => void;
  autoLocateOnReady?: boolean;
  myLocationBottomOffset?: number;
  myLocationBaseBottomPx?: number;
  myLocationDragging?: boolean;
};

const BAEKSEOK_UNIV: LatLng = { lat: 36.8398, lng: 127.1849 };

export default function KakaoMap({
  center = BAEKSEOK_UNIV,
  height = "100%",
  showMyLocationButton = true,
  markers = [],
  onMarkerClick,
  autoLocateOnReady = true,
  myLocationBottomOffset = 0,
  myLocationBaseBottomPx = 100,
  myLocationDragging = false,
}: Props) {
  const [ready, setReady] = useState(false);
  const [mapCenter, setMapCenter] = useState<LatLng>(center);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const firstLocateDoneRef = useRef(false);

  // Kakao SDK 로딩 상태 확인
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as KakaoWindow;
    if (w.kakao && w.kakao.maps) setReady(true);
  }, []);

  useEffect(() => {
    setMapCenter(center);
    const w = window as KakaoWindow;
    const LatLngCtor = w.kakao?.maps?.LatLng;
    if (mapRef.current && LatLngCtor) {
      const latlng = new LatLngCtor(center.lat, center.lng);
      mapRef.current.setCenter(latlng);
    }
  }, [center]);

  const locateOnceAndMaybeCenter = (smooth = false, alsoCenterCamera = true) => {
    if (!("geolocation" in navigator)) {
      if (alsoCenterCamera) setMapCenter(BAEKSEOK_UNIV);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const next = { lat: latitude, lng: longitude };
        setUserLocation(next);
        setAccuracy(Math.round(accuracy));

        if (alsoCenterCamera) {
          setMapCenter(next);
          const w = window as KakaoWindow;
          const LatLngCtor = w.kakao?.maps?.LatLng;
          if (mapRef.current && LatLngCtor) {
            const latlng = new LatLngCtor(next.lat, next.lng);
            if (smooth && mapRef.current.panTo) mapRef.current.panTo(latlng);
            else mapRef.current.setCenter(latlng);
          }
        }
      },
      () => {
        if (alsoCenterCamera) {
          setMapCenter(BAEKSEOK_UNIV);
          const w = window as KakaoWindow;
          const LatLngCtor = w.kakao?.maps?.LatLng;
          if (mapRef.current && LatLngCtor) {
            const latlng = new LatLngCtor(BAEKSEOK_UNIV.lat, BAEKSEOK_UNIV.lng);
            mapRef.current.setCenter(latlng);
          }
        }
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!ready) return;
    if (!firstLocateDoneRef.current && autoLocateOnReady) {
      firstLocateDoneRef.current = true;
      locateOnceAndMaybeCenter(false, true);
    }
  }, [ready, autoLocateOnReady]);

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

  const recenterToUser = () => {
    const w = window as KakaoWindow;
    const LatLngCtor = w.kakao?.maps?.LatLng;
    if (userLocation && mapRef.current && LatLngCtor) {
      setMapCenter(userLocation);
      mapRef.current.panTo?.(new LatLngCtor(userLocation.lat, userLocation.lng));
    } else {
      locateOnceAndMaybeCenter(true, true);
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
            center={mapCenter}
            level={4}
            style={{ width: "100%", height: "100%" }}
            onCreate={(map) => {
              mapRef.current = map as unknown as KakaoMapInstance;
            }}
          >
            {/* 내 위치 정보 허용: 내 위치 마커 표시 */}
            {userLocation && (
              <UserLocationRadius
                center={userLocation}
                radiusMeters={accuracy ?? 300}
                showCircle={false}
                showMarker={true}
                markerSize={{ width: 28, height: 34 }}
              />
            )}
            
            {/* 내 위치 정보 거부: 내 위치 마커 숨기기 */}
            {!userLocation && (
              <UserLocationRadius
                center={mapCenter}
                radiusMeters={500}
                showCircle={false}
                showMarker={false}
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
            />)}
        </>
      ) : (
        <div>지도를 불러오는 중...</div>
      )}
    </div>
  );
}
