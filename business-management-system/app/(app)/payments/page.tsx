"use client";

import {
  Banknote,
  CreditCard,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PaymentFormModal } from "@/components/modals";
import { RequirePermission } from "@/components/shell";
import { useToast } from "@/components/toast";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
  Menu,
  MenuItem,
  PageHeader,
  Pagination,
  Select,
  TableShell,
  Td,
  Th,
} from "@/components/ui";
import { downloadCsv } from "@/lib/export";
import { money, shortDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Payment, PaymentMethod } from "@/lib/types";

const PAGE_SIZE = 10;
const METHODS: PaymentMethod[] = ["Cash", "Bank Transfer", "UPI", "Card", "Other"];

export default function PaymentsPage() {
  return (
    <RequirePermission permission="manage:payments">
      <PaymentsView />
    </RequirePermission>
  );
}

function PaymentsView() {
  const { payments, customers, invoices, business, deletePayment } = useStore();
  const { success } = useToast();

  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("All");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Payment | null>(null);

  const customerFor = (id: string) => customers.find((c) => c.id === id);
  const invoiceFor = (id: string | null) =>
    id ? invoices.find((i) => i.id === id) : undefined;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments
      .filter((p) => (method === "All" ? true : p.method === method))
      .filter((p) => {
        if (!q) return true;
        const c = customerFor(p.customerId);
        const inv = invoiceFor(p.invoiceId);
        return (
          p.number.toLowerCase().includes(q) ||
          p.reference.toLowerCase().includes(q) ||
          (c?.name ?? "").toLowerCase().includes(q) ||
          (c?.company ?? "").toLowerCase().includes(q) ||
          (inv?.number ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, customers, invoices, query, method]);

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = rows.reduce((s, p) => s + p.amount, 0);

  const thisMonth = payments
    .filter((p) => {
      const d = new Date(p.date);
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((s, p) => s + p.amount, 0);

  const byMethod = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of rows) map.set(p.method, (map.get(p.method) ?? 0) + p.amount);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  function exportCsv() {
    downloadCsv(
      "payments",
      ["Payment ID", "Date", "Customer", "Invoice", "Method", "Reference", "Amount", "Notes"],
      rows.map((p) => {
        const c = customerFor(p.customerId);
        const inv = invoiceFor(p.invoiceId);
        return [
          p.number,
          new Date(p.date).toISOString().slice(0, 10),
          c ? c.company || c.name : "",
          inv?.number ?? "",
          p.method,
          p.reference,
          p.amount,
          p.notes,
        ];
      }),
    );
    success("Export ready", `${rows.length} payments exported to CSV.`);
  }

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle={`${money(total, business.currency)} received across ${rows.length} payments`}
        actions={
          <>
            <Button onClick={exportCsv}>
              <Download size={15} />
              Export CSV
            </Button>
            <Button variant="primary" onClick={() => setFormOpen(true)}>
              <Plus size={15} />
              Record payment
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-slate-500">
                Total collected
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {money(total, business.currency)}
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Banknote size={18} />
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-slate-500">This month</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {money(thisMonth, business.currency)}
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <CreditCard size={18} />
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-[13px] font-medium text-slate-500">
            Collected by method
          </p>
          <ul className="mt-3 space-y-1.5">
            {byMethod.slice(0, 4).map(([m, amount]) => (
              <li key={m} className="flex items-center justify-between text-[13px]">
                <span className="text-slate-600">{m}</span>
                <span className="tnum font-medium text-slate-900">
                  {money(amount, business.currency)}
                </span>
              </li>
            ))}
            {byMethod.length === 0 && (
              <li className="text-[13px] text-slate-500">No payments yet.</li>
            )}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by payment ID, customer, invoice or reference…"
              className="pl-9"
              aria-label="Search payments"
            />
          </div>
          <Select
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setPage(1);
            }}
            className="w-auto min-w-[150px]"
            aria-label="Filter by method"
          >
            <option>All</option>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={22} />}
            title={
              query || method !== "All" ? "No matching payments" : "No payments yet"
            }
            message={
              query || method !== "All"
                ? "Try a different search or clear the method filter."
                : "Record your first payment against an invoice."
            }
            action={
              <Button variant="primary" onClick={() => setFormOpen(true)}>
                <Plus size={15} />
                Record payment
              </Button>
            }
          />
        ) : (
          <>
            <TableShell>
              <thead>
                <tr>
                  <Th>Payment</Th>
                  <Th>Customer</Th>
                  <Th>Invoice</Th>
                  <Th>Date</Th>
                  <Th>Method</Th>
                  <Th>Reference</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {paged.map((p) => {
                  const c = customerFor(p.customerId);
                  const inv = invoiceFor(p.invoiceId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <Td className="font-medium text-slate-900">{p.number}</Td>
                      <Td className="max-w-[180px]">
                        {c ? (
                          <Link
                            href={`/customers/${c.id}`}
                            className="block truncate text-slate-700 hover:text-brand-600"
                          >
                            {c.company || c.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">Unknown</span>
                        )}
                      </Td>
                      <Td>
                        {inv ? (
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="font-medium text-brand-600 hover:text-brand-700"
                          >
                            {inv.number}
                          </Link>
                        ) : (
                          <Badge>Advance</Badge>
                        )}
                      </Td>
                      <Td className="whitespace-nowrap text-slate-500">
                        {shortDate(p.date)}
                      </Td>
                      <Td>
                        <Badge tone="blue">{p.method}</Badge>
                      </Td>
                      <Td className="text-slate-500">{p.reference || "—"}</Td>
                      <Td className="text-right tnum font-semibold text-emerald-700">
                        {money(p.amount, business.currency)}
                      </Td>
                      <Td>
                        <Menu
                          trigger={({ onClick }) => (
                            <IconButton label="Payment actions" onClick={onClick}>
                              <MoreHorizontal size={17} />
                            </IconButton>
                          )}
                        >
                          {(close) => (
                            <MenuItem
                              danger
                              onClick={() => {
                                close();
                                setToDelete(p);
                              }}
                            >
                              <Trash2 size={15} />
                              Delete payment
                            </MenuItem>
                          )}
                        </Menu>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableShell>

            <div className="border-t border-slate-200">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={rows.length}
                onPage={setPage}
              />
            </div>
          </>
        )}
      </Card>

      <PaymentFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete payment"
        message={`Delete ${toDelete?.number}? The linked invoice's status will be recalculated. This can't be undone.`}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deletePayment(toDelete.id);
            success("Payment deleted", `${toDelete.number} has been removed.`);
          }
          setToDelete(null);
        }}
      />
    </>
  );
}
