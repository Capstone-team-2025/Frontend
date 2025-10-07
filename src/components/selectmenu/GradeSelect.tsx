"use client";
import { useState } from "react";
import Button from "@/components/button/SignUpButton";

type Props = {
  title: string;
  subtitle?: string;
  options: string[];
  defaultValue?: string | null;
  ctaLabel?: string;
  onSubmit: (value: string) => void;
};

export default function SelectionScreen({
  title,
  subtitle,
  options,
  defaultValue = null,
  ctaLabel = "다음",
  onSubmit,
}: Props) {
  const [selected, setSelected] = useState<string | null>(defaultValue);

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-[#DD1A6D]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 text-sm leading-6 text-[#7A7A7A] whitespace-pre-line">
          {subtitle}
        </p>
      )}

      <div className="mt-8 grid gap-3">
        {options.map((opt) => (
          <Button
            key={opt}
            size="lg"
            fullWidth
            variant={selected === opt ? "primary" : "secondary"}
            onClick={() => setSelected(opt)}
          >
            {opt}
          </Button>
        ))}
      </div>

      <div className="h-24" />

      <Button
        size="lg"
        fullWidth
        disabled={!selected}
        onClick={() => selected && onSubmit(selected)}
      >
        {ctaLabel}
      </Button>
    </div>
  );
}
