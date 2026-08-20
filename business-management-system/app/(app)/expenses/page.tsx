"use client";

import {
  Download,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ExpenseFormModal } from "@/components/modals";
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
import type { Expense, ExpenseCategory } from "@/lib/types";

const PAGE_SIZE = 10;
const CATEGORIES: ExpenseCategory[] = [
  "Salary",
  "Rent",
  "Utilities",
  "Software",
  "Marketing",
  "Travel",
  "Equipment",
  "Other",
];

export default function ExpensesPage() {
  return (
    <RequirePermission permission="manage:expenses">
      <ExpensesView />
    </RequirePermission>
  );
}

function ExpensesView() {
  const { expenses, business, deleteExpense } = useStore();
  const { success } = useToast();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | undefined>();
  const [toDelete, setToDelete] = useState<Expense | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses
      .filter((e) => (category === "All" ? true : e.category === category))
      .filter(
        (e) =>
          !q ||
          e.title.toLowerCase().includes(q) ||
          e.vendor.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q),
      )
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [expenses, query, category]);

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = rows.reduce((s, e) => s + e.amount, 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of rows) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const maxCategory = Math.max(...byCategory.map(([, v]) => v), 1);

  function exportCsv() {
    downloadCsv(
      "expenses",
      ["Title", "Category", "Date", "Vendor", "Method", "Amount", "Receipt", "Description"],
      rows.map((e) => [
        e.title,
        e.category,
        new Date(e.date).toISOString().slice(0, 10),
        e.vendor,
        e.method,
        e.amount,
        e.receiptName ?? "",
        e.description,
      ]),
    );
    success("Export ready", `${rows.length} expenses exported to CSV.`);
  }

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={`${money(total, business.currency)} across ${rows.length} records`}
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
              Add expense
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Card className="p-5">
          <p className="text-[13px] font-medium text-slate-500">
            Spend by category
          </p>
          {byCategory.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No expenses recorded yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {byCategory.slice(0, 6).map(([cat, amount]) => (
                <li key={cat}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-medium text-slate-700">
                      {cat}
                    </span>
                    <span className="tnum text-[13px] font-semibold text-slate-900">
                      {money(amount, business.currency)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, (amount / maxCategory) * 100)}%`,
                        background: "var(--series-expenses)",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-slate-500">
                  Total expenses
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {money(total, business.currency)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Across every category
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Receipt size={18} />
              </span>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[13px] font-medium text-slate-500">
              Largest expense
            </p>
            {rows.length > 0 ? (
              <>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {money(
                    Math.max(...rows.map((e) => e.amount)),
                    business.currency,
                  )}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {
                    rows.reduce((a, b) => (a.amount > b.amount ? a : b)).title
                  }
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">—</p>
            )}
          </Card>

          <Card className="p-5 sm:col-span-2">
            <p className="text-[13px] font-medium text-slate-500">
              Receipts attached
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {rows.filter((e) => e.receiptName).length}
              <span className="text-base font-normal text-slate-400">
                {" "}
                / {rows.length}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Attach receipts so your accountant has everything at year end.
            </p>
          </Card>
        </div>
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
              placeholder="Search by title, vendor or description…"
              className="pl-9"
              aria-label="Search expenses"
            />
          </div>
          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-auto min-w-[150px]"
            aria-label="Filter by category"
          >
            <option>All</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Receipt size={22} />}
            title={
              query || category !== "All" ? "No matching expenses" : "No expenses yet"
            }
            message={
              query || category !== "All"
                ? "Try a different search or clear the category filter."
                : "Record rent, salaries, software and travel to see your true profit."
            }
            action={
              <Button variant="primary" onClick={() => setFormOpen(true)}>
                <Plus size={15} />
                Add expense
              </Button>
            }
          />
        ) : (
          <>
            <TableShell>
              <thead>
                <tr>
                  <Th>Expense</Th>
                  <Th>Category</Th>
                  <Th>Vendor</Th>
                  <Th>Date</Th>
                  <Th>Method</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {paged.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <Td>
                      <span className="flex items-center gap-2">
                        <span className="max-w-[240px] truncate font-medium text-slate-900">
                          {e.title}
                        </span>
                        {e.receiptName && (
                          <Paperclip
                            size={14}
                            className="shrink-0 text-slate-400"
                          />
                        )}
                      </span>
                      {e.description && (
                        <span className="mt-0.5 block max-w-[280px] truncate text-xs text-slate-500">
                          {e.description}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <Badge tone="amber">{e.category}</Badge>
                    </Td>
                    <Td className="max-w-[160px] truncate text-slate-600">
                      {e.vendor || "—"}
                    </Td>
                    <Td className="whitespace-nowrap text-slate-500">
                      {shortDate(e.date)}
                    </Td>
                    <Td className="text-slate-600">{e.method}</Td>
                    <Td className="text-right tnum font-semibold text-slate-900">
                      {money(e.amount, business.currency)}
                    </Td>
                    <Td>
                      <Menu
                        trigger={({ onClick }) => (
                          <IconButton label="Expense actions" onClick={onClick}>
                            <MoreHorizontal size={17} />
                          </IconButton>
                        )}
                      >
                        {(close) => (
                          <>
                            <MenuItem
                              onClick={() => {
                                close();
                                setEditing(e);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil size={15} className="text-slate-400" />
                              Edit
                            </MenuItem>
                            <MenuItem
                              danger
                              onClick={() => {
                                close();
                                setToDelete(e);
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
                ))}
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

      <ExpenseFormModal
        open={formOpen}
        expense={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete expense"
        message={`Delete "${toDelete?.title}"? This can't be undone.`}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteExpense(toDelete.id);
            success("Expense deleted", `"${toDelete.title}" has been removed.`);
          }
          setToDelete(null);
        }}
      />
    </>
  );
}
