"use client";

import {
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CustomerFormModal,
  InvoiceFormModal,
  PaymentFormModal,
} from "@/components/modals";
import { RequirePermission } from "@/components/shell";
import { useToast } from "@/components/toast";
import {
  Avatar,
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
  StatusBadge,
  TableShell,
  Td,
  Th,
} from "@/components/ui";
import { downloadCsv } from "@/lib/export";
import { money, relativeTime } from "@/lib/format";
import { customerStats } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Customer } from "@/lib/types";

type SortKey = "name" | "company" | "purchases" | "outstanding" | "activity";

const PAGE_SIZE = 10;

export default function CustomersPage() {
  return (
    <RequirePermission permission="manage:customers">
      <CustomersView />
    </RequirePermission>
  );
}

function CustomersView() {
  const store = useStore();
  const { customers, business, deleteCustomer, can } = store;
  const router = useRouter();
  const { success } = useToast();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState<SortKey>("activity");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Customer | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [invoiceFor, setInvoiceFor] = useState<string | undefined>();
  const [paymentFor, setPaymentFor] = useState<string | undefined>();
  const [toDelete, setToDelete] = useState<Customer | null>(null);

  const showMoney = can("view:financials");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = customers
      .filter((c) => (status === "All" ? true : c.status === status))
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q),
      )
      .map((c) => ({ customer: c, stats: customerStats(store, c.id) }));

    const factor = dir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.customer.name.localeCompare(b.customer.name) * factor;
        case "company":
          return a.customer.company.localeCompare(b.customer.company) * factor;
        case "purchases":
          return (a.stats.totalPurchases - b.stats.totalPurchases) * factor;
        case "outstanding":
          return (a.stats.outstanding - b.stats.outstanding) * factor;
        default:
          return (
            (+new Date(a.stats.lastActivity ?? 0) -
              +new Date(b.stats.lastActivity ?? 0)) *
            factor
          );
      }
    });
    return list;
  }, [customers, store, query, status, sort, dir]);

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir(key === "name" || key === "company" ? "asc" : "desc");
    }
    setPage(1);
  }

  function exportCsv() {
    downloadCsv(
      "customers",
      ["Name", "Company", "Email", "Phone", "City", "Status", "Total purchases", "Outstanding", "Last activity"],
      rows.map((r) => [
        r.customer.name,
        r.customer.company,
        r.customer.email,
        r.customer.phone,
        r.customer.city,
        r.customer.status,
        Math.round(r.stats.totalPurchases),
        Math.round(r.stats.outstanding),
        r.stats.lastActivity ? new Date(r.stats.lastActivity).toISOString().slice(0, 10) : "",
      ]),
    );
    success("Export ready", `${rows.length} customers exported to CSV.`);
  }

  const sortedBy = (key: SortKey) => (sort === key ? dir : null);

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} customers in your CRM`}
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
              <UserPlus size={15} />
              Add customer
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
              placeholder="Search by name, company, email or phone…"
              className="pl-9"
              aria-label="Search customers"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-auto min-w-[130px]"
            aria-label="Filter by status"
          >
            <option>All</option>
            <option>Active</option>
            <option>Lead</option>
            <option>Inactive</option>
          </Select>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title={query || status !== "All" ? "No matching customers" : "No customers yet"}
            message={
              query || status !== "All"
                ? "Try a different search term or clear the status filter."
                : "Add your first customer to start raising orders and invoices."
            }
            action={
              query || status !== "All" ? (
                <Button
                  onClick={() => {
                    setQuery("");
                    setStatus("All");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setFormOpen(true)}>
                  <UserPlus size={15} />
                  Add customer
                </Button>
              )
            }
          />
        ) : (
          <>
            <TableShell>
              <thead>
                <tr>
                  <Th onClick={() => toggleSort("name")} sorted={sortedBy("name")}>
                    Name
                  </Th>
                  <Th onClick={() => toggleSort("company")} sorted={sortedBy("company")}>
                    Company
                  </Th>
                  <Th>Contact</Th>
                  {showMoney && (
                    <Th
                      className="text-right"
                      onClick={() => toggleSort("purchases")}
                      sorted={sortedBy("purchases")}
                    >
                      Total purchases
                    </Th>
                  )}
                  {showMoney && (
                    <Th
                      className="text-right"
                      onClick={() => toggleSort("outstanding")}
                      sorted={sortedBy("outstanding")}
                    >
                      Outstanding
                    </Th>
                  )}
                  <Th onClick={() => toggleSort("activity")} sorted={sortedBy("activity")}>
                    Last activity
                  </Th>
                  <Th>Status</Th>
                  <Th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {paged.map(({ customer: c, stats }) => (
                  <tr key={c.id} className="group hover:bg-slate-50">
                    <Td>
                      <Link
                        href={`/customers/${c.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar name={c.name} hue={200} size={34} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900 group-hover:text-brand-700">
                            {c.name}
                          </span>
                          {c.tags.length > 0 && (
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {c.tags.join(" · ")}
                            </span>
                          )}
                        </span>
                      </Link>
                    </Td>
                    <Td className="max-w-[180px] truncate">{c.company || "—"}</Td>
                    <Td>
                      <span className="block truncate text-slate-700">
                        {c.email || "—"}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {c.phone || ""}
                      </span>
                    </Td>
                    {showMoney && (
                      <Td className="text-right tnum font-medium text-slate-900">
                        {money(stats.totalPurchases, business.currency)}
                      </Td>
                    )}
                    {showMoney && (
                      <Td className="text-right tnum">
                        {stats.outstanding > 0 ? (
                          <span className="font-medium text-amber-700">
                            {money(stats.outstanding, business.currency)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </Td>
                    )}
                    <Td className="whitespace-nowrap text-slate-500">
                      {stats.lastActivity ? relativeTime(stats.lastActivity) : "No activity"}
                    </Td>
                    <Td>
                      <StatusBadge status={c.status} />
                    </Td>
                    <Td>
                      <Menu
                        trigger={({ onClick }) => (
                          <IconButton label="Customer actions" onClick={onClick}>
                            <MoreHorizontal size={17} />
                          </IconButton>
                        )}
                      >
                        {(close) => (
                          <>
                            <MenuItem
                              onClick={() => {
                                close();
                                router.push(`/customers/${c.id}`);
                              }}
                            >
                              <Eye size={15} className="text-slate-400" />
                              View profile
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                close();
                                setEditing(c);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil size={15} className="text-slate-400" />
                              Edit
                            </MenuItem>
                            {can("manage:invoices") && (
                              <MenuItem
                                onClick={() => {
                                  close();
                                  setInvoiceFor(c.id);
                                }}
                              >
                                <FileText size={15} className="text-slate-400" />
                                Create invoice
                              </MenuItem>
                            )}
                            {can("manage:payments") && (
                              <MenuItem
                                onClick={() => {
                                  close();
                                  setPaymentFor(c.id);
                                }}
                              >
                                <Download size={15} className="text-slate-400" />
                                Record payment
                              </MenuItem>
                            )}
                            <MenuItem
                              danger
                              onClick={() => {
                                close();
                                setToDelete(c);
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

      <CustomerFormModal
        open={formOpen}
        customer={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
      />
      <InvoiceFormModal
        open={!!invoiceFor}
        defaultCustomerId={invoiceFor}
        onClose={() => setInvoiceFor(undefined)}
        onSaved={(inv) => router.push(`/invoices/${inv.id}`)}
      />
      <PaymentFormModal
        open={!!paymentFor}
        defaultCustomerId={paymentFor}
        onClose={() => setPaymentFor(undefined)}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete customer"
        message={`Delete ${toDelete?.name}? Their invoices and payments stay in your records, but the customer profile will be removed. This can't be undone.`}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteCustomer(toDelete.id);
            success("Customer deleted", `${toDelete.name} has been removed.`);
          }
          setToDelete(null);
        }}
      />
    </>
  );
}
