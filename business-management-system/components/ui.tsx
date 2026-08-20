"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/* -------------------------------------------------------------------------- */
/* Buttons                                                                     */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-paper hover:bg-brand-700 active:bg-brand-800 shadow-sm disabled:bg-brand-300",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 shadow-sm disabled:text-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 active:bg-slate-200",
  danger:
    "bg-rose-600 text-paper hover:bg-rose-700 active:bg-rose-800 shadow-sm disabled:bg-rose-300",
  subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({
  label,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800",
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={clsx("card", className)}>{children}</div>;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                      */
/* -------------------------------------------------------------------------- */

const TONES = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  blue: "bg-brand-50 text-brand-700 ring-brand-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({
  tone = "slate",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  // invoices
  Draft: "slate",
  Sent: "blue",
  "Partially Paid": "amber",
  Paid: "green",
  Overdue: "red",
  Cancelled: "slate",
  // orders
  Pending: "amber",
  Confirmed: "blue",
  Completed: "green",
  // customers / items / employees
  Active: "green",
  Inactive: "slate",
  Lead: "violet",
  Archived: "slate",
  Disabled: "red",
  // roles
  Owner: "violet",
  Admin: "blue",
  Manager: "amber",
  Employee: "slate",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "slate"}>{status}</Badge>;
}

export function Avatar({
  name,
  hue = 220,
  size = 36,
}: {
  name: string;
  hue?: number;
  size?: number;
}) {
  const text = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${hue} 70% 94%)`,
        color: `hsl(${hue} 55% 34%)`,
      }}
    >
      {text}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Form controls                                                               */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={clsx("block", className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={clsx("input-base", invalid && "input-invalid", className)}
      {...props}
    />
  );
}

export function Textarea({
  invalid,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={clsx("input-base min-h-[84px]", invalid && "input-invalid", className)}
      {...props}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={clsx("input-base appearance-none pr-8", invalid && "input-invalid", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.6rem center",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && (
          <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand-600" : "bg-slate-300",
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal + confirm                                                             */
/* -------------------------------------------------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink-900/60 p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          "relative my-auto w-full rounded-t-2xl bg-white shadow-pop sm:rounded-2xl",
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description && (
              <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>
            )}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 scrollbar-thin">
          {children}
        </div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      width="max-w-md"
      footer={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600">{message}</p>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* States                                                                      */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx("animate-pulse rounded-md bg-slate-200/70", className)} />
  );
}

/* -------------------------------------------------------------------------- */
/* Table shell                                                                 */
/* -------------------------------------------------------------------------- */

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
  onClick,
  sorted,
}: {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  sorted?: "asc" | "desc" | null;
}) {
  return (
    <th
      onClick={onClick}
      className={clsx(
        "sticky top-0 z-10 whitespace-nowrap border-b border-slate-200 bg-slate-50/90 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 backdrop-blur",
        onClick && "cursor-pointer select-none hover:text-slate-800",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sorted && (
          <span className="text-[10px] text-slate-400">
            {sorted === "asc" ? "▲" : "▼"}
          </span>
        )}
      </span>
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={clsx(
        "border-b border-slate-100 px-4 py-3 align-middle text-slate-700",
        className,
      )}
    >
      {children}
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                  */
/* -------------------------------------------------------------------------- */

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[13px] text-slate-600">
      <span>
        Showing <strong className="text-slate-900">{from}</strong>–
        <strong className="text-slate-900">{to}</strong> of{" "}
        <strong className="text-slate-900">{total}</strong>
      </span>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className="px-2 tnum">
          {page} / {pages}
        </span>
        <Button
          size="sm"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

/** Simple dropdown anchored to a trigger; closes on outside click or Escape. */
export function Menu({
  trigger,
  children,
  align = "right",
}: {
  trigger: (props: { onClick: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {trigger({ onClick: () => setOpen((v) => !v) })}
      {open && (
        <div
          className={clsx(
            "absolute z-30 mt-1 min-w-[190px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-pop",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors disabled:cursor-not-allowed disabled:text-slate-300",
        danger
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-700 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}
