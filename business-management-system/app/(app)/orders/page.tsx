"use client";

import {
  Download,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { InvoiceFormModal, OrderFormModal } from "@/components/modals";
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
  Modal,
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
import { docTotal, orderTotal } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Order, OrderStatus } from "@/lib/types";

const PAGE_SIZE = 10;
const STATUSES: OrderStatus[] = [
  "Draft",
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
];

export default function OrdersPage() {
  return (
    <RequirePermission permission="manage:orders">
      <OrdersView />
    </RequirePermission>
  );
}

function OrdersView() {
  const { orders, customers, invoices, business, deleteOrder, updateOrder, can } =
    useStore();
  const router = useRouter();
  const { success } = useToast();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Order | undefined>();
  const [viewing, setViewing] = useState<Order | null>(null);
  const [invoiceFrom, setInvoiceFrom] = useState<Order | undefined>();
  const [toDelete, setToDelete] = useState<Order | null>(null);

  const showMoney = can("view:financials");

  const customerFor = (id: string) => customers.find((c) => c.id === id);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => (status === "All" ? true : o.status === status))
      .filter((o) => {
        if (!q) return true;
        const c = customerFor(o.customerId);
        return (
          o.number.toLowerCase().includes(q) ||
          (c?.name ?? "").toLowerCase().includes(q) ||
          (c?.company ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, customers, query, status]);

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalValue = rows
    .filter((o) => o.status !== "Cancelled" && o.status !== "Draft")
    .reduce((s, o) => s + orderTotal(o), 0);

  function exportCsv() {
    downloadCsv(
      "orders",
      ["Order", "Customer", "Date", "Items", "Status", "Payment method", "Total"],
      rows.map((o) => {
        const c = customerFor(o.customerId);
        return [
          o.number,
          c ? c.company || c.name : "",
          new Date(o.createdAt).toISOString().slice(0, 10),
          o.items.length,
          o.status,
          o.paymentMethod,
          Math.round(orderTotal(o)),
        ];
      }),
    );
    success("Export ready", `${rows.length} orders exported to CSV.`);
  }

  const invoiceForOrder = (orderId: string) =>
    invoices.find((i) => i.orderId === orderId);

  return (
    <>
      <PageHeader
        title="Sales orders"
        subtitle={
          showMoney
            ? `${rows.length} orders · ${money(totalValue, business.currency)} in confirmed value`
            : `${rows.length} orders`
        }
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
              Create order
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
              placeholder="Search by order number or customer…"
              className="pl-9"
              aria-label="Search orders"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-auto min-w-[140px]"
            aria-label="Filter by status"
          >
            <option>All</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={22} />}
            title={query || status !== "All" ? "No matching orders" : "No orders yet"}
            message={
              query || status !== "All"
                ? "Try a different search or clear the status filter."
                : "Create your first sales order to get started."
            }
            action={
              <Button variant="primary" onClick={() => setFormOpen(true)}>
                <Plus size={15} />
                Create order
              </Button>
            }
          />
        ) : (
          <>
            <TableShell>
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Date</Th>
                  <Th>Items</Th>
                  {showMoney && <Th className="text-right">Total</Th>}
                  <Th>Status</Th>
                  <Th>Invoice</Th>
                  <Th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {paged.map((o) => {
                  const c = customerFor(o.customerId);
                  const inv = invoiceForOrder(o.id);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <Td>
                        <button
                          onClick={() => setViewing(o)}
                          className="font-medium text-brand-600 hover:text-brand-700"
                        >
                          {o.number}
                        </button>
                        <span className="block text-xs text-slate-500">
                          by {o.createdBy}
                        </span>
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
                        {shortDate(o.createdAt)}
                      </Td>
                      <Td className="text-slate-600">{o.items.length}</Td>
                      {showMoney && (
                        <Td className="text-right tnum font-medium text-slate-900">
                          {money(orderTotal(o), business.currency)}
                        </Td>
                      )}
                      <Td>
                        <Select
                          value={o.status}
                          onChange={(e) => {
                            updateOrder(o.id, {
                              status: e.target.value as OrderStatus,
                            });
                            success(
                              "Order updated",
                              `${o.number} is now ${e.target.value}.`,
                            );
                          }}
                          className="h-8 w-auto min-w-[125px] py-0 text-[13px]"
                          aria-label={`Status for ${o.number}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </Select>
                      </Td>
                      <Td>
                        {inv ? (
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
                          >
                            {inv.number}
                          </Link>
                        ) : (
                          <Badge>Not invoiced</Badge>
                        )}
                      </Td>
                      <Td>
                        <Menu
                          trigger={({ onClick }) => (
                            <IconButton label="Order actions" onClick={onClick}>
                              <MoreHorizontal size={17} />
                            </IconButton>
                          )}
                        >
                          {(close) => (
                            <>
                              <MenuItem
                                onClick={() => {
                                  close();
                                  setViewing(o);
                                }}
                              >
                                <FileText size={15} className="text-slate-400" />
                                View details
                              </MenuItem>
                              <MenuItem
                                onClick={() => {
                                  close();
                                  setEditing(o);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil size={15} className="text-slate-400" />
                                Edit
                              </MenuItem>
                              {can("manage:invoices") && !inv && (
                                <MenuItem
                                  onClick={() => {
                                    close();
                                    setInvoiceFrom(o);
                                  }}
                                >
                                  <FileText size={15} className="text-slate-400" />
                                  Convert to invoice
                                </MenuItem>
                              )}
                              <MenuItem
                                danger
                                onClick={() => {
                                  close();
                                  setToDelete(o);
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

      {/* order detail */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Order ${viewing.number}` : ""}
        description={
          viewing
            ? `${shortDate(viewing.createdAt)} · created by ${viewing.createdBy}`
            : undefined
        }
        width="max-w-3xl"
        footer={
          <>
            <Button onClick={() => setViewing(null)}>Close</Button>
            {viewing && can("manage:invoices") && !invoiceForOrder(viewing.id) && (
              <Button
                variant="primary"
                onClick={() => {
                  setInvoiceFrom(viewing);
                  setViewing(null);
                }}
              >
                <FileText size={15} />
                Convert to invoice
              </Button>
            )}
          </>
        }
      >
        {viewing && (
          <OrderDetail
            order={viewing}
            customerName={
              customerFor(viewing.customerId)?.company ??
              customerFor(viewing.customerId)?.name ??
              "Unknown customer"
            }
            showMoney={showMoney}
          />
        )}
      </Modal>

      <OrderFormModal
        open={formOpen}
        order={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
      />
      <InvoiceFormModal
        open={!!invoiceFrom}
        fromOrder={invoiceFrom}
        onClose={() => setInvoiceFrom(undefined)}
        onSaved={(inv) => router.push(`/invoices/${inv.id}`)}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete order"
        message={`Delete ${toDelete?.number}? This can't be undone.`}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteOrder(toDelete.id);
            success("Order deleted", `${toDelete.number} has been removed.`);
          }
          setToDelete(null);
        }}
      />
    </>
  );
}

function OrderDetail({
  order,
  customerName,
  showMoney,
}: {
  order: Order;
  customerName: string;
  showMoney: boolean;
}) {
  const { business } = useStore();
  const totals = docTotal(order.items, order.discount);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Customer", customerName],
          ["Status", order.status],
          ["Payment method", order.paymentMethod],
          ["Line items", String(order.items.length)],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-xs text-slate-500">{k}</p>
            <p className="mt-0.5 text-[13px] font-medium text-slate-800">{v}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto scrollbar-thin rounded-lg border border-slate-200">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5">Item</th>
              <th className="px-4 py-2.5 text-right">Qty</th>
              {showMoney && <th className="px-4 py-2.5 text-right">Unit price</th>}
              {showMoney && <th className="px-4 py-2.5 text-right">Amount</th>}
            </tr>
          </thead>
          <tbody>
            {order.items.map((l) => {
              const gross = l.unitPrice * l.quantity;
              const net = gross - (gross * l.discount) / 100;
              return (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 text-slate-800">
                    {l.name}
                    {l.discount > 0 && (
                      <span className="ml-2 text-xs text-rose-600">
                        −{l.discount}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tnum text-slate-700">
                    {l.quantity}
                  </td>
                  {showMoney && (
                    <td className="px-4 py-2.5 text-right tnum text-slate-700">
                      {money(l.unitPrice, business.currency)}
                    </td>
                  )}
                  {showMoney && (
                    <td className="px-4 py-2.5 text-right tnum font-medium text-slate-900">
                      {money(net, business.currency)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showMoney && (
        <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
          <Row label="Subtotal" value={money(totals.subtotal, business.currency)} />
          <Row
            label="Discount"
            value={`−${money(totals.discount, business.currency)}`}
            tone="rose"
          />
          <Row label="Tax" value={money(totals.tax, business.currency)} />
          <div className="flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="tnum text-base font-semibold text-slate-900">
              {money(totals.total, business.currency)}
            </span>
          </div>
        </div>
      )}

      {order.notes && (
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Notes</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-700">
            {order.notes}
          </p>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "rose";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span
        className={`tnum font-medium ${tone === "rose" ? "text-rose-600" : "text-slate-800"}`}
      >
        {value}
      </span>
    </div>
  );
}
