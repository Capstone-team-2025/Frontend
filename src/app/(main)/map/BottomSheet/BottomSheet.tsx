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
  const verticalOnlyRef = useRef(false); // 수평 제스처 무시

  const contentRef = useRef<HTMLDivElement>(null);

  // 콜백: 가시 높이 픽셀
  useEffect(() => {
    if (!mounted || !onVisibleHeightChange) return;
    const px = open ? Math.round(ratio * vh) : 0;
    onVisibleHeightChange(px);
  }, [mounted, open, ratio, vh, onVisibleHeightChange]);

  // open 변경 시 초기화
  useEffect(() => {
    if (!open) return;
    const r = clamp(defaultRatio ?? ratio ?? MIN, MIN, MAX);
    setRatio(r);
    initRatioRef.current = r;
    if (contentRef.current) {
      contentRef.current.style.overflow = r >= MAX - snapEpsilon ? "auto" : "hidden";
    }
  }, [open]);

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
  };

  // ===== 드래그 시작: 시트 어디에서나 가능 =====
  const onAnyPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    movedRef.current = false;
    verticalOnlyRef.current = false;
    onDraggingChange?.(true);
    startY.current = e.clientY;
    startX.current = e.clientX;
    lastY.current = e.clientY;
    initRatioRef.current = ratio;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onAnyPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;

    const dy = e.clientY - startY.current;
    const dx = e.clientX - startX.current;

    // 수평 제스처 무시: |dx| > |dy| 이면 드래그 취소 (클릭 그대로 통과)
    if (!verticalOnlyRef.current) {
      if (Math.abs(dx) > Math.abs(dy)) {
        dragging.current = false;
        onDraggingChange?.(false);
        return;
      } else {
        verticalOnlyRef.current = true;
      }
    }

    if (!movedRef.current && Math.abs(dy) > DRAG_THRESHOLD_PX) movedRef.current = true;

    // ✅ 프레임 기준 이동량을 lastY 갱신 전에 계산해야 함!
    const frameDy = e.clientY - lastY.current;

    // (1) 중간 상태: 어디서든 시트 드래그
    if (ratio < MAX - snapEpsilon) {
      e.preventDefault();              // 콘텐츠 스크롤/브라우저 제스처 차단
      setSheetByDeltaY(dy);            // dy는 시작점 대비 누적 이동
      lastY.current = e.clientY;       // ← 마지막에 갱신
      return;
    }

    // (2) MAX 상태: 기본은 내부 스크롤
    const el = contentRef.current;
    if (!el) {
      lastY.current = e.clientY;
      return;
    }

    // 스크롤이 최상단이고, "아래"로 드래그하는 프레임이면 → 시트 축소로 핸드오프
    if (el.scrollTop <= 0 && frameDy > 0) {
      e.preventDefault();
      el.style.overflow = "hidden";    // 콘텐츠 스크롤 잠시 꺼두고
      setSheetByDeltaY(dy);            // 시트 드래그로 전환
      lastY.current = e.clientY;
      return;
    }

    // 그 외엔 내부 스크롤 유지 (시트 높이 고정)
    lastY.current = e.clientY;
  };

  // ===== 드래그 종료: 스냅/정리 =====
  const onAnyPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onDraggingChange?.(false);

    const draggedDown = (lastY.current - startY.current) > DRAG_THRESHOLD_PX;
    const collapseThreshold = Math.max(MIN + 0.005, COLLAPSE_ABS_THRESHOLD);

    if (draggedDown && ratio <= collapseThreshold) {
      if (allowDismiss && ratio <= MIN - 1e-6 + snapEpsilon) {
        onOpenChange(false);
        return;
      }
      setRatio(MIN);
      if (contentRef.current) contentRef.current.style.overflow = "hidden";
      return;
    }

    if (ratio >= MAX - snapEpsilon) {
      setRatio(MAX);
      if (contentRef.current) contentRef.current.style.overflow = "auto";
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
            // 모바일 제스처 간섭 방지: 시트 전체를 수직 제스처 우선으로
            touchAction: "none",
          }}
          // “어디서든” 드래그 시작
          onPointerDown={onAnyPointerDown}
          onPointerMove={onAnyPointerMove}
          onPointerUp={onAnyPointerUp}
          onPointerCancel={onAnyPointerUp}
          onPointerLeave={() => { if (dragging.current) onAnyPointerUp(); }}
          // 드래그가 있었다면 그 세션의 클릭(탭)은 무시 → 유령 클릭 방지
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
