"use client";

import {
  ArrowLeft,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShoppingCart,
  StickyNote,
  Trash2,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CustomerFormModal,
  InvoiceFormModal,
  OrderFormModal,
  PaymentFormModal,
} from "@/components/modals";
import { RequirePermission } from "@/components/shell";
import { useToast } from "@/components/toast";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  StatusBadge,
  TableShell,
  Td,
  Textarea,
  Th,
} from "@/components/ui";
import { dateTime, money, relativeTime, shortDate } from "@/lib/format";
import {
  customerStats,
  effectiveStatus,
  invoiceBalance,
  invoiceTotal,
  orderTotal,
} from "@/lib/selectors";
import { useStore } from "@/lib/store";

type Tab = "overview" | "financial" | "activity" | "notes";

export default function CustomerDetailPage() {
  return (
    <RequirePermission permission="manage:customers">
      <CustomerDetail />
    </RequirePermission>
  );
}

function CustomerDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const {
    customers,
    employees,
    invoices,
    orders,
    payments,
    business,
    can,
    deleteCustomer,
    addCustomerNote,
  } = store;
  const { success } = useToast();

  const customer = customers.find((c) => c.id === params.id);

  const [tab, setTab] = useState<Tab>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [note, setNote] = useState("");

  const stats = useMemo(
    () => (customer ? customerStats(store, customer.id) : null),
    [store, customer],
  );

  const custInvoices = useMemo(
    () =>
      invoices
        .filter((i) => i.customerId === params.id)
        .sort((a, b) => +new Date(b.issueDate) - +new Date(a.issueDate)),
    [invoices, params.id],
  );
  const custOrders = useMemo(
    () =>
      orders
        .filter((o) => o.customerId === params.id)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders, params.id],
  );
  const custPayments = useMemo(
    () =>
      payments
        .filter((p) => p.customerId === params.id)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [payments, params.id],
  );

  if (!customer || !stats) {
    return (
      <EmptyState
        title="Customer not found"
        message="This customer may have been deleted."
        action={
          <Link href="/customers">
            <Button variant="primary">Back to customers</Button>
          </Link>
        }
      />
    );
  }

  const owner = employees.find((e) => e.id === customer.ownerEmployeeId);
  const showMoney = can("view:financials");

  const TABS: [Tab, string][] = [
    ["overview", "Overview"],
    ...((showMoney ? [["financial", "Financial"]] : []) as [Tab, string][]),
    ["activity", "Activity"],
    ["notes", `Notes (${customer.notes.length})`],
  ];

  return (
    <>
      <Link
        href="/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft size={15} />
        Back to customers
      </Link>

      {/* header */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar name={customer.name} hue={200} size={56} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                  {customer.name}
                </h1>
                <StatusBadge status={customer.status} />
              </div>
              {customer.company && (
                <p className="mt-0.5 text-sm text-slate-600">{customer.company}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-slate-500">
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-brand-600"
                  >
                    <Mail size={14} />
                    {customer.email}
                  </a>
                )}
                {customer.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={14} />
                    {customer.phone}
                  </span>
                )}
                {(customer.city || customer.country) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} />
                    {[customer.city, customer.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
              {customer.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {customer.tags.map((t) => (
                    <Badge key={t} tone="blue">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil size={15} />
              Edit
            </Button>
            {customer.email && (
              <a href={`mailto:${customer.email}`}>
                <Button size="sm">
                  <Mail size={15} />
                  Send email
                </Button>
              </a>
            )}
            {can("manage:orders") && (
              <Button size="sm" onClick={() => setOrderOpen(true)}>
                <ShoppingCart size={15} />
                Create order
              </Button>
            )}
            {can("manage:payments") && (
              <Button size="sm" onClick={() => setPaymentOpen(true)}>
                <CreditCard size={15} />
                Record payment
              </Button>
            )}
            {can("manage:invoices") && (
              <Button size="sm" variant="primary" onClick={() => setInvoiceOpen(true)}>
                <FileText size={15} />
                Create invoice
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete customer"
            >
              <Trash2 size={15} className="text-rose-500" />
            </Button>
          </div>
        </div>

        {showMoney && (
          <div className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-3">
            <Metric
              label="Total purchases"
              value={money(stats.totalPurchases, business.currency)}
              hint={`${stats.invoices} invoice${stats.invoices === 1 ? "" : "s"}`}
            />
            <Metric
              label="Total paid"
              value={money(stats.totalPaid, business.currency)}
              hint={`${custPayments.length} payment${custPayments.length === 1 ? "" : "s"}`}
              tone="good"
            />
            <Metric
              label="Outstanding"
              value={money(stats.outstanding, business.currency)}
              hint={stats.outstanding > 0 ? "Awaiting payment" : "Fully settled"}
              tone={stats.outstanding > 0 ? "warn" : "neutral"}
            />
          </div>
        )}
      </Card>

      {/* tabs */}
      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Contact information" />
              <dl className="divide-y divide-slate-100">
                {[
                  ["Contact name", customer.name],
                  ["Company", customer.company || "—"],
                  ["Email", customer.email || "—"],
                  ["Phone", customer.phone || "—"],
                  ["Account owner", owner?.name ?? "Unassigned"],
                  ["Customer since", shortDate(customer.createdAt)],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-start justify-between gap-4 px-5 py-3"
                  >
                    <dt className="text-[13px] text-slate-500">{k}</dt>
                    <dd className="text-right text-[13px] font-medium text-slate-800">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card>
              <CardHeader title="Address" />
              <div className="px-5 py-4">
                {customer.addressLine ||
                customer.city ||
                customer.state ||
                customer.postalCode ? (
                  <address className="text-sm not-italic leading-relaxed text-slate-700">
                    {customer.addressLine && (
                      <>
                        {customer.addressLine}
                        <br />
                      </>
                    )}
                    {[customer.city, customer.state].filter(Boolean).join(", ")}
                    {customer.postalCode ? ` ${customer.postalCode}` : ""}
                    <br />
                    {customer.country}
                  </address>
                ) : (
                  <p className="text-sm text-slate-500">
                    No address on file yet.
                  </p>
                )}
              </div>

              <CardHeader title="Latest note" className="border-t" />
              <div className="px-5 py-4">
                {customer.notes[0] ? (
                  <>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {customer.notes[0].body}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {customer.notes[0].author} ·{" "}
                      {relativeTime(customer.notes[0].createdAt)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    No notes yet. Add one from the Notes tab.
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}

        {tab === "financial" && showMoney && (
          <Card>
            <CardHeader
              title="Invoices"
              subtitle={`${custInvoices.length} invoice${custInvoices.length === 1 ? "" : "s"} for this customer`}
            />
            {custInvoices.length === 0 ? (
              <EmptyState
                icon={<FileText size={22} />}
                title="No invoices yet"
                message="Raise the first invoice for this customer."
                action={
                  <Button variant="primary" onClick={() => setInvoiceOpen(true)}>
                    Create invoice
                  </Button>
                }
              />
            ) : (
              <TableShell>
                <thead>
                  <tr>
                    <Th>Invoice</Th>
                    <Th>Issued</Th>
                    <Th>Due</Th>
                    <Th className="text-right">Total</Th>
                    <Th className="text-right">Balance</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {custInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <Td>
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-medium text-brand-600 hover:text-brand-700"
                        >
                          {inv.number}
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap text-slate-500">
                        {shortDate(inv.issueDate)}
                      </Td>
                      <Td className="whitespace-nowrap text-slate-500">
                        {shortDate(inv.dueDate)}
                      </Td>
                      <Td className="text-right tnum font-medium text-slate-900">
                        {money(invoiceTotal(inv), business.currency)}
                      </Td>
                      <Td className="text-right tnum">
                        {invoiceBalance(inv, payments) > 0 ? (
                          <span className="font-medium text-amber-700">
                            {money(invoiceBalance(inv, payments), business.currency)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </Td>
                      <Td>
                        <StatusBadge status={effectiveStatus(inv)} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}

            <CardHeader title="Payments" className="border-t" />
            {custPayments.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-500">
                No payments recorded yet.
              </p>
            ) : (
              <TableShell>
                <thead>
                  <tr>
                    <Th>Payment</Th>
                    <Th>Date</Th>
                    <Th>Method</Th>
                    <Th>Reference</Th>
                    <Th className="text-right">Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {custPayments.map((p) => {
                    const inv = invoices.find((i) => i.id === p.invoiceId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <Td>
                          <span className="font-medium text-slate-900">
                            {p.number}
                          </span>
                          {inv && (
                            <span className="block text-xs text-slate-500">
                              against {inv.number}
                            </span>
                          )}
                        </Td>
                        <Td className="whitespace-nowrap text-slate-500">
                          {shortDate(p.date)}
                        </Td>
                        <Td>{p.method}</Td>
                        <Td className="text-slate-500">{p.reference || "—"}</Td>
                        <Td className="text-right tnum font-medium text-emerald-700">
                          {money(p.amount, business.currency)}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableShell>
            )}
          </Card>
        )}

        {tab === "activity" && (
          <Card>
            <CardHeader
              title="Orders"
              subtitle={`${custOrders.length} order${custOrders.length === 1 ? "" : "s"}`}
            />
            {custOrders.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart size={22} />}
                title="No orders yet"
                message="Create the first order for this customer."
                action={
                  can("manage:orders") ? (
                    <Button variant="primary" onClick={() => setOrderOpen(true)}>
                      Create order
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <TableShell>
                <thead>
                  <tr>
                    <Th>Order</Th>
                    <Th>Date</Th>
                    <Th>Items</Th>
                    {showMoney && <Th className="text-right">Total</Th>}
                    <Th>Status</Th>
                    <Th>Created by</Th>
                  </tr>
                </thead>
                <tbody>
                  {custOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <Td className="font-medium text-slate-900">{o.number}</Td>
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
                        <StatusBadge status={o.status} />
                      </Td>
                      <Td className="text-slate-500">{o.createdBy}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
          </Card>
        )}

        {tab === "notes" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <Card>
              <CardHeader title="Add a note" />
              <div className="p-5">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Renewal conversation scheduled for next quarter…"
                />
                <Button
                  variant="primary"
                  className="mt-3 w-full"
                  disabled={!note.trim()}
                  onClick={() => {
                    addCustomerNote(customer.id, note.trim());
                    setNote("");
                    success("Note added", "Saved to this customer's timeline.");
                  }}
                >
                  <Plus size={15} />
                  Add note
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Notes"
                subtitle={`${customer.notes.length} note${customer.notes.length === 1 ? "" : "s"}`}
              />
              {customer.notes.length === 0 ? (
                <EmptyState
                  icon={<StickyNote size={22} />}
                  title="No notes yet"
                  message="Capture conversations, requirements and follow-ups here."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {customer.notes.map((n) => (
                    <li key={n.id} className="px-5 py-4">
                      <p className="text-sm leading-relaxed text-slate-700">
                        {n.body}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {n.author} · {dateTime(n.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>

      <CustomerFormModal
        open={editOpen}
        customer={customer}
        onClose={() => setEditOpen(false)}
      />
      <InvoiceFormModal
        open={invoiceOpen}
        defaultCustomerId={customer.id}
        onClose={() => setInvoiceOpen(false)}
        onSaved={(inv) => router.push(`/invoices/${inv.id}`)}
      />
      <OrderFormModal
        open={orderOpen}
        defaultCustomerId={customer.id}
        onClose={() => setOrderOpen(false)}
      />
      <PaymentFormModal
        open={paymentOpen}
        defaultCustomerId={customer.id}
        onClose={() => setPaymentOpen(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete customer"
        message={`Delete ${customer.name}? This can't be undone.`}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteCustomer(customer.id);
          success("Customer deleted", `${customer.name} has been removed.`);
          router.push("/customers");
        }}
      />
    </>
  );
}

function Metric({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : "text-slate-900";
  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3">
      <p className="text-[13px] text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tracking-tight ${color}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
