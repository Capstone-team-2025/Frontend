"use client";

import React from "react";
import clsx from "clsx";

interface MessageBubbleProps {
  message: string;
  sender: "user" | "ai";
}

export default function MessageBubble({ message, sender }: MessageBubbleProps) {
  return (
    <div
      className={clsx(
        "flex w-full mb-3",
        sender === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={clsx(
          "px-3 py-2 rounded-2xl text-sm max-w-[70%]",
          sender === "user"
            ? "bg-gray-100 rounded-br-none"
            : "bg-gray-100 rounded-bl-none"
        )}
      >
        {message}
      </div>
    </div>
  );
}
