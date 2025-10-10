"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";

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
    const ok = (window as any).kakao && (window as any).kakao.maps;
    if (ok) setReady(true);
  }, []);

  return (
    <div style={{ width: "100%", height }}>
      {!ready && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&libraries=services,clusterer`}
          strategy="afterInteractive"
          onLoad={() => (window as any).kakao.maps.load(() => setReady(true))}
        />
      )}

      {ready ? (
        <Map
          center={center}
          level={4}
          style={{ width: "100%", height: "100%" }}
          onCreate={() => console.log("[MAP] created")}
        >
          <MapMarker position={center} />
        </Map>
      ) : (
        <div>지도를 불러오는 중...</div>
      )}
    </div>
  );
}
