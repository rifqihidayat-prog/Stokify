import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] border border-amber-300/40 focus-visible:ring-amber-400",
  secondary:
    "bg-[#161B26] text-zinc-200 hover:bg-[#1E2433] active:scale-[0.98] border border-white/[0.08] shadow-sm focus-visible:ring-zinc-400",
  outline:
    "border border-white/[0.1] bg-[#121620]/60 text-zinc-200 shadow-sm hover:bg-[#181E2B] hover:text-white active:scale-[0.98] focus-visible:ring-zinc-400",
  ghost: "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100 active:scale-[0.98] focus-visible:ring-zinc-500",
  danger:
    "bg-gradient-to-b from-rose-500 to-rose-600 text-white font-semibold shadow-sm shadow-rose-950/50 hover:from-rose-400 hover:to-rose-500 active:scale-[0.98] focus-visible:ring-rose-500",
  success:
    "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white font-semibold shadow-sm shadow-emerald-950/50 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.98] focus-visible:ring-emerald-500",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-xl min-h-[34px]",
  md: "px-4 py-2 text-sm rounded-xl min-h-[40px]",
  lg: "px-5 py-2.5 text-base rounded-xl min-h-[46px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}

