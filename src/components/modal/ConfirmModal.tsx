"use client";

import type { ReactNode } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "pink" | "black";
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
};

export default function ConfirmModal({
  open,
  title,
  confirmText = "확인",
  cancelText = "취소",
  confirmColor = "pink",
  onConfirm,
  onClose,
  children,
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmBtnHover =
    confirmColor === "pink"
      ? "hover:bg-[#FB4E6F] hover:text-white"
      : "hover:bg-black hover:text-white";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-[320px] bg-white rounded-2xl shadow-lg p-5 pt-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[19px] font-bold mb-3">{title}</h2>

        {children && (
          <div className="mb-4 text-[14px] text-neutral-700 text-left">
            {children}
          </div>
        )}

        <div className="flex justify-center gap-3 text-[16px]">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border-0 text-gray-400 font-semibold "
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-xl font-semibold text-gray-400 border-0 transition-colors ${confirmBtnHover}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
