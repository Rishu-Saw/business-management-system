import { docTotal } from "./seed";
import type {
  AppState,
  Customer,
  Invoice,
  Item,
  Order,
  Payment,
} from "./types";

export { docTotal };

export const REVENUE_STATUSES: Invoice["status"][] = [
  "Sent",
  "Partially Paid",
  "Paid",
  "Overdue",
];

export function invoiceTotal(inv: Invoice) {
  return docTotal(inv.items, inv.discount).total;
}

export function orderTotal(order: Order) {
  return docTotal(order.items, order.discount).total;
}

export function paidAgainst(payments: Payment[], invoiceId: string) {
  return payments
    .filter((p) => p.invoiceId === invoiceId)
    .reduce((s, p) => s + p.amount, 0);
}

export function invoiceBalance(inv: Invoice, payments: Payment[]) {
  if (inv.status === "Cancelled" || inv.status === "Draft") return 0;
  return Math.max(0, invoiceTotal(inv) - paidAgainst(payments, inv.id));
}

/** True once an unpaid invoice is past its due date. */
export function isOverdue(inv: Invoice) {
  return (
    (inv.status === "Sent" ||
      inv.status === "Partially Paid" ||
      inv.status === "Overdue") &&
    +new Date(inv.dueDate) < Date.now()
  );
}

export function effectiveStatus(inv: Invoice): Invoice["status"] {
  if (inv.status === "Sent" || inv.status === "Partially Paid") {
    return isOverdue(inv) ? "Overdue" : inv.status;
  }
  return inv.status;
}

export interface Kpis {
  revenue: number;
  collected: number;
  expenses: number;
  netProfit: number;
  outstanding: number;
  customers: number;
  orders: number;
  overdueCount: number;
}

export function kpis(s: AppState, from?: Date, to?: Date): Kpis {
  const inWindow = (d: string) => {
    const t = +new Date(d);
    if (from && t < +from) return false;
    if (to && t > +to) return false;
    return true;
  };

  const billed = s.invoices.filter(
    (i) => REVENUE_STATUSES.includes(i.status) && inWindow(i.issueDate),
  );
  const revenue = billed.reduce((sum, i) => sum + invoiceTotal(i), 0);
  const collected = s.payments
    .filter((p) => inWindow(p.date))
    .reduce((sum, p) => sum + p.amount, 0);
  const expenses = s.expenses
    .filter((e) => inWindow(e.date))
    .reduce((sum, e) => sum + e.amount, 0);
  const outstanding = s.invoices.reduce(
    (sum, i) => sum + invoiceBalance(i, s.payments),
    0,
  );

  return {
    revenue,
    collected,
    expenses,
    netProfit: revenue - expenses,
    outstanding,
    customers: s.customers.length,
    orders: s.orders.filter((o) => inWindow(o.createdAt)).length,
    overdueCount: s.invoices.filter(isOverdue).length,
  };
}

/**
 * Timestamp of the oldest record in the workspace. Used to suppress
 * period-on-period deltas when the comparison window predates the data — a
 * young workspace would otherwise report meaningless swings like "+6000%".
 */
export function earliestActivity(s: AppState): number {
  const stamps = [
    ...s.invoices.map((i) => +new Date(i.issueDate)),
    ...s.orders.map((o) => +new Date(o.createdAt)),
    ...s.expenses.map((e) => +new Date(e.date)),
    ...s.payments.map((p) => +new Date(p.date)),
  ];
  return stamps.length ? Math.min(...stamps) : Date.now();
}

export type RangeKey = "today" | "7d" | "30d" | "12m";

export const RANGE_LABEL: Record<RangeKey, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "12m": "Last 12 months",
};

export function rangeStart(range: RangeKey): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === "today") return d;
  if (range === "7d") d.setDate(d.getDate() - 6);
  else if (range === "30d") d.setDate(d.getDate() - 29);
  else {
    d.setMonth(d.getMonth() - 11);
    d.setDate(1);
  }
  return d;
}

export interface SeriesPoint {
  label: string;
  revenue: number;
  expenses: number;
  collected: number;
}

/** Revenue / expense series bucketed by hour, day or month for the range. */
export function revenueSeries(s: AppState, range: RangeKey): SeriesPoint[] {
  const buckets: SeriesPoint[] = [];
  const keyOf = new Map<string, number>();

  const push = (label: string, key: string) => {
    keyOf.set(key, buckets.length);
    buckets.push({ label, revenue: 0, expenses: 0, collected: 0 });
  };

  const bucketKey = (d: Date) => {
    if (range === "today") return `h${d.getHours()}`;
    if (range === "12m") return `m${d.getFullYear()}-${d.getMonth()}`;
    return `d${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  if (range === "today") {
    for (let h = 0; h < 24; h += 3) {
      push(`${String(h).padStart(2, "0")}:00`, `h${h}`);
    }
  } else if (range === "12m") {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 11);
    for (let i = 0; i < 12; i++) {
      push(
        d.toLocaleDateString("en-IN", { month: "short" }),
        `m${d.getFullYear()}-${d.getMonth()}`,
      );
      d.setMonth(d.getMonth() + 1);
    }
  } else {
    const days = range === "7d" ? 7 : 30;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - days + 1);
    for (let i = 0; i < days; i++) {
      push(
        d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        `d${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
      );
      d.setDate(d.getDate() + 1);
    }
  }

  const indexFor = (dateStr: string) => {
    const d = new Date(dateStr);
    if (range === "today") {
      const h = Math.floor(d.getHours() / 3) * 3;
      const sameDay = d.toDateString() === new Date().toDateString();
      return sameDay ? (keyOf.get(`h${h}`) ?? -1) : -1;
    }
    return keyOf.get(bucketKey(d)) ?? -1;
  };

  for (const inv of s.invoices) {
    if (!REVENUE_STATUSES.includes(inv.status)) continue;
    const i = indexFor(inv.issueDate);
    if (i >= 0) buckets[i].revenue += invoiceTotal(inv);
  }
  for (const p of s.payments) {
    const i = indexFor(p.date);
    if (i >= 0) buckets[i].collected += p.amount;
  }
  for (const e of s.expenses) {
    const i = indexFor(e.date);
    if (i >= 0) buckets[i].expenses += e.amount;
  }
  return buckets;
}

export interface SalesSlice {
  name: string;
  value: number;
  units: number;
}

/** Sales aggregated by product, service or category across invoiced work. */
export function salesBreakdown(
  s: AppState,
  by: "Product" | "Service" | "Category",
  from?: Date,
  to?: Date,
): SalesSlice[] {
  const itemById = new Map(s.items.map((i) => [i.id, i]));
  const totals = new Map<string, SalesSlice>();

  for (const inv of s.invoices) {
    if (!REVENUE_STATUSES.includes(inv.status)) continue;
    const issued = +new Date(inv.issueDate);
    if (from && issued < +from) continue;
    if (to && issued > +to) continue;
    for (const line of inv.items) {
      const item = itemById.get(line.itemId);
      if (by !== "Category" && item && item.kind !== by) continue;
      const key =
        by === "Category" ? (item?.category ?? "Uncategorised") : line.name;
      const gross = line.unitPrice * line.quantity;
      const net = gross - (gross * line.discount) / 100;
      const prev = totals.get(key) ?? { name: key, value: 0, units: 0 };
      prev.value += net;
      prev.units += line.quantity;
      totals.set(key, prev);
    }
  }
  return Array.from(totals.values()).sort((a, b) => b.value - a.value);
}

export interface CustomerStats {
  orders: number;
  invoices: number;
  totalPurchases: number;
  totalPaid: number;
  outstanding: number;
  lastActivity: string | null;
}

export function customerStats(s: AppState, customerId: string): CustomerStats {
  const invoices = s.invoices.filter(
    (i) => i.customerId === customerId && i.status !== "Cancelled",
  );
  const payments = s.payments.filter((p) => p.customerId === customerId);
  const orders = s.orders.filter((o) => o.customerId === customerId);

  const totalPurchases = invoices
    .filter((i) => i.status !== "Draft")
    .reduce((sum, i) => sum + invoiceTotal(i), 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = invoices.reduce(
    (sum, i) => sum + invoiceBalance(i, s.payments),
    0,
  );

  const stamps = [
    ...invoices.map((i) => i.issueDate),
    ...payments.map((p) => p.date),
    ...orders.map((o) => o.createdAt),
  ].sort();

  return {
    orders: orders.length,
    invoices: invoices.length,
    totalPurchases,
    totalPaid,
    outstanding,
    lastActivity: stamps.length ? stamps[stamps.length - 1] : null,
  };
}

export function stockState(item: Item): "ok" | "low" | "out" | "n/a" {
  if (item.stock === null || item.minStock === null) return "n/a";
  if (item.stock === 0) return "out";
  if (item.stock <= item.minStock) return "low";
  return "ok";
}

export function inventoryValue(items: Item[]) {
  return items.reduce(
    (sum, i) => sum + (i.stock ?? 0) * i.costPrice,
    0,
  );
}

export function topCustomers(s: AppState, limit = 5) {
  return s.customers
    .map((c: Customer) => ({ customer: c, stats: customerStats(s, c.id) }))
    .filter((r) => r.stats.totalPurchases > 0)
    .sort((a, b) => b.stats.totalPurchases - a.stats.totalPurchases)
    .slice(0, limit);
}
