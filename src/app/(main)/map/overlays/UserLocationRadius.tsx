"use client";

import { MapMarker, Circle } from "react-kakao-maps-sdk";

type Size = { width: number; height: number };

export type UserLocationRadiusProps = {
  center: { lat: number; lng: number };

  /** 표시 토글 */
  showCircle?: boolean;
  showMarker?: boolean;

  /** 마커 관련 */
  markerSrc?: string;
  markerSize?: Size;
  markerTailPad?: number;

  /** 원(반경) 관련 */
  radiusMeters?: number;
  circleStyle?: {
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number; // 0~1
    fillColor?: string;
    fillOpacity?: number;   // 0~1
  };

  /** z-index */
  zIndex?: number;
};

export default function UserLocationRadius({
  center,

  showCircle = false,
  showMarker = true,

  markerSrc = "/images/MapMarker/myloc.png",
  markerSize = { width: 60, height: 90 },
  markerTailPad = 6,

  radiusMeters = 500,
  circleStyle = {
    strokeWeight: 2,
    strokeColor: "#8A84FF",
    strokeOpacity: 0.8,
    fillColor: "#8A84FF",
    fillOpacity: 0.15,
  },

  zIndex = 5,
}: UserLocationRadiusProps) {
  const offset = {
    x: Math.round(markerSize.width / 2),
    y: Math.round(markerSize.height - markerTailPad),
  };

  return (
    <>
      {/* 반경 원 (옵션) */}
      {showCircle && (
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
      )}

      {/* 현재 위치 마커 */}
      {showMarker && (
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
      )}
    </>
  );
}
