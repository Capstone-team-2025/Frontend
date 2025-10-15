"use client";

import { MapMarker, Circle } from "react-kakao-maps-sdk";

type Size = { width: number; height: number };

export type UserLocationRadiusProps = {
  center: { lat: number; lng: number };
  markerSrc?: string;
  markerSize?: Size;        // 마커 사이즈
  markerTailPad?: number;   // 핀 끝 여유
  radiusMeters?: number;    // 원형 영역 반경(m)
  zIndex?: number;
  circleStyle?: {
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number; // 0~1
    fillColor?: string;
    fillOpacity?: number;   // 0~1
  };
};

export default function UserLocationRadius({
  center,
  markerSrc = "/images/MapMarker.png",
  markerSize = { width: 50, height: 59 },
  markerTailPad = 6,
  radiusMeters = 500,
  zIndex = 5,
  circleStyle = {
    strokeWeight: 2,
    strokeColor: "#8A84FF",
    strokeOpacity: 0.8,
    fillColor: "#8A84FF",
    fillOpacity: 0.15,
  },
}: UserLocationRadiusProps) {
  const offset = {
    x: Math.round(markerSize.width / 2),
    y: Math.round(markerSize.height - markerTailPad),
  };

  return (
    <>
      {/* 반경 원 */}
      <Circle
        center={center}
        radius={radiusMeters}
        strokeWeight={circleStyle.strokeWeight}
        strokeColor={circleStyle.strokeColor}
        strokeOpacity={circleStyle.strokeOpacity}
        fillColor={circleStyle.fillColor}
        fillOpacity={circleStyle.fillOpacity}
        zIndex={zIndex}
      />

      {/* 현재 위치 마커 */}
      <MapMarker
        position={center}
        title="내 위치"
        zIndex={zIndex + 1}
        image={{
          src: markerSrc,
          size: markerSize,
          options: { offset },
        }}
      />
    </>
  );
}
