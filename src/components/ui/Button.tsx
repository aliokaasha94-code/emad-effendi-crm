import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#d4af37] to-[#f5d36e] text-[#000000] font-black hover:brightness-110 shadow-md shadow-[#d4af37]/20 active:scale-95",
  secondary:
    "border border-[#d4af37]/25 bg-[#1a1d1f] text-[#F5EFE6] hover:bg-[#22262a] hover:border-[#d4af37] hover:text-[#f5d36e] active:scale-95",
  ghost:
    "text-[#F5EFE6]/80 hover:bg-white/5 hover:text-[#f5d36e] active:scale-95",
  danger:
    "border border-rose-500/30 bg-rose-500/15 text-rose-300 hover:bg-rose-600 hover:text-white active:scale-95",
  gold:
    "bg-gradient-to-r from-[#d4af37] to-[#f5d36e] text-[#000000] font-black hover:brightness-110 shadow-lg shadow-[#d4af37]/30 active:scale-95",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs gap-1.5 rounded-xl",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2.5 rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      type = "button",
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin text-current" aria-hidden="true" />}
      {children}
    </button>
  )
);

Button.displayName = "Button";
