"use client";

import type { Place } from "@/services/places";
import FavoriteButton from "@/components/button/FavoriteButton";

type Store = {
  storeId?: number;
  name: string;
  category?: string;
  div2Category?: string;
};

type Props = {
  store: Store;
  places?: Place[];
  selected?: Place;
  onSelect?: (p: Place) => void;
  onViewOnMap?: (s: Store) => void;
  favoritePlaceIds?: Set<string>;
  onToggleFavoritePlace?: (p: Place, next: boolean) => Promise<void> | void;
};

export default function StoreBottomSheet({
  store,
  places = [],
  selected,
  onSelect,
  onViewOnMap,
  favoritePlaceIds,
  onToggleFavoritePlace,
}: Props) {
  const logoUrl =
    places.length > 0 ? places[0]?.storeLogo : undefined;

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-3 shrink-0">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={`${store.name} 로고`}
            width={32}
            height={32}
            loading="lazy"
            className="w-8 h-8 rounded-md bg-neutral-100 object-contain"
          />
        )}
        <div className="text-lg font-semibold">{store.name}</div>
      </div>

      <div className="mt-4 flex-1 min-h-0 overflow-y-auto divide-y overscroll-contain pb-[calc(var(--tabbar-h,72px)+env(safe-area-inset-bottom))]">
        {places.length === 0 && (
          <div className="py-10 text-center text-neutral-500">
            주변 2km 내 지점이 없습니다.
          </div>
        )}
        {places.map((p) => (
          <div
            key={p.placeId}
            className="py-3 flex items-start gap-3 cursor-pointer"
            onClick={() => onSelect?.(p)}
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium">{p.placeName}</div>
              <div className="text-sm text-neutral-600">
                {p.roadAddressName || p.addressName}
              </div>
              {typeof p.distance === "number" && (
                <div className="text-xs text-neutral-500 mt-0.5">
                  {(p.distance / 1000).toFixed(2)} km
                </div>
              )}
            </div>
            <div
              className="shrink-0 mt-1"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              role="button"
              aria-label="즐겨찾기 토글"
            >
              <FavoriteButton
                className="shrink-0 mt-1"
                size={22}
                active={
                  favoritePlaceIds
                    ? favoritePlaceIds.has(String(p.placeId))
                    : false
                }
                onChange={(next) => onToggleFavoritePlace?.(p, next)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
