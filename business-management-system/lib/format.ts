import type { CurrencyCode } from "./types";

const LOCALE: Record<CurrencyCode, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function money(value: number, currency: CurrencyCode = "INR") {
  return new Intl.NumberFormat(LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/** Compact form for KPI cards and chart axes: ₹12.4L / ₹1.2Cr / $12.4K. */
export function moneyCompact(value: number, currency: CurrencyCode = "INR") {
  const s = CURRENCY_SYMBOL[currency];
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (currency === "INR") {
    if (abs >= 1e7) return `${sign}${s}${(abs / 1e7).toFixed(2)}Cr`;
    if (abs >= 1e5) return `${sign}${s}${(abs / 1e5).toFixed(2)}L`;
    if (abs >= 1e3) return `${sign}${s}${(abs / 1e3).toFixed(1)}K`;
    return `${sign}${s}${Math.round(abs)}`;
  }
  if (abs >= 1e6) return `${sign}${s}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${s}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${s}${Math.round(abs)}`;
}

export function num(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function shortDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function dateTime(value: string | Date) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(value: string | Date) {
  const diff = Date.now() - +new Date(value);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function inputDate(value: string | Date) {
  const d = new Date(value);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
