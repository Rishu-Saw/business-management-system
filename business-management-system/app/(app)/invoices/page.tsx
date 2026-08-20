"use client";

import {
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { InvoiceFormModal, PaymentFormModal } from "@/components/modals";
import { RequirePermission } from "@/components/shell";
import { useToast } from "@/components/toast";
import {
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
  StatusBadge,
  TableShell,
  Td,
  Th,
} from "@/components/ui";
import { downloadCsv } from "@/lib/export";
import { money, shortDate } from "@/lib/format";
import {
  effectiveStatus,
  invoiceBalance,
  invoiceTotal,
  paidAgainst,
} from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Invoice } from "@/lib/types";

const PAGE_SIZE = 10;

export default function InvoicesPage() {
  return (
    <RequirePermission permission="manage:invoices">
      <Suspense fallback={null}>
        <InvoicesView />
      </Suspense>
    </RequirePermission>
  );
}

function InvoicesView() {
  const {
    invoices,
    customers,
    payments,
    business,
    deleteInvoice,
    duplicateInvoice,
    updateInvoice,
    can,
  } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const { success } = useToast();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(
    params.get("status") === "unpaid" ? "Unpaid" : "All",
  );
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | undefined>();
  const [payFor, setPayFor] = useState<Invoice | undefined>();
  const [toDelete, setToDelete] = useState<Invoice | null>(null);

  const customerFor = (id: string) => customers.find((c) => c.id === id);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices
      .filter((i) => {
        if (status === "All") return true;
        if (status === "Unpaid") return invoiceBalance(i, payments) > 0;
        return effectiveStatus(i) === status;
      })
      .filter((i) => {
        if (!q) return true;
        const c = customerFor(i.customerId);
        return (
          i.number.toLowerCase().includes(q) ||
          (c?.name ?? "").toLowerCase().includes(q) ||
          (c?.company ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => +new Date(b.issueDate) - +new Date(a.issueDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, customers, payments, query, status]);

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const summary = useMemo(() => {
    const billed = rows.reduce(
      (s, i) =>
        effectiveStatus(i) === "Cancelled" || i.status === "Draft"
          ? s
          : s + invoiceTotal(i),
      0,
    );
    const due = rows.reduce((s, i) => s + invoiceBalance(i, payments), 0);
    return { billed, due };
  }, [rows, payments]);

  function exportCsv() {
    downloadCsv(
      "invoices",
      ["Invoice", "Customer", "Issue date", "Due date", "Total", "Paid", "Balance", "Status"],
      rows.map((i) => {
        const c = customerFor(i.customerId);
        return [
          i.number,
          c ? c.company || c.name : "",
          new Date(i.issueDate).toISOString().slice(0, 10),
          new Date(i.dueDate).toISOString().slice(0, 10),
          Math.round(invoiceTotal(i)),
          Math.round(paidAgainst(payments, i.id)),
          Math.round(invoiceBalance(i, payments)),
          effectiveStatus(i),
        ];
      }),
    );
    success("Export ready", `${rows.length} invoices exported to CSV.`);
  }

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle={`${money(summary.billed, business.currency)} billed · ${money(summary.due, business.currency)} outstanding`}
        actions={
          <>
            <Button onClick={exportCsv}>
              <Download size={15} />
              Export CSV
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              <Plus size={15} />
              Create invoice
            </Button>
          </>
        }
      />

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
              placeholder="Search by invoice number or customer…"
              className="pl-9"
              aria-label="Search invoices"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-auto min-w-[150px]"
            aria-label="Filter by status"
          >
            <option>All</option>
            <option>Unpaid</option>
            <option>Draft</option>
            <option>Sent</option>
            <option>Partially Paid</option>
            <option>Paid</option>
            <option>Overdue</option>
            <option>Cancelled</option>
          </Select>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<FileText size={22} />}
            title={
              query || status !== "All" ? "No matching invoices" : "No invoices yet"
            }
            message={
              query || status !== "All"
                ? "Try a different search or clear the status filter."
                : "Raise your first invoice and start getting paid."
            }
            action={
              <Button variant="primary" onClick={() => setFormOpen(true)}>
                <Plus size={15} />
                Create invoice
              </Button>
            }
          />
        ) : (
          <>
            <TableShell>
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Customer</Th>
                  <Th>Issued</Th>
                  <Th>Due</Th>
                  <Th className="text-right">Total</Th>
                  <Th className="text-right">Balance</Th>
                  <Th>Status</Th>
                  <Th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {paged.map((inv) => {
                  const c = customerFor(inv.customerId);
                  const balance = invoiceBalance(inv, payments);
                  const state = effectiveStatus(inv);
                  const overdue = state === "Overdue";
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <Td>
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-medium text-brand-600 hover:text-brand-700"
                        >
                          {inv.number}
                        </Link>
                      </Td>
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
                      <Td className="whitespace-nowrap text-slate-500">
                        {shortDate(inv.issueDate)}
                      </Td>
                      <Td
                        className={`whitespace-nowrap ${overdue ? "font-medium text-rose-600" : "text-slate-500"}`}
                      >
                        {shortDate(inv.dueDate)}
                      </Td>
                      <Td className="text-right tnum font-medium text-slate-900">
                        {money(invoiceTotal(inv), business.currency)}
                      </Td>
                      <Td className="text-right tnum">
                        {balance > 0 ? (
                          <span
                            className={
                              overdue
                                ? "font-medium text-rose-600"
                                : "font-medium text-amber-700"
                            }
                          >
                            {money(balance, business.currency)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </Td>
                      <Td>
                        <StatusBadge status={state} />
                      </Td>
                      <Td>
                        <Menu
                          trigger={({ onClick }) => (
                            <IconButton label="Invoice actions" onClick={onClick}>
                              <MoreHorizontal size={17} />
                            </IconButton>
                          )}
                        >
                          {(close) => (
                            <>
                              <MenuItem
                                onClick={() => {
                                  close();
                                  router.push(`/invoices/${inv.id}`);
                                }}
                              >
                                <Eye size={15} className="text-slate-400" />
                                View invoice
                              </MenuItem>
                              <MenuItem
                                onClick={() => {
                                  close();
                                  setEditing(inv);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil size={15} className="text-slate-400" />
                                Edit
                              </MenuItem>
                              <MenuItem
                                onClick={() => {
                                  close();
                                  const copy = duplicateInvoice(inv.id);
                                  if (copy)
                                    success(
                                      "Invoice duplicated",
                                      `${copy.number} created as a draft.`,
                                    );
                                }}
                              >
                                <Copy size={15} className="text-slate-400" />
                                Duplicate
                              </MenuItem>
                              {can("manage:payments") && balance > 0 && (
                                <MenuItem
                                  onClick={() => {
                                    close();
                                    setPayFor(inv);
                                  }}
                                >
                                  <Download size={15} className="text-slate-400" />
                                  Record payment
                                </MenuItem>
                              )}
                              {balance > 0 && (
                                <MenuItem
                                  onClick={() => {
                                    close();
                                    updateInvoice(inv.id, { status: "Paid" });
                                    success(
                                      "Marked as paid",
                                      `${inv.number} is now settled.`,
                                    );
                                  }}
                                >
                                  <Check size={15} className="text-slate-400" />
                                  Mark as paid
                                </MenuItem>
                              )}
                              <MenuItem
                                danger
                                onClick={() => {
                                  close();
                                  setToDelete(inv);
                                }}
                              >
                                <Trash2 size={15} />
                                Delete
                              </MenuItem>
                            </>
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

      <InvoiceFormModal
        open={formOpen}
        invoice={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
        onSaved={(inv) => {
          if (!editing) router.push(`/invoices/${inv.id}`);
        }}
      />
      <PaymentFormModal
        open={!!payFor}
        defaultInvoiceId={payFor?.id}
        onClose={() => setPayFor(undefined)}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete invoice"
        message={`Delete ${toDelete?.number}? Payments recorded against it will be kept but unlinked. This can't be undone.`}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteInvoice(toDelete.id);
            success("Invoice deleted", `${toDelete.number} has been removed.`);
          }
          setToDelete(null);
        }}
      />
    </>
  );
}
