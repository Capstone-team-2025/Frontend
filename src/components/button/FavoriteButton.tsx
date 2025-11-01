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

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={checked}
      disabled={loading}
      onClick={toggle}
      className={clsx(
        "inline-flex items-center justify-center transition-transform active:scale-95",
        "text-rose-500",
        loading && "opacity-60",
        className
      )}
      style={{ width: size, height: size }}
      data-nodrag
    >
      {checked ? (
        <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
          <path d="M12 21s-6.716-4.31-9.293-7.09C.83 11.91 1.09 8.7 3.32 6.92a5.5 5.5 0 0 1 7.36.62l1.32 1.49 1.32-1.49a5.5 5.5 0 0 1 7.36-.62c2.23 1.78 2.49 4.99.61 6.99C18.716 16.69 12 21 12 21z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
          <path
            d="M12 21s-6.716-4.31-9.293-7.09C.83 11.91 1.09 8.7 3.32 6.92a5.5 5.5 0 0 1 7.36.62L12 9.03l1.32-1.49a5.5 5.5 0 0 1 7.36-.62c2.23 1.78 2.49 4.99.61 6.99C18.716 16.69 12 21 12 21z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
