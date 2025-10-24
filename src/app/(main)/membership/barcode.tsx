"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

type Props = {
  value: string;
  height?: number;
  displayValue?: boolean;
};

export default function Barcode({
  value,
  height = 80,
  displayValue = false,
}: Props) {
  const ref = useRef<SVGSVGElement | null>(null);
  const digits = (value || "").replace(/\D/g, "");

  useEffect(() => {
    if (!ref.current) return;
    if (!digits) {
      ref.current.innerHTML = "";
      return;
    }
    JsBarcode(ref.current, digits, {
      format: "CODE128",
      height,
      displayValue,
      margin: 0,
      fontSize: 14,
    });
  }, [digits, height, displayValue]);

  return (
    <svg
      ref={ref}
      role="img"
      aria-label="membership-barcode"
      className="mx-auto"
    />
  );
}
