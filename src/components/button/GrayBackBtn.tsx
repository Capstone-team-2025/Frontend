"use client";

import Image from "next/image";
import { MouseEventHandler } from "react";

type Props = {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  size?: number;
  iconSize?: number;
  className?: string;
  ariaLabel?: string;
};

export default function GrayBackBtn({
  onClick,
  size = 40,
  iconSize = 20,
  className = "",
  ariaLabel = "뒤로",
}: Props) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        "rounded-full flex items-center justify-center",
        "hover:bg-neutral-100 active:bg-neutral-200",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/back-btn-gray.png"
        alt=""
        width={iconSize}
        height={iconSize}
        draggable={false}
        className="pointer-events-none select-none"
        priority={false}
      />
    </button>
  );
}
