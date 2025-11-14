"use client";

import { useEffect, useState } from "react";
import type { Place } from "@/services/places";
import FavoriteButton from "@/components/button/FavoriteButton";

type Props = {
  place: Place;
  onOpenDetail?: (p: Place) => void;
  onBackToList?: () => void;
  favoritePlaceIds?: Set<string>;
  onToggleFavoritePlace?: (p: Place, next: boolean) => Promise<void> | void;
};

export default function PlaceDetailSheet({
  place,
  onOpenDetail,
  onBackToList: _onBackToList,
  favoritePlaceIds,
  onToggleFavoritePlace,
}: Props) {
  const computedActive = favoritePlaceIds
    ? favoritePlaceIds.has(String(place.placeId))
    : false;
  const [active, setActive] = useState<boolean>(computedActive);
  useEffect(
    () => setActive(computedActive),
    [computedActive, place.placeId]
  );

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          role="button"
          aria-label="상세 페이지 이동"
          onClick={() => onOpenDetail?.(place)}
        >
          <div className="flex items-center gap-3 mb-1">
            {place.storeLogo && (
              <img
                src={place.storeLogo}
                alt={
                  place.storeName
                    ? `${place.storeName} 로고`
                    : "매장 로고"
                }
                width={32}
                height={32}
                loading="lazy"
                className="w-8 h-8 rounded-md bg-neutral-100 object-contain"
              />
            )}
            <h3 className="text-lg font-semibold leading-tight">
              {place.placeName}
            </h3>
          </div>

          <div className="text-sm text-neutral-600">
            {place.roadAddressName || place.addressName}
            {typeof place.distance === "number" && (
              <span> · {(place.distance / 1000).toFixed(2)} km</span>
            )}
          </div>
        </div>

        <div
          className="shrink-0 ml-3"
          role="button"
          aria-label="즐겨찾기 토글"
        >
          <FavoriteButton
            className="mt-1"
            size={22}
            active={active}
            onChange={(next) => {
              setActive(next);
              onToggleFavoritePlace?.(place, next);
            }}
          />
        </div>
      </div>
    </div>
  );
}
