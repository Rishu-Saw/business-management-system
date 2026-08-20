"use client";

import { Download, FileDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { RevenueChart } from "@/components/charts";
import { RequirePermission } from "@/components/shell";
import { useToast } from "@/components/toast";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  StatusBadge,
  TableShell,
  Td,
  Th,
} from "@/components/ui";
import { downloadCsv, downloadTablePdf } from "@/lib/export";
import { inputDate, money, num, shortDate } from "@/lib/format";
import {
  REVENUE_STATUSES,
  effectiveStatus,
  invoiceBalance,
  invoiceTotal,
  inventoryValue,
  orderTotal,
  revenueSeries,
  salesBreakdown,
  stockState,
  topCustomers,
} from "@/lib/selectors";
import { useStore } from "@/lib/store";

type ReportKey = "sales" | "pnl" | "customers" | "invoices" | "inventory";

const REPORTS: { key: ReportKey; label: string; blurb: string }[] = [
  { key: "sales", label: "Sales", blurb: "Revenue, orders and best sellers" },
  { key: "pnl", label: "Profit & loss", blurb: "Revenue against expenses" },
  { key: "customers", label: "Customers", blurb: "New, returning and top accounts" },
  { key: "invoices", label: "Invoices", blurb: "Paid, pending and overdue" },
  { key: "inventory", label: "Inventory", blurb: "Stock value and reorder list" },
];

export default function ReportsPage() {
  return (
    <RequirePermission permission="view:reports">
      <ReportsView />
    </RequirePermission>
  );
}

function ReportsView() {
  const store = useStore();
  const { business, invoices, orders, payments, expenses, customers, items } =
    store;
  const { success } = useToast();

  const [report, setReport] = useState<ReportKey>("sales");
  const defaultFrom = new Date();
  defaultFrom.setMonth(defaultFrom.getMonth() - 11);
  defaultFrom.setDate(1);

  const [from, setFrom] = useState(inputDate(defaultFrom));
  const [to, setTo] = useState(inputDate(new Date()));

  const fromDate = useMemo(() => new Date(`${from}T00:00:00`), [from]);
  const toDate = useMemo(() => new Date(`${to}T23:59:59`), [to]);

  const inRange = (d: string) => {
    const t = +new Date(d);
    return t >= +fromDate && t <= +toDate;
  };

  const scopedInvoices = invoices.filter((i) => inRange(i.issueDate));
  const scopedOrders = orders.filter((o) => inRange(o.createdAt));
  const scopedPayments = payments.filter((p) => inRange(p.date));
  const scopedExpenses = expenses.filter((e) => inRange(e.date));

  const billed = scopedInvoices.filter((i) => REVENUE_STATUSES.includes(i.status));
  const revenue = billed.reduce((s, i) => s + invoiceTotal(i), 0);
  const expenseTotal = scopedExpenses.reduce((s, e) => s + e.amount, 0);
  const collected = scopedPayments.reduce((s, p) => s + p.amount, 0);

  const rangeLabel = `${shortDate(fromDate)} — ${shortDate(toDate)}`;

  /** Each report supplies its own table so CSV and PDF stay in sync. */
  const table = useMemo(() => {
    switch (report) {
      case "sales": {
        const slices = salesBreakdown(store, "Category", fromDate, toDate);
        return {
          title: "Sales report",
          summary: [
            ["Revenue", money(revenue, business.currency)],
            ["Orders", num(scopedOrders.length)],
            [
              "Average order value",
              money(
                scopedOrders.length
                  ? scopedOrders.reduce((s, o) => s + orderTotal(o), 0) /
                      scopedOrders.length
                  : 0,
                business.currency,
              ),
            ],
            ["Invoices raised", num(scopedInvoices.length)],
          ] as [string, string][],
          headers: ["Category", "Units sold", "Revenue"],
          rows: slices.map((s) => [s.name, s.units, Math.round(s.value)]),
        };
      }
      case "pnl": {
        const byCategory = new Map<string, number>();
        for (const e of scopedExpenses)
          byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
        return {
          title: "Profit & loss",
          summary: [
            ["Revenue", money(revenue, business.currency)],
            ["Expenses", money(expenseTotal, business.currency)],
            ["Net profit", money(revenue - expenseTotal, business.currency)],
            [
              "Net margin",
              revenue > 0
                ? `${(((revenue - expenseTotal) / revenue) * 100).toFixed(1)}%`
                : "—",
            ],
          ] as [string, string][],
          headers: ["Line", "Type", "Amount"],
          rows: [
            ["Revenue from invoices", "Income", Math.round(revenue)],
            ...Array.from(byCategory.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => [cat, "Expense", -Math.round(amount)]),
            ["Net profit", "Result", Math.round(revenue - expenseTotal)],
          ] as (string | number)[][],
        };
      }
      case "customers": {
        const created = customers.filter((c) => inRange(c.createdAt));
        const withOrders = customers.filter((c) =>
          scopedOrders.some((o) => o.customerId === c.id),
        );
        const returning = withOrders.filter(
          (c) => scopedOrders.filter((o) => o.customerId === c.id).length > 1,
        );
        return {
          title: "Customer report",
          summary: [
            ["New customers", num(created.length)],
            ["Customers who ordered", num(withOrders.length)],
            ["Returning customers", num(returning.length)],
            ["Total customers", num(customers.length)],
          ] as [string, string][],
          headers: ["Customer", "Company", "Orders", "Total purchases", "Outstanding"],
          rows: topCustomers(store, 15).map((r) => [
            r.customer.name,
            r.customer.company,
            r.stats.orders,
            Math.round(r.stats.totalPurchases),
            Math.round(r.stats.outstanding),
          ]),
        };
      }
      case "invoices": {
        const counts = { Paid: 0, Pending: 0, Overdue: 0 };
        for (const i of scopedInvoices) {
          const s = effectiveStatus(i);
          if (s === "Paid") counts.Paid++;
          else if (s === "Overdue") counts.Overdue++;
          else if (s === "Sent" || s === "Partially Paid") counts.Pending++;
        }
        return {
          title: "Invoice report",
          summary: [
            ["Paid", num(counts.Paid)],
            ["Pending", num(counts.Pending)],
            ["Overdue", num(counts.Overdue)],
            ["Collected", money(collected, business.currency)],
          ] as [string, string][],
          headers: ["Invoice", "Customer", "Issued", "Due", "Total", "Balance", "Status"],
          rows: scopedInvoices.map((i) => {
            const c = customers.find((x) => x.id === i.customerId);
            return [
              i.number,
              c ? c.company || c.name : "",
              shortDate(i.issueDate),
              shortDate(i.dueDate),
              Math.round(invoiceTotal(i)),
              Math.round(invoiceBalance(i, payments)),
              effectiveStatus(i),
            ];
          }),
        };
      }
      default: {
        const products = items.filter((i) => i.kind === "Product");
        return {
          title: "Inventory report",
          summary: [
            ["Stock value (at cost)", money(inventoryValue(items), business.currency)],
            ["Products", num(products.length)],
            ["Low stock", num(products.filter((i) => stockState(i) === "low").length)],
            [
              "Out of stock",
              num(products.filter((i) => stockState(i) === "out").length),
            ],
          ] as [string, string][],
          headers: ["Product", "SKU", "Category", "Stock", "Min", "Cost", "Stock value"],
          rows: products.map((i) => [
            i.name,
            i.sku,
            i.category,
            i.stock ?? 0,
            i.minStock ?? 0,
            i.costPrice,
            Math.round((i.stock ?? 0) * i.costPrice),
          ]),
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, store, from, to]);

  const series = useMemo(() => revenueSeries(store, "12m"), [store]);
  const bestSellers = useMemo(
    () => salesBreakdown(store, "Product", fromDate, toDate).slice(0, 5),
    [store, fromDate, toDate],
  );

  function exportCsv() {
    downloadCsv(
      table.title.toLowerCase().replace(/[^a-z]+/g, "-"),
      table.headers,
      table.rows as (string | number)[][],
    );
    success("CSV downloaded", `${table.title} exported.`);
  }

  async function exportPdf() {
    await downloadTablePdf({
      filename: table.title.toLowerCase().replace(/[^a-z]+/g, "-"),
      title: table.title,
      subtitle: rangeLabel,
      businessName: business.name,
      headers: table.headers,
      rows: table.rows as (string | number)[][],
      summary: table.summary,
    });
    success("PDF downloaded", `${table.title} exported.`);
  }

  return (
    <>
      <PageHeader
        title="Reports & analytics"
        subtitle={rangeLabel}
        actions={
          <>
            <Button onClick={exportCsv}>
              <Download size={15} />
              Export CSV
            </Button>
            <Button variant="primary" onClick={exportPdf}>
              <FileDown size={15} />
              Export PDF
            </Button>
          </>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4 p-5">
          <div className="flex flex-wrap gap-1.5">
            {REPORTS.map((r) => (
              <button
                key={r.key}
                onClick={() => setReport(r.key)}
                className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors ${
                  report === r.key
                    ? "bg-brand-600 text-paper shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-end gap-3">
            <Field label="From" className="w-[150px]">
              <Input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Field>
            <Field label="To" className="w-[150px]">
              <Input
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
              />
            </Field>
            <Button
              onClick={() => {
                const d = new Date();
                d.setMonth(d.getMonth() - 11);
                d.setDate(1);
                setFrom(inputDate(d));
                setTo(inputDate(new Date()));
              }}
            >
              Last 12 months
            </Button>
          </div>
        </div>
      </Card>

      {/* summary tiles */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {table.summary.map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-[13px] font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {value}
            </p>
          </Card>
        ))}
      </div>

      {report === "sales" && (
        <div className="mb-6 grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Revenue trend"
              subtitle="Last 12 months, invoiced revenue against recorded expenses"
            />
            <div className="p-5">
              <RevenueChart
                data={series}
                currency={business.currency}
                height={240}
              />
            </div>
          </Card>
          <Card>
            <CardHeader title="Best-selling products" subtitle={rangeLabel} />
            <div className="p-5">
              {bestSellers.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No product sales in this range.
                </p>
              ) : (
                <ol className="space-y-3.5">
                  {bestSellers.map((s, i) => (
                    <li key={s.name} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-slate-800">
                          {s.name}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {s.units} units
                        </span>
                      </span>
                      <span className="tnum shrink-0 text-[13px] font-semibold text-slate-900">
                        {money(s.value, business.currency)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Card>
        </div>
      )}

      {report === "pnl" && (
        <Card className="mb-6">
          <CardHeader
            title="Revenue vs. expenses"
            subtitle="Last 12 months"
          />
          <div className="p-5">
            <RevenueChart data={series} currency={business.currency} height={260} />
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          title={table.title}
          subtitle={`${table.rows.length} row${table.rows.length === 1 ? "" : "s"} · ${rangeLabel}`}
          action={
            <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-500">
              <TrendingUp size={15} className="text-brand-600" />
              {business.name}
            </span>
          }
        />
        {table.rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-slate-500">
            No data in the selected date range.
          </p>
        ) : (
          <TableShell>
            <thead>
              <tr>
                {table.headers.map((h, i) => (
                  <Th key={h} className={i > 1 ? "text-right" : undefined}>
                    {h}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-50">
                  {row.map((cell, ci) => {
                    const isStatus =
                      report === "invoices" && ci === table.headers.length - 1;
                    const isMoney =
                      typeof cell === "number" &&
                      (table.headers[ci].toLowerCase().includes("revenue") ||
                        table.headers[ci].toLowerCase().includes("amount") ||
                        table.headers[ci].toLowerCase().includes("total") ||
                        table.headers[ci].toLowerCase().includes("balance") ||
                        table.headers[ci].toLowerCase().includes("value") ||
                        table.headers[ci].toLowerCase().includes("cost") ||
                        table.headers[ci].toLowerCase().includes("purchases"));
                    return (
                      <Td
                        key={ci}
                        className={
                          ci > 1
                            ? "text-right tnum whitespace-nowrap"
                            : "whitespace-nowrap"
                        }
                      >
                        {isStatus ? (
                          <StatusBadge status={String(cell)} />
                        ) : isMoney ? (
                          <span
                            className={
                              (cell as number) < 0
                                ? "font-medium text-rose-600"
                                : "font-medium text-slate-900"
                            }
                          >
                            {money(cell as number, business.currency)}
                          </span>
                        ) : ci === 0 ? (
                          <span className="font-medium text-slate-900">
                            {cell}
                          </span>
                        ) : typeof cell === "number" ? (
                          num(cell)
                        ) : (
                          cell
                        )}
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>

      {report === "inventory" && (
        <Card className="mt-6">
          <CardHeader
            title="Reorder list"
            subtitle="Products at or below their minimum stock level"
          />
          <div className="flex flex-wrap gap-2 p-5">
            {items
              .filter(
                (i) => stockState(i) === "low" || stockState(i) === "out",
              )
              .map((i) => (
                <Badge
                  key={i.id}
                  tone={stockState(i) === "out" ? "red" : "amber"}
                >
                  {i.name} · {i.stock} left
                </Badge>
              ))}
            {items.filter(
              (i) => stockState(i) === "low" || stockState(i) === "out",
            ).length === 0 && (
              <p className="text-sm text-slate-500">
                Every product is above its minimum stock level.
              </p>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
