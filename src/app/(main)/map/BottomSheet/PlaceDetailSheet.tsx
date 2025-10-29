"use client";

import { useEffect, useState } from "react";
import type { Place } from "@/services/places";
import FavoriteButton from "@/components/button/FavoriteButton";

type Props = {
  place: Place;
  onBackToList?: () => void;
  favoritePlaceIds?: Set<string>;
  onToggleFavoritePlace?: (p: Place, next: boolean) => Promise<void> | void;
};

export default function PlaceDetailSheet({
  place,
  onBackToList,
  favoritePlaceIds,
  onToggleFavoritePlace,
}: Props) {
  const computedActive = favoritePlaceIds ? favoritePlaceIds.has(String(place.placeId)) : false;
  const [active, setActive] = useState<boolean>(computedActive);
  useEffect(() => setActive(computedActive), [computedActive, place.placeId]);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold leading-tight">{place.placeName}</h3>
          <div className="text-sm text-neutral-600">
            {place.roadAddressName || place.addressName}
            {typeof place.distance === "number" && (
              <span> · {(place.distance / 1000).toFixed(2)} km</span>
            )}
          </div>
        </div>

        <div className="shrink-0 ml-3" role="button" aria-label="즐겨찾기 토글">
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
