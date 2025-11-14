"use client";

import { useState } from "react";
import CategoryChips, { Chip } from "./CategoryChips";
import SearchLauncher from "./SearchLauncher";

const CATEGORIES: Chip[] = [
  { id: "cafe",    label: "카페",   iconSrc: "/images/category_icon/coffee.png" },
  { id: "CVS",     label: "편의점",   iconSrc: "/images/category_icon/grocery-Store.png" },
  { id: "food",    label: "식당",   iconSrc: "/images/category_icon/dining-room.png" }, 
  { id: "movie",   label: "영화",   iconSrc: "/images/category_icon/movie-projector.png" },
  { id: "shoping", label: "쇼핑/소매", iconSrc: "/images/category_icon/shopping-bag.png" },
  { id: "culture", label: "문화/여가", iconSrc: "/images/category_icon/culture.png" },
  { id: "hotel",   label: "호텔",  iconSrc: "/images/category_icon/hotel.png" },
  { id: "life",    label: "라이프",   iconSrc: "/images/category_icon/home.png" },
];

export default function MapOverlays({
  onCategoryChange,
  initialSelected = [],
}: {
  onCategoryChange: (ids: string[]) => void;
  initialSelected?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] p-3 space-y-2">
      <div className="pointer-events-auto">
        <SearchLauncher />
      </div>

      <div className="pointer-events-auto">
        <CategoryChips
          items={CATEGORIES}
          selectedIds={selected}
          onToggle={(_, next) => {
            setSelected(next);
            onCategoryChange(next);
          }}
          singleSelect
          className="max-w-[90vw] mx-auto"
        />
      </div>
    </div>
  );
}
