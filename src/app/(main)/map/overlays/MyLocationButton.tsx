"use client";

type Props = {
  onClick: () => void;
  className?: string;
  mode?: "fixed" | "follow";
  bottomOffset?: number;
  baseBottomPx?: number;
  dragging?: boolean;
};

export default function MyLocationButton({ 
  onClick,
  className,
  mode = "fixed",
  bottomOffset = 0,
  baseBottomPx = 100,
  dragging = false,
}: Props) {
  const safe = "env(safe-area-inset-bottom, 0px)";
  const extra = mode === "follow" ? bottomOffset : 0;
  const bottom = `calc(${safe} + ${baseBottomPx + extra}px)`;

  return (
    <button
      aria-label="내 위치로 이동"
      onClick={onClick}
      className={
        "absolute left-5 z-20 bg-white p-2 border rounded-md shadow-sm " +
        (dragging ? "transition-none " : "transition-[bottom] duration-150 ") +
        (className ?? "")
      }
      style={{ bottom }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24">
        <path d="M11 2v2M11 20v2M2 11h2M20 11h2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      </svg>
    </button>
  );
}
