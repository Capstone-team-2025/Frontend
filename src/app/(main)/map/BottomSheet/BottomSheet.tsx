"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  peekHeightPx?: number;
  fullRatio?: number;
  snapEpsilon?: number;
  allowDismiss?: boolean;
  defaultRatio?: number;
  className?: string;
  children: React.ReactNode;

  onVisibleHeightChange?: (px: number) => void;
  onDraggingChange?: (dragging: boolean) => void;
};

export default function BottomSheet({
  open,
  onOpenChange,
  peekHeightPx = 120,
  fullRatio = 1,
  snapEpsilon = 0.03,
  allowDismiss = false,
  defaultRatio,
  className,
  children,
  onVisibleHeightChange,
  onDraggingChange,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const vh = typeof window !== "undefined" ? window.innerHeight : 0;
  const COLLAPSE_ABS_THRESHOLD = 0.20;

  const [MIN, MAX] = useMemo(() => {
    const peek = clamp(peekHeightPx / Math.max(1, vh), 0.08, 0.25);
    const full = clamp(fullRatio, Math.max(peek + 0.3, 0.5), 0.99);
    return [peek, full];
  }, [peekHeightPx, fullRatio, vh]);

  const [ratio, setRatio] = useState<number>(
    clamp(defaultRatio ?? MIN, MIN, MAX)
  );
  const initRatioRef = useRef(ratio);
  const dragging = useRef(false);
  const startY = useRef(0);
  const lastY = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mounted || !onVisibleHeightChange) return;
    const px = open ? Math.round(ratio * vh) : 0;
    onVisibleHeightChange(px);
  }, [mounted, open, ratio, vh, onVisibleHeightChange]);

  useEffect(() => {
    if (!open) return;
    const r = clamp(defaultRatio ?? ratio ?? MIN, MIN, MAX);
    setRatio(r);
    initRatioRef.current = r;
    if (contentRef.current) {
      contentRef.current.style.overflow =
        r >= MAX - snapEpsilon ? "auto" : "hidden";
    }
  }, [open]);

  const onHandlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    onDraggingChange?.(true);
    startY.current = e.clientY;
    lastY.current = e.clientY;
    initRatioRef.current = ratio;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onHandlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dy = e.clientY - startY.current;
    lastY.current = e.clientY;

    const delta = -(dy / Math.max(1, vh));
    const next = clamp(initRatioRef.current + delta, MIN, MAX);

    onVisibleHeightChange?.(Math.round(next * vh));
    if (contentRef.current) {
      contentRef.current.style.overflow =
        next >= MAX - snapEpsilon ? "auto" : "hidden";
    }
    setRatio(next);
  };

  const onHandlePointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onDraggingChange?.(false);

    const draggedDown = (lastY.current - startY.current) > 6;

    const collapseThreshold = Math.max(MIN + 0.005, COLLAPSE_ABS_THRESHOLD);

    if (draggedDown && ratio <= collapseThreshold) {
      if (allowDismiss && ratio <= MIN + snapEpsilon) {
        onOpenChange(false); // 완전 닫기
        return;
      }
      setRatio(MIN); // 접기
      if (contentRef.current) contentRef.current.style.overflow = "hidden";
      return;
    }

    if (ratio >= MAX - snapEpsilon) {
      setRatio(MAX);
      if (contentRef.current) contentRef.current.style.overflow = "auto";
      return;
    }
  };

  const onContentPointerDown = (e: React.PointerEvent) => {
    if (ratio < MAX - snapEpsilon) {
      onHandlePointerDown(e);
      return;
    }
    startY.current = e.clientY;
    lastY.current = e.clientY;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onContentPointerMove = (e: React.PointerEvent) => {
    if (ratio < MAX - snapEpsilon) {
      e.preventDefault();
      onHandlePointerMove(e);
      return;
    }
    const el = contentRef.current;
    if (!el) return;

    const dy = e.clientY - lastY.current;
    const goingDown = dy > 0;

    if (el.scrollTop <= 0 && goingDown) {
      dragging.current = true;
      initRatioRef.current = ratio;
      el.style.overflow = "hidden";
      onHandlePointerMove(e);
      return;
    }
    lastY.current = e.clientY;
  };

  const onContentPointerUp = () => {
    if (dragging.current) onHandlePointerUp();
  };

  const onHandleClick = () => {
    const target = ratio >= MAX - snapEpsilon ? MIN : MAX;
    setRatio(target);
    if (contentRef.current) {
      contentRef.current.style.overflow =
        target >= MAX - snapEpsilon ? "auto" : "hidden";
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={clsx(
        "fixed left-0 right-0 bottom-0 z-[3] pointer-events-none will-change-transform"
      )}
      style={{
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition: dragging.current ? "none" : "transform 220ms cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <div
        className={clsx(
          "pointer-events-auto mx-auto w-full max-w-[425px] rounded-t-2xl bg-white shadow-xl",
          "flex flex-col",
          className
        )}
        style={{
          height: `calc(${ratio * 100}vh)`,
          transition: dragging.current ? "none" : "height 220ms cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <div
          className="w-full cursor-grab active:cursor-grabbing select-none pt-2 pb-1 flex justify-center touch-none shrink-0"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onClick={onHandleClick}
        >
          <div className="h-1.5 w-12 rounded-full bg-neutral-300" />
        </div>

        <div
          ref={contentRef}
          className="flex-1 min-h-0 overscroll-y-contain"
          style={{
            overflow: ratio >= MAX - snapEpsilon ? "auto" : "hidden",
          }}
          onPointerDown={onContentPointerDown}
          onPointerMove={onContentPointerMove}
          onPointerUp={onContentPointerUp}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}