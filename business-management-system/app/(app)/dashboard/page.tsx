"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  FileText,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RevenueChart, SalesBreakdown } from "@/components/charts";
import {
  CustomerFormModal,
  ExpenseFormModal,
  InvoiceFormModal,
  ItemFormModal,
  PaymentFormModal,
} from "@/components/modals";
import { RequirePermission } from "@/components/shell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  StatusBadge,
  Td,
  Th,
  TableShell,
} from "@/components/ui";
import { money, moneyCompact, shortDate } from "@/lib/format";
import {
  RANGE_LABEL,
  type RangeKey,
  earliestActivity,
  effectiveStatus,
  invoiceBalance,
  invoiceTotal,
  kpis,
  rangeStart,
  revenueSeries,
  salesBreakdown,
} from "@/lib/selectors";
import { useStore } from "@/lib/store";

export default function DashboardPage() {
  return (
    <RequirePermission permission="view:dashboard">
      <Dashboard />
    </RequirePermission>
  );
}

function Dashboard() {
  const store = useStore();
  const { business, session, can, customers, invoices, payments } = store;

  const [range, setRange] = useState<RangeKey>("12m");
  const [salesBy, setSalesBy] = useState<"Product" | "Service" | "Category">(
    "Category",
  );
  const [modal, setModal] = useState<
    null | "customer" | "invoice" | "product" | "payment" | "expense"
  >(null);

  const showMoney = can("view:financials");

  const from = rangeStart(range);
  const metrics = useMemo(() => kpis(store, from), [store, from]);
  const previousStart = useMemo(
    () => new Date(+from - (Date.now() - +from)),
    [from],
  );
  const previous = useMemo(
    () => kpis(store, previousStart, from),
    [store, previousStart, from],
  );
  /** Only compare against a window the workspace actually has data for. */
  const comparable = useMemo(
    () => earliestActivity(store) <= +previousStart,
    [store, previousStart],
  );
  const series = useMemo(() => revenueSeries(store, range), [store, range]);
  const sales = useMemo(
    () => salesBreakdown(store, salesBy, from),
    [store, salesBy, from],
  );

  const recent = useMemo(
    () =>
      [...invoices]
        .sort((a, b) => +new Date(b.issueDate) - +new Date(a.issueDate))
        .slice(0, 6),
    [invoices],
  );

  const outstanding = useMemo(
    () =>
      invoices
        .map((i) => ({ invoice: i, balance: invoiceBalance(i, payments) }))
        .filter((r) => r.balance > 0)
        .sort((a, b) => +new Date(a.invoice.dueDate) - +new Date(b.invoice.dueDate))
        .slice(0, 6),
    [invoices, payments],
  );

  const customerName = (id: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? c.company || c.name : "Unknown customer";
  };

  const delta = (now: number, before: number) => {
    if (!comparable || before <= 0) return null;
    return ((now - before) / before) * 100;
  };

  const firstName = session?.name.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s how {business.name} is doing over the{" "}
            {RANGE_LABEL[range].toLowerCase()}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {can("manage:customers") && (
            <Button size="sm" onClick={() => setModal("customer")}>
              <UserPlus size={15} />
              Add customer
            </Button>
          )}
          {can("manage:products") && (
            <Button size="sm" onClick={() => setModal("product")}>
              <Package size={15} />
              Add product
            </Button>
          )}
          {can("manage:expenses") && (
            <Button size="sm" onClick={() => setModal("expense")}>
              <Receipt size={15} />
              Add expense
            </Button>
          )}
          {can("manage:payments") && (
            <Button size="sm" onClick={() => setModal("payment")}>
              <CreditCard size={15} />
              Record payment
            </Button>
          )}
          {can("manage:invoices") && (
            <Button size="sm" variant="primary" onClick={() => setModal("invoice")}>
              <FileText size={15} />
              Create invoice
            </Button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {showMoney && (
          <>
            <Kpi
              icon={<TrendingUp size={18} />}
              label="Total revenue"
              value={money(metrics.revenue, business.currency)}
              delta={delta(metrics.revenue, previous.revenue)}
              hint={`Invoiced in the ${RANGE_LABEL[range].toLowerCase()}`}
            />
            <Kpi
              icon={<Receipt size={18} />}
              label="Total expenses"
              value={money(metrics.expenses, business.currency)}
              delta={delta(metrics.expenses, previous.expenses)}
              deltaGoodWhenDown
              hint="Recorded business costs"
            />
            <Kpi
              icon={<Wallet size={18} />}
              label="Net profit"
              value={money(metrics.netProfit, business.currency)}
              delta={delta(metrics.netProfit, previous.netProfit)}
              hint={
                metrics.revenue > 0
                  ? `${((metrics.netProfit / metrics.revenue) * 100).toFixed(1)}% margin`
                  : "No revenue yet"
              }
            />
            <Kpi
              icon={<CreditCard size={18} />}
              label="Outstanding payments"
              value={money(metrics.outstanding, business.currency)}
              tone={metrics.overdueCount > 0 ? "warn" : "neutral"}
              hint={
                metrics.overdueCount > 0
                  ? `${metrics.overdueCount} invoice${metrics.overdueCount === 1 ? "" : "s"} overdue`
                  : "Nothing overdue"
              }
            />
          </>
        )}
        <Kpi
          icon={<Users size={18} />}
          label="Total customers"
          value={String(metrics.customers)}
          hint={`${customers.filter((c) => c.status === "Active").length} active`}
        />
        <Kpi
          icon={<ShoppingCart size={18} />}
          label="Total orders"
          value={String(metrics.orders)}
          delta={delta(metrics.orders, previous.orders)}
          hint={`In the ${RANGE_LABEL[range].toLowerCase()}`}
        />
      </div>

      {/* charts */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={showMoney ? "Revenue vs. expenses" : "Business activity"}
            subtitle={RANGE_LABEL[range]}
            action={
              <div className="flex rounded-lg bg-slate-100 p-0.5">
                {(Object.keys(RANGE_LABEL) as RangeKey[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                      range === r
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {r === "today"
                      ? "Today"
                      : r === "7d"
                        ? "7d"
                        : r === "30d"
                          ? "30d"
                          : "12m"}
                  </button>
                ))}
              </div>
            }
          />
          <div className="p-5">
            {showMoney ? (
              <RevenueChart data={series} currency={business.currency} />
            ) : (
              <p className="py-16 text-center text-sm text-slate-500">
                Revenue figures are visible to managers and owners only.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Sales breakdown"
            subtitle={RANGE_LABEL[range]}
            action={
              <div className="flex rounded-lg bg-slate-100 p-0.5">
                {(["Category", "Product", "Service"] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setSalesBy(b)}
                    className={`rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors ${
                      salesBy === b
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            }
          />
          <div className="p-5">
            <SalesBreakdown slices={sales} currency={business.currency} />
          </div>
        </Card>
      </div>

      {/* tables */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent transactions"
            subtitle="Latest invoices raised"
            action={
              <Link
                href="/invoices"
                className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            }
          />
          <TableShell>
            <thead>
              <tr>
                <Th>Invoice</Th>
                <Th>Customer</Th>
                <Th className="text-right">Amount</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {recent.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <Td>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-medium text-brand-600 hover:text-brand-700"
                    >
                      {inv.number}
                    </Link>
                  </Td>
                  <Td className="max-w-[180px] truncate">
                    {customerName(inv.customerId)}
                  </Td>
                  <Td className="text-right tnum font-medium text-slate-900">
                    {showMoney
                      ? money(invoiceTotal(inv), business.currency)
                      : "—"}
                  </Td>
                  <Td>
                    <StatusBadge status={effectiveStatus(inv)} />
                  </Td>
                  <Td className="whitespace-nowrap text-slate-500">
                    {shortDate(inv.issueDate)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </Card>

        <Card>
          <CardHeader
            title="Outstanding invoices"
            subtitle={
              outstanding.length
                ? `${money(metrics.outstanding, business.currency)} awaiting payment`
                : "Everything is settled"
            }
            action={
              <Link
                href="/invoices?status=unpaid"
                className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            }
          />
          {outstanding.length === 0 ? (
            <p className="px-5 py-14 text-center text-sm text-slate-500">
              No outstanding invoices. Nicely done.
            </p>
          ) : (
            <TableShell>
              <thead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Invoice</Th>
                  <Th className="text-right">Balance</Th>
                  <Th>Due date</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {outstanding.map(({ invoice, balance }) => {
                  const status = effectiveStatus(invoice);
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <Td className="max-w-[160px] truncate">
                        {customerName(invoice.customerId)}
                      </Td>
                      <Td>
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium text-brand-600 hover:text-brand-700"
                        >
                          {invoice.number}
                        </Link>
                      </Td>
                      <Td className="text-right tnum font-medium text-slate-900">
                        {showMoney ? money(balance, business.currency) : "—"}
                      </Td>
                      <Td className="whitespace-nowrap text-slate-500">
                        {shortDate(invoice.dueDate)}
                      </Td>
                      <Td>
                        <StatusBadge status={status} />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableShell>
          )}
        </Card>
      </div>

      <CustomerFormModal
        open={modal === "customer"}
        onClose={() => setModal(null)}
      />
      <ItemFormModal open={modal === "product"} onClose={() => setModal(null)} />
      <InvoiceFormModal
        open={modal === "invoice"}
        onClose={() => setModal(null)}
      />
      <PaymentFormModal
        open={modal === "payment"}
        onClose={() => setModal(null)}
      />
      <ExpenseFormModal
        open={modal === "expense"}
        onClose={() => setModal(null)}
      />
    </>
  );
}

function Kpi({
  icon,
  label,
  value,
  delta,
  deltaGoodWhenDown,
  hint,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number | null;
  deltaGoodWhenDown?: boolean;
  hint?: string;
  tone?: "neutral" | "warn";
}) {
  const up = (delta ?? 0) >= 0;
  const good = deltaGoodWhenDown ? !up : up;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            tone === "warn"
              ? "bg-amber-50 text-amber-600"
              : "bg-brand-50 text-brand-600"
          }`}
        >
          {icon}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {delta !== null && delta !== undefined && Number.isFinite(delta) && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${
              good ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
    </Card>
  );
}
