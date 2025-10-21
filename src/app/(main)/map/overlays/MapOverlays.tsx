"use client";

import { useState } from "react";
import CategoryChips, { Chip } from "./CategoryChips";
import SearchLauncher from "./SearchLauncher";

const CATEGORIES: Chip[] = [
  { id: "food",    label: "식음료",   iconSrc: "/images/category_icon/dining-room.png" },
  { id: "shop",    label: "쇼핑/소매", iconSrc: "/images/category_icon/shopping-bag.png" },
  { id: "culture", label: "문화/여가", iconSrc: "/images/category_icon/movie-projector.png" },
  { id: "mobility",label: "모빌리티",  iconSrc: "/images/category_icon/taxi.png" },
  { id: "life",    label: "라이프",   iconSrc: "/images/category_icon/home.png" },
  { id: "travel",  label: "여행",     iconSrc: "/images/category_icon/world-map.png" },
  { id: "etc",     label: "기타",     iconSrc: "/images/category_icon/ellipsis.png" },
];

export default function MapOverlays({
  onCategoryChange,
}: {
  onCategoryChange: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(["food"]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] p-3 space-y-2">
      <div className="pointer-events-auto">
        <SearchLauncher />
      </div>

      <div className="pointer-events-auto">
        <CategoryChips
          items={CATEGORIES}
          selectedIds={selected}
          onToggle={(_, next) => { setSelected(next); onCategoryChange(next); }}
          singleSelect={false}
        />
      </div>
    </div>
  );
}
