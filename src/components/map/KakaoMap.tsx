"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Map } from "react-kakao-maps-sdk";
import UserLocationRadius from "./UserLocationRadius";
import MapOverlays from "./overlays/MapOverlays";
import MyLocationButton from "./overlays/MyLocationButton";

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
};

const BAEKSEOK_UNIV: LatLng = { lat: 36.832361, lng: 127.182118 };

export default function KakaoMap({
  center = BAEKSEOK_UNIV,
  height = "100%",
  showMyLocationButton = true,
}: Props) {
  const [ready, setReady] = useState(false);
  const [mapCenter, setMapCenter] = useState<LatLng>(center);
  const mapRef = useRef<KakaoMapInstance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as KakaoWindow;
    if (w.kakao && w.kakao.maps) setReady(true);
  }, []);

  const recenterToCurrent = (smooth = true) => {
    if (!("geolocation" in navigator)) {
      setMapCenter(BAEKSEOK_UNIV);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapCenter({ lat, lng });

        const w = window as KakaoWindow;
        const LatLngCtor = w.kakao?.maps?.LatLng;
        if (mapRef.current && LatLngCtor) {
          const latlng = new LatLngCtor(lat, lng);
          if (smooth && mapRef.current.panTo) mapRef.current.panTo(latlng);
          else mapRef.current.setCenter(latlng);
        }
      },
      () => {
        setMapCenter(BAEKSEOK_UNIV);
        const w = window as KakaoWindow;
        const LatLngCtor = w.kakao?.maps?.LatLng;
        if (mapRef.current && LatLngCtor) {
          const latlng = new LatLngCtor(BAEKSEOK_UNIV.lat, BAEKSEOK_UNIV.lng);
          mapRef.current.setCenter(latlng);
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!ready) return;
    recenterToCurrent(false);
  }, [ready]);

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
            <UserLocationRadius
              center={mapCenter}
              radiusMeters={300}
              markerSize={{ width: 28, height: 34 }}
              markerTailPad={9}
              circleStyle={{
                strokeWeight: 0,
                fillOpacity: 0,
              }}
            />
          </Map>

          <MapOverlays
            onCategoryChange={(ids) => console.log("categories:", ids)}
          />

          {showMyLocationButton && (
            <MyLocationButton onClick={() => recenterToCurrent(true)} />
          )}
        </>
      ) : (
        <div>지도를 불러오는 중...</div>
      )}
    </div>
  );
}
