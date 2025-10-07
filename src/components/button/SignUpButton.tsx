"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "lg" | "md" | "sm";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

const base = "inline-flex items-center justify-center rounded-xl font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
const sizes: Record<Size, string> = {
  lg: "h-12 px-5 text-base",
  md: "h-11 px-4 text-sm",
  sm: "h-9 px-3 text-sm",
};
const variants: Record<Variant, string> = {
  primary: "bg-black text-white hover:brightness-95 active:brightness-90 disabled:bg-gray-300",
  secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400",
  ghost: "bg-transparent text-black hover:bg-gray-100 active:bg-gray-200",
};

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant="primary", size="lg", fullWidth, loading, className="", children, ...rest }, ref) => (
    <button
      ref={ref}
      className={[base, sizes[size], variants[variant], fullWidth ? "w-full" : "", className].join(" ")}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? "…" : children}
    </button>
  )
);
Button.displayName = "Button";
export default Button;
