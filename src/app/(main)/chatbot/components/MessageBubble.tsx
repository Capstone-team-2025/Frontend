"use client";

import React from "react";
import clsx from "clsx";

export type BubbleSender = "user" | "ai" | "typing";

interface MessageBubbleProps {
  sender: BubbleSender;
  message?: string;
}

export default function MessageBubble({ sender, message }: MessageBubbleProps) {
  const isRight = sender === "user";

  return (
    <div
      className={clsx(
        "flex w-full mb-3",
        isRight ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={clsx(
          "px-3 py-2 rounded-2xl text-sm max-w-[70%]",
          "whitespace-pre-wrap break-words",
          "max-h-60 overflow-y-auto no-scrollbar",
          isRight
            ? "bg-gray-100 rounded-br-none"
            : sender === "typing"
            ? "bg-gray-50 text-gray-600 rounded-bl-none"
            : "bg-gray-100 rounded-bl-none"
        )}
      >
        {sender === "typing" ? (
          <span className="inline-flex gap-1">
            <i className="animate-bounce">•</i>
            <i className="animate-bounce [animation-delay:120ms]">•</i>
            <i className="animate-bounce [animation-delay:240ms]">•</i>
          </span>
        ) : (
          message ?? ""
        )}
      </div>
    </div>
  );
}
