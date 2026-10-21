import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, formatNumber, initials } from "@/lib/utils";
import { getSegmentMeta } from "@/lib/segments";
import type { CustomerSegment } from "@/types/crm";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("surface", className)} {...props} />
  )
);

Card.displayName = "Card";

export type BadgeVariant = "neutral" | "brand" | "gold" | "success" | "warning" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  neutral: "border-brand-950/10 bg-brand-950/5 text-brand-950/70",
  brand: "border-brand-950/15 bg-brand-950 text-cream",
  gold: "border-gold-200 bg-gold-100 text-gold-800",
  success: "border-emerald-200 bg-emerald-100 text-emerald-800",
  warning: "border-orange-200 bg-orange-100 text-orange-800",
  danger: "border-red-200 bg-red-100 text-red-700",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold",
        badgeVariantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export interface SegmentBadgeProps {
  segment: CustomerSegment;
  className?: string;
  showDot?: boolean;
}

export function SegmentBadge({ segment, className, showDot = false }: SegmentBadgeProps) {
  const meta = getSegmentMeta(segment);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
        meta.badgeClass,
        className
      )}
    >
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} />}
      {meta.label}
    </span>
  );
}

export interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const avatarSizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      role="img"
      aria-label={name}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-950 font-bold text-cream",
        avatarSizeClasses[size],
        className
      )}
    >
      {initials(name)}
    </div>
  );
}

export interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 20, className, label = "جارٍ التحميل" }: SpinnerProps) {
  return (
    <span
      role="status"
      className={cn("inline-flex items-center justify-center text-brand-950/60", className)}
    >
      <Loader2
        className="animate-spin"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-brand-950/10", className)}
      {...props}
    />
  );
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-950/15 bg-white/60 px-6 py-10 text-center",
        className
      )}
    >
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-950/5 text-brand-950/60">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <p className="text-sm font-bold text-brand-950">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs leading-5 text-brand-950/55">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export type StatCardTone = "neutral" | "gold" | "success" | "warning" | "danger";

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: StatCardTone;
  className?: string;
}

const toneClasses: Record<StatCardTone, string> = {
  neutral: "bg-brand-950/5 text-brand-950",
  gold: "bg-gold-100 text-gold-800",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-orange-100 text-orange-700",
  danger: "bg-red-100 text-red-700",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  className,
}: StatCardProps) {
  return (
    <div className={cn("surface flex items-start justify-between gap-4 p-5", className)}>
      <div className="min-w-0">
        <p className="text-xs font-bold text-brand-950/55">{label}</p>
        <p className="mt-2 text-2xl font-extrabold text-brand-950">
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
        {hint && <p className="mt-1 text-xs text-brand-950/50">{hint}</p>}
      </div>
      {Icon && (
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            toneClasses[tone]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
