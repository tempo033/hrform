"use client";

import React, { useEffect, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { X, Loader2, Search, type LucideIcon } from "lucide-react";

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);
}

/* ---------------- Buttons ---------------- */

type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "danger" | "gold";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm shadow-emerald-900/20 focus-visible:ring-emerald-600/40",
  dark: "bg-pine-900 text-white hover:bg-pine-950 shadow-sm focus-visible:ring-pine-900/40",
  outline:
    "border border-stone-300 bg-white text-stone-700 hover:border-emerald-600 hover:text-emerald-700 focus-visible:ring-emerald-600/30",
  ghost: "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900 focus-visible:ring-stone-400/40",
  danger:
    "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-900/20 focus-visible:ring-red-500/40",
  gold: "bg-[#b8912f] text-white hover:bg-[#a07f28] shadow-sm focus-visible:ring-amber-600/40",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  icon?: LucideIcon;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
        buttonVariants[variant],
        className,
      )}
    >
      {loading ? (
        <Loader2 className={cx("animate-spin", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      ) : (
        Icon && <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.2} />
      )}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  tone?: "default" | "danger" | "emerald";
}

export function IconButton({ icon: Icon, label, tone = "default", className, ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      title={label}
      aria-label={label}
      className={cx(
        "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors",
        tone === "default" && "text-stone-500 hover:bg-stone-200/80 hover:text-stone-800",
        tone === "danger" && "text-stone-400 hover:bg-red-50 hover:text-red-600",
        tone === "emerald" && "text-stone-500 hover:bg-emerald-50 hover:text-emerald-700",
        className,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}

/* ---------------- Form controls ---------------- */

const controlClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors placeholder:text-stone-400 hover:border-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

export function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-stone-600">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-stone-400">{hint}</p>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(controlClass, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(controlClass, "cursor-pointer", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(controlClass, "min-h-[80px] resize-y", props.className)} />;
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  className,
  onKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={cx("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? "بحث…"}
        className={cx(controlClass, "pr-9")}
      />
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 bg-stone-50/60 px-3.5 py-3 transition-colors hover:border-emerald-500/50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-stone-300 accent-emerald-700"
      />
      <span>
        <span className="block text-sm font-medium text-stone-700">{label}</span>
        {desc && <span className="mt-0.5 block text-[11px] text-stone-400">{desc}</span>}
      </span>
    </label>
  );
}

/* ---------------- Overlays ---------------- */

export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="animate-overlay absolute inset-0 bg-pine-950/55 backdrop-blur-[3px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          "animate-dialog relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-pine-950/25 ring-1 ring-black/5",
          wide ? "max-w-3xl" : "max-w-xl",
        )}
      >
        <div className="flex items-start gap-3 border-b border-stone-200/80 bg-stone-50/60 px-5 py-4">
          {Icon && (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700/10 text-emerald-700">
              <Icon className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-bold text-stone-800">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-700"
            aria-label="إغلاق"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-stone-200/80 bg-stone-50/60 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "تأكيد",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-relaxed text-stone-600">{message}</p>
      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          إلغاء
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

export function SlideOver({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-overlay absolute inset-0 bg-pine-950/55 backdrop-blur-[3px]" onClick={onClose} />
      <div className="animate-drawer absolute top-0 bottom-0 left-0 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}

/* ---------------- Data display ---------------- */

type Tone = "emerald" | "amber" | "red" | "sky" | "stone" | "gold" | "orange" | "pine";

const tones: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/20",
  stone: "bg-stone-100 text-stone-600 ring-stone-400/30",
  gold: "bg-[#faf3e0] text-[#8a6a1d] ring-[#b8912f]/30",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/20",
  pine: "bg-pine-900/5 text-pine-800 ring-pine-900/15",
};

const dotTones: Record<Tone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  sky: "bg-sky-500",
  stone: "bg-stone-400",
  gold: "bg-[#b8912f]",
  orange: "bg-orange-500",
  pine: "bg-pine-800",
};

export function Badge({ tone = "stone", dot, pulse, children }: { tone?: Tone; dot?: boolean; pulse?: boolean; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        tones[tone],
      )}
    >
      {dot && <span className={cx("h-1.5 w-1.5 rounded-full", dotTones[tone], pulse && "dot-pulse")} />}
      {children}
    </span>
  );
}

export function Card({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cx("rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(16,33,27,0.05)]", className)}
    >
      {children}
    </div>
  );
}

export function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  tone,
  onClick,
}: {
  title: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: LucideIcon;
  tone: "emerald" | "gold" | "red" | "sky" | "pine" | "orange";
  onClick?: () => void;
}) {
  const tile: Record<string, string> = {
    emerald: "bg-emerald-700 text-white shadow-emerald-900/25",
    gold: "bg-[#b8912f] text-white shadow-amber-900/25",
    red: "bg-red-600 text-white shadow-red-900/25",
    sky: "bg-sky-600 text-white shadow-sky-900/25",
    pine: "bg-pine-800 text-white shadow-pine-950/25",
    orange: "bg-orange-500 text-white shadow-orange-900/25",
  };
  return (
    <Card
      className={cx(
        "group relative overflow-hidden p-5 transition-all duration-300",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pine-950/10",
      )}
    >
      <div onClick={onClick} className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-stone-500">{title}</p>
          <p className="tnum mt-2 text-[28px] leading-none font-bold text-stone-800">{value}</p>
          {sub && <div className="mt-2.5 text-[11px] font-medium text-stone-500">{sub}</div>}
        </div>
        <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg", tile[tone])}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
      </div>
      <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-l from-transparent via-emerald-700/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: LucideIcon;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-sm font-bold text-stone-700">{title}</p>
        {desc && <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-400">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cx("flex items-center justify-center py-16", className)}>
      <Loader2 className="h-7 w-7 animate-spin text-emerald-700" strokeWidth={2.2} />
    </div>
  );
}

/* ---------------- Tables ---------------- */

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cx(
        "sticky top-0 z-10 border-b border-stone-200 bg-stone-50/95 px-4 py-3 text-right text-[11px] font-bold whitespace-nowrap text-stone-500 backdrop-blur",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cx("border-b border-stone-100 px-4 py-3 text-[13px] text-stone-700", className)}>{children}</td>;
}

export function TableShell({ children, minWidth = 900 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}
