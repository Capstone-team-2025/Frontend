"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export type Chip = {
  id: string;
  label: string;
  iconSrc: string;
  iconSrcActive?: string;
  iconAlt?: string;
  iconSize?: number;
};

const withSuffixBeforeExt = (path: string, suffix = "-a") => path.replace(/(?=\.[^.]+$)/, suffix);

type Props = {
  items: Chip[];
  selectedIds: string[];
  onToggle: (id: string, nextSelected: string[]) => void;
  singleSelect?: boolean;
  className?: string;
};

export default function CategoryChips({
  items,
  selectedIds,
  onToggle,
  singleSelect = false,
  className = "",
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x: number; sx: number; moved: boolean } | null>(null);
  const DRAG_THRESHOLD = 6;

  const start = (clientX: number) => {
    if (!boxRef.current) return;
    setDrag({ x: clientX, sx: boxRef.current.scrollLeft, moved: false });
  };
  const move = (clientX: number) => {
    if (!boxRef.current || !drag) return;
    const delta = clientX - drag.x;
    if (Math.abs(delta) > DRAG_THRESHOLD && !drag.moved) setDrag({ ...drag, moved: true });
    boxRef.current.scrollLeft = drag.sx - delta;
  };
  const end = () => setDrag(null);

  const isSelected = (id: string) => selectedIds.includes(id);

  const handleChipClick = (id: string) => {
    if (drag?.moved) return; // 드래그로 판정되면 클릭 무시
    let next: string[];
    if (singleSelect) next = isSelected(id) ? [] : [id];
    else next = isSelected(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    onToggle(id, next);
  };

  return (
    <div
      ref={boxRef}
      className={`w-full overflow-x-auto no-scrollbar select-none ${className}`}
      style={{ touchAction: "pan-x" }}
      onWheel={(e) => {
        if (!boxRef.current) return;
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) boxRef.current.scrollLeft += e.deltaY;
      }}
      onMouseDown={(e) => start(e.clientX)}
      onMouseMove={(e) => drag && move(e.clientX)}
      onMouseUp={end}
      onMouseLeave={end}
      onTouchStart={(e) => start(e.touches[0].clientX)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
      onTouchEnd={end}
      aria-label="카테고리 선택"
      role="group"
    >
      <div className="flex flex-nowrap gap-2 px-2 py-2">
        {items.map((it) => {
          const active = isSelected(it.id);
          const size = it.iconSize ?? 22;
          const src = active
            ? (it.iconSrcActive ?? withSuffixBeforeExt(it.iconSrc, "-a"))
            : it.iconSrc;

          return (
            <button
              key={it.id}
              type="button"
              onClick={() => handleChipClick(it.id)}
              className={[
                "inline-flex flex-row items-center flex-none shrink-0 whitespace-nowrap min-w-max",
                "h-10 px-4 gap-2 rounded-full border shadow-sm",
                "text-[15px] leading-5",
                active
                  ? "bg-[#FF5F3F] text-white font-bold border-[#FF8F79]"
                  : "bg-white text-neutral-800 border-neutral-200",
              ].join(" ")}
              aria-pressed={active}
            >
              <span className="inline-flex flex-row items-center gap-2 whitespace-nowrap break-keep">
                <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                  <Image
                    src={src}
                    alt={it.iconAlt ?? it.label}
                    width={size}
                    height={size}
                    sizes={`${size}px`}
                  />
                </span>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}