import { forwardRef } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-xl border bg-white/5 px-3 text-sm text-black-950 placeholder:text-black-950/35 transition focus-ring disabled:cursor-not-allowed disabled:opacity-60";
const normalBorder = "border-white/10 focus:border-gold-400";
const invalidBorder = "border-red-500/40 focus:border-red-500";

export interface FieldProps {
  label?: ReactNode;
  htmlFor?: string;
  error?: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-bold text-black-950/75">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-300" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-black-950/50">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, "aria-invalid": ariaInvalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || ariaInvalid || undefined}
      className={cn(controlBase, "h-11", invalid ? invalidBorder : normalBorder, className)}
      {...props}
    />
  )
);

Input.displayName = "Input";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid = false, children, "aria-invalid": ariaInvalid, ...props }, ref) => (
    <div className="relative w-full">
      <select
        ref={ref}
        aria-invalid={invalid || ariaInvalid || undefined}
        className={cn(
          controlBase,
          "h-11 appearance-none pl-9",
          invalid ? invalidBorder : normalBorder,
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black-950/40"
        aria-hidden="true"
      />
    </div>
  )
);

Select.displayName = "Select";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid = false, rows = 3, "aria-invalid": ariaInvalid, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || ariaInvalid || undefined}
      className={cn(
        controlBase,
        "min-h-[96px] py-3",
        invalid ? invalidBorder : normalBorder,
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
