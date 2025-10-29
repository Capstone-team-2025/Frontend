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
  anchorRef?: React.RefObject<HTMLDivElement | null>;
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
  anchorRef,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const vh = typeof window !== "undefined" ? window.innerHeight : 0;

  const COLLAPSE_ABS_THRESHOLD = 0.2;

  const [MIN, MAX] = useMemo(() => {
    const peek = clamp(peekHeightPx / Math.max(1, vh), 0.08, 0.25);
    const full = clamp(fullRatio, Math.max(peek + 0.3, 0.5), 0.99);
    return [peek, full];
  }, [peekHeightPx, fullRatio, vh]);

  const [ratio, setRatio] = useState<number>(clamp(defaultRatio ?? MIN, MIN, MAX));
  const ratioRef = useRef(ratio);
  useEffect(() => { ratioRef.current = ratio; }, [ratio]);

  const dragging = useRef(false);
  const movedRef = useRef(false);
  const startY = useRef(0);
  const startX = useRef(0);
  const lastY = useRef(0);
  const initRatioRef = useRef(ratio);
  const verticalOnlyRef = useRef(false);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mounted || !onVisibleHeightChange) return;
    const px = open ? Math.round(ratioRef.current * vh) : 0;
    onVisibleHeightChange(px);
  }, [mounted, open, vh, onVisibleHeightChange]);

  useEffect(() => {
    if (!open) return;
    const r = clamp(defaultRatio ?? ratioRef.current ?? MIN, MIN, MAX);
    setRatio(r);
    ratioRef.current = r;
    initRatioRef.current = r;
    if (contentRef.current) {
      contentRef.current.style.overflow = r >= MAX - snapEpsilon ? "auto" : "hidden";
    }
    dragging.current = false;
    movedRef.current = false;
    verticalOnlyRef.current = false;
    onDraggingChange?.(false);
  }, [open]);

  const setSheetByDeltaY = (dy: number) => {
    const delta = -(dy / Math.max(1, vh));
    const next = clamp(initRatioRef.current + delta, MIN, MAX);
    onVisibleHeightChange?.(Math.round(next * vh));
    if (contentRef.current) {
      contentRef.current.style.overflow = next >= MAX - snapEpsilon ? "auto" : "hidden";
    }
    setRatio(next);
    ratioRef.current = next;
  };

  const DRAG_THRESHOLD_PX = 6;

  const onAnyPointerDown = (e: React.PointerEvent) => {
    if (!open) return;

    dragging.current = true;
    movedRef.current = false;
    verticalOnlyRef.current = false;
    onDraggingChange?.(true);

    startY.current = e.clientY;
    startX.current = e.clientX;
    lastY.current = e.clientY;
    initRatioRef.current = ratioRef.current;

    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onAnyPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;

    const dy = e.clientY - startY.current;
    const dx = e.clientX - startX.current;

    if (!verticalOnlyRef.current) {
      if (Math.abs(dx) > Math.abs(dy)) {
        dragging.current = false;
        onDraggingChange?.(false);
        return;
      } else {
        verticalOnlyRef.current = true;
      }
    }

    const frameDy = e.clientY - lastY.current;

    const nextProbe = clamp(initRatioRef.current - (dy / Math.max(1, vh)), MIN, MAX);

    if (nextProbe < MAX - snapEpsilon) {
      e.preventDefault();
      setSheetByDeltaY(dy);
      lastY.current = e.clientY;
      if (!movedRef.current && Math.abs(dy) > DRAG_THRESHOLD_PX) movedRef.current = true;
      return;
    }

    const el = contentRef.current;
    if (!el) { lastY.current = e.clientY; return; }

    if (el.scrollTop <= 0 && frameDy > 0) {
      e.preventDefault();
      el.style.overflow = "hidden";
      setSheetByDeltaY(dy);
      lastY.current = e.clientY;
      if (!movedRef.current && Math.abs(dy) > DRAG_THRESHOLD_PX) movedRef.current = true;
      return;
    }
    lastY.current = e.clientY;
  };

  const onAnyPointerUp = () => {
    if (!dragging.current) return;

    dragging.current = false;
    onDraggingChange?.(false);

    const draggedDown = (lastY.current - startY.current) > DRAG_THRESHOLD_PX;
    const collapseThreshold = Math.max(MIN + 0.005, COLLAPSE_ABS_THRESHOLD);

    if (draggedDown && ratioRef.current <= collapseThreshold) {
      if (allowDismiss && ratioRef.current <= MIN - 1e-6 + snapEpsilon) {
        onOpenChange(false);
        return;
      }
      setRatio(MIN);
      ratioRef.current = MIN;
      if (contentRef.current) contentRef.current.style.overflow = "hidden";
      return;
    }

    if (ratioRef.current >= MAX - snapEpsilon) {
      setRatio(MAX);
      ratioRef.current = MAX;
      if (contentRef.current) contentRef.current.style.overflow = "auto";
      return;
    }
  };

  const onHandleClick = () => {
    const target = ratioRef.current >= MAX - snapEpsilon ? MIN : MAX;
    setRatio(target);
    ratioRef.current = target;
    if (contentRef.current) {
      contentRef.current.style.overflow = target >= MAX - snapEpsilon ? "auto" : "hidden";
    }
  };

  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!anchorRef?.current) {
      setAnchorRect(null);
      return;
    }
    const el = anchorRef.current;

    const update = () => setAnchorRect(el.getBoundingClientRect());
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [anchorRef]);

  if (!mounted) return null;

  const fixedStyle = anchorRect
    ? {
        position: "fixed" as const,
        left: `${Math.round(anchorRect.left + window.scrollX)}px`,
        width: `${Math.round(anchorRect.width)}px`,
        bottom: "0px",
      }
    : {
        position: "fixed" as const,
        left: 0,
        right: 0,
        bottom: 0,
      };

  return createPortal(
    <div
      className={clsx("z-[2] pointer-events-auto", className)}
      style={{
        WebkitTapHighlightColor: "transparent",
        touchAction: "none",
        ...fixedStyle,
      }}
    >
      <div
        className="mx-auto w-full max-w-[720px] bg-white rounded-t-2xl shadow-[0_-6px_24px_rgba(0,0,0,0.15)] flex flex-col"
        style={{
          height: open ? Math.round(ratioRef.current * vh) : 0,
          transition: dragging.current ? "none" : "height 220ms cubic-bezier(.2,.8,.2,1)",
          overflow: "hidden",
        }}
      >
        <div
          className="relative w-full shrink-0"
          style={{ height: 28, touchAction: "none", cursor: "grab" }}
          onPointerDown={onAnyPointerDown}
          onPointerMove={onAnyPointerMove}
          onPointerUp={onAnyPointerUp}
          onPointerCancel={onAnyPointerUp}
          onPointerLeave={() => { if (dragging.current) onAnyPointerUp(); }}
          onClick={onHandleClick}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-1.5 w-12 rounded-full bg-neutral-300" />
          </div>
        </div>

        <div
          ref={contentRef}
          className="flex-1 min-h-0"
          style={{
            overflow: ratioRef.current >= MAX - snapEpsilon ? "auto" : "hidden",
            overscrollBehavior: "contain",
            touchAction: "none",
          }}
          onPointerDown={onAnyPointerDown}
          onPointerMove={onAnyPointerMove}
          onPointerUp={onAnyPointerUp}
          onPointerCancel={onAnyPointerUp}
          onPointerLeave={() => { if (dragging.current) onAnyPointerUp(); }}
          onClickCapture={(e) => {
            if (movedRef.current) {
              e.preventDefault();
              e.stopPropagation();
              movedRef.current = false;
            }
          }}
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
