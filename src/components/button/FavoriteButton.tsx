"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";

type FavoriteButtonProps = {
  active?: boolean;
  onChange?: (next: boolean) => Promise<void> | void;
  size?: number;
  stopPropagation?: boolean;
  className?: string;
  ariaLabel?: string;
};

export default function FavoriteButton({
  active = false,
  onChange,
  size = 22,
  stopPropagation = true,
  className,
  ariaLabel = "관심",
}: FavoriteButtonProps) {
  const [checked, setChecked] = useState(active);
  const [loading, setLoading] = useState(false);

  useEffect(() => setChecked(active), [active]);

  const toggle = useCallback(
    async (e?: React.MouseEvent) => {
      if (stopPropagation && e) e.stopPropagation();
      if (loading) return;
      const next = !checked;
      setChecked(next);
      try {
        setLoading(true);
        await onChange?.(next);
      } catch (err) {
        setChecked(!next);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [checked, loading, onChange, stopPropagation]
  );

  const iconSrc = checked
    ? "/images/button_Icon/favorite-a.png"
    : "/images/button_Icon/favorite.png";

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={checked}
      disabled={loading}
      onClick={toggle}
      className={clsx(
        "inline-flex items-center justify-center transition-transform active:scale-95",
        loading && "opacity-60",
        className
      )}
      style={{ width: size, height: size }}
      data-nodrag
    >
      <img
        src={iconSrc}
        alt={ariaLabel}
        width={size}
        height={size}
        draggable={false}
      />
    </button>
  );
}
