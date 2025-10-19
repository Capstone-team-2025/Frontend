"use client";

type Props = {
  onClick: () => void;
  className?: string;
};

export default function MyLocationButton({ onClick, className }: Props) {
  return (
    <button
      aria-label="내 위치로 이동"
      onClick={onClick}
      className={
        "absolute bottom-25  left-5 z-20 bg-white p-2 border " +
        (className ?? "")
      }
    >
      <svg width="22" height="22" viewBox="0 0 24 24">
        <path d="M11 2v2M11 20v2M2 11h2M20 11h2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="12" cy="12" r="1.8" fill="currentColor"/>
      </svg>
    </button>
  );
}
