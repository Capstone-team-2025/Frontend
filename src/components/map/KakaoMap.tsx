"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { Map } from "react-kakao-maps-sdk";
import UserLocationRadius from "./UserLocationRadius";
import MapOverlays from "./overlays/MapOverlays";

type KakaoMaps = { load: (cb: () => void) => void };
type KakaoNS = { maps?: KakaoMaps };
type KakaoWindow = Window & { kakao?: KakaoNS };

export default function KakaoMap({
  center = { lat: 37.5662952, lng: 126.9779451 }, // 임시로 마커 위치 지정
  height = "100%",
}: {
  center?: { lat: number; lng: number };
  height?: number | string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as KakaoWindow;
    const ok = !!(w.kakao && w.kakao.maps);
    if (ok) setReady(true);
  }, []);

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
            onCreate={() => console.log("[MAP] created")}
          >
            <UserLocationRadius
              center={center}
              radiusMeters={300}
              markerSize={{ width: 50, height: 59 }}
              markerTailPad={9}
              circleStyle={{
                strokeWeight: 2,
                strokeColor: "#ff5a5f",
                strokeOpacity: 0.9,
                fillColor: "#ff5a5f",
                fillOpacity: 0.18,
              }}
            />
          </Map>
          <MapOverlays
            onCategoryChange={(ids) => console.log("categories:", ids)}
          />
        </>
      ) : (
        <div>지도를 불러오는 중...</div>
      )}
    </div>
  );
}
