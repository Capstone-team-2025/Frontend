"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  const COLLAPSE_ABS_THRESHOLD = 0.2;

  const [MIN, MAX] = useMemo(() => {
    const peek = clamp(peekHeightPx / Math.max(1, vh), 0.08, 0.25);
    const full = clamp(fullRatio, Math.max(peek + 0.3, 0.5), 0.99);
    return [peek, full];
  }, [peekHeightPx, fullRatio, vh]);

  const [ratio, setRatio] = useState<number>(clamp(defaultRatio ?? MIN, MIN, MAX));

  // 드래그/제스처 상태
  const dragging = useRef(false);
  const movedRef = useRef(false);
  const startY = useRef(0);
  const startX = useRef(0);
  const lastY = useRef(0);
  const initRatioRef = useRef(ratio);
  const verticalOnlyRef = useRef(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // touch-action 동적 전환
  const allowDragAnywhereRef = useRef(true);
  const updateTouchAction = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const atMax = ratio >= MAX - snapEpsilon;
    const atTop = el.scrollTop <= 0;
    const allowDrag = !atMax || atTop;
    allowDragAnywhereRef.current = allowDrag;
    el.style.touchAction = allowDrag ? "none" : "pan-y";
  }, [ratio, MAX, snapEpsilon]);

  // 콜백: 가시 높이 픽셀
  useEffect(() => {
    if (!mounted || !onVisibleHeightChange) return;
    const px = open ? Math.round(ratio * vh) : 0;
    onVisibleHeightChange(px);
  }, [mounted, open, ratio, vh, onVisibleHeightChange]);

  // open/ratio 바뀔 때 touch-action 동기화
  useEffect(() => {
    if (!open) return;
    updateTouchAction();
  }, [open, updateTouchAction]);

  // open 변경 시 초기화
  useEffect(() => {
    if (!open) return;
    const r = clamp(defaultRatio ?? ratio ?? MIN, MIN, MAX);

    if (Math.abs(r - ratio) > 1e-6) {
      setRatio(r);
    }
    initRatioRef.current = r;

    if (contentRef.current) {
      contentRef.current.style.overflow = r >= MAX - snapEpsilon ? "auto" : "hidden";
    }
  }, [open, defaultRatio, ratio, MIN, MAX, snapEpsilon]);

  const DRAG_THRESHOLD_PX = 6;

  // 공통: 시트 높이 갱신
  const setSheetByDeltaY = (dy: number) => {
    const delta = -(dy / Math.max(1, vh));
    const next = clamp(initRatioRef.current + delta, MIN, MAX);
    onVisibleHeightChange?.(Math.round(next * vh));
    if (contentRef.current) {
      contentRef.current.style.overflow = next >= MAX - snapEpsilon ? "auto" : "hidden";
    }
    setRatio(next);
    // 높이 바뀌면 제스처 라우팅 재결정
    updateTouchAction();
  };

  // 드래그 시작: 시트 어디에서나 가능
  const onAnyPointerDown = (e: React.PointerEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/i.test(tag)) return;
    movedRef.current = false;
    verticalOnlyRef.current = false;
    startY.current = e.clientY;
    startX.current = e.clientX;
    lastY.current = e.clientY;
    initRatioRef.current = ratio;
  };

  const onAnyPointerMove = (e: React.PointerEvent) => {
    if (startY.current === 0 && startX.current === 0) return;
    const dy = e.clientY - startY.current;
    const dx = e.clientX - startX.current;

    // 수평 제스처 → 취소
    if (!verticalOnlyRef.current) {
      if (Math.abs(dx) > Math.abs(dy)) {
        const el = e.currentTarget as HTMLElement;
        if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
        startY.current = 0;
        startX.current = 0;
        return;
      } else {
        verticalOnlyRef.current = true;
      }
    }

    // 임계값 전 → 클릭 후보: 아무것도 막지 않음
    if (!movedRef.current && Math.abs(dy) < DRAG_THRESHOLD_PX) {
      lastY.current = e.clientY;
      return;
    }

    // 임계값 돌파 순간 → 드래그 시작
    if (!movedRef.current) {
      movedRef.current = true;
      dragging.current = true;
      onDraggingChange?.(true);
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      updateTouchAction(); // 드래그 시작 시점 동기화
    }

    // 드래그 중: 기본 제스처 차단
    e.preventDefault();

    const frameDy = e.clientY - lastY.current;

    // 시트가 최대 미만 → 항상 시트 높이 변경
    if (ratio < MAX - snapEpsilon) {
      setSheetByDeltaY(dy);
      lastY.current = e.clientY;
      return;
    }

    // 최대 상태: 내부 스크롤 우선. 다만 맨 위에서 아래로 당기면 시트 축소로 핸드오프
    const el = contentRef.current;
    if (!el) { lastY.current = e.clientY; return; }

    if (el.scrollTop <= 0 && frameDy > 0) {
      el.style.overflow = "hidden";
      setSheetByDeltaY(dy);
      updateTouchAction(); // 핸드오프 시점 동기화
      lastY.current = e.clientY;
      return;
    }

    // 그 외엔 내부 스크롤 유지
    lastY.current = e.clientY;
  };

  // 드래그 종료: 스냅/정리
  const onAnyPointerUp = (e?: React.PointerEvent) => {
    // 캡처 해제
    if (e && (e.currentTarget as HTMLElement).hasPointerCapture?.(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }

    const didDrag = movedRef.current;
    const draggedDown = (lastY.current - startY.current) > DRAG_THRESHOLD_PX;

    // 세션 리셋은 계산 후
    movedRef.current = false;
    verticalOnlyRef.current = false;
    startY.current = 0;
    startX.current = 0;

    if (!didDrag) return; // 클릭은 통과

    // 드래그 종료 처리
    dragging.current = false;
    onDraggingChange?.(false);

    const collapseThreshold = Math.max(MIN + 0.005, COLLAPSE_ABS_THRESHOLD);

    if (draggedDown && ratio <= collapseThreshold) {
      if (allowDismiss && ratio <= MIN - 1e-6 + snapEpsilon) {
        onOpenChange(false);
        updateTouchAction();
        return;
      }
      setRatio(MIN);
      if (contentRef.current) contentRef.current.style.overflow = "hidden";
      updateTouchAction();
      return;
    }

    if (ratio >= MAX - snapEpsilon) {
      setRatio(MAX);
      if (contentRef.current) contentRef.current.style.overflow = "auto";
    }
    updateTouchAction(); // 종료 후 최종 상태 반영
  };

  // 콘텐츠 스크롤 시 touch-action 재평가
  const onContentScroll = () => {
    updateTouchAction();
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
        {/* 시각용 핸들(드래그는 전체 영역에서 처리) */}
        <div
          className="relative w-full shrink-0"
          style={{ height: 28, touchAction: "none" }}
          onPointerDown={onAnyPointerDown}
          onPointerMove={onAnyPointerMove}
          onPointerUp={onAnyPointerUp}
          onPointerCancel={onAnyPointerUp}
          onPointerLeave={() => { if (dragging.current) onAnyPointerUp(); }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-1.5 w-12 rounded-full bg-neutral-300" />
          </div>
        </div>

        {/* 전체 영역 드래그 + MAX에서 스크롤/핸드오프 */}
        <div
          ref={contentRef}
          className="flex-1 min-h-0"
          style={{
            overflow: ratio >= MAX - snapEpsilon ? "auto" : "hidden",
            overscrollBehavior: "contain",
          }}
          onScroll={onContentScroll}
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
