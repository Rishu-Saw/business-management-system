"use client";

import {
  ArrowLeft,
  Check,
  Copy,
  CreditCard,
  Download,
  Mail,
  Pencil,
  Printer,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { InvoiceFormModal, PaymentFormModal } from "@/components/modals";
import { RequirePermission } from "@/components/shell";
import { useToast } from "@/components/toast";
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import {
  docTotal,
  effectiveStatus,
  invoiceBalance,
  paidAgainst,
} from "@/lib/selectors";
import { useStore } from "@/lib/store";

export default function InvoiceDetailPage() {
  return (
    <RequirePermission permission="manage:invoices">
      <InvoiceDetail />
    </RequirePermission>
  );
}

function InvoiceDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    invoices,
    customers,
    payments,
    business,
    invoiceSettings,
    updateInvoice,
    deleteInvoice,
    duplicateInvoice,
    can,
  } = useStore();
  const { success } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invoice = invoices.find((i) => i.id === params.id);
  const customer = customers.find((c) => c.id === invoice?.customerId);

  const invoicePayments = useMemo(
    () =>
      payments
        .filter((p) => p.invoiceId === params.id)
        .sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [payments, params.id],
  );

  if (!invoice) {
    return (
      <EmptyState
        title="Invoice not found"
        message="This invoice may have been deleted."
        action={
          <Link href="/invoices">
            <Button variant="primary">Back to invoices</Button>
          </Link>
        }
      />
    );
  }

  const totals = docTotal(invoice.items, invoice.discount);
  const paid = paidAgainst(payments, invoice.id);
  const balance = invoiceBalance(invoice, payments);
  const state = effectiveStatus(invoice);

  async function handlePdf() {
    await downloadInvoicePdf({
      invoice: invoice!,
      customer,
      business,
      settings: invoiceSettings,
      amountPaid: paid,
    });
    success("PDF downloaded", `${invoice!.number}.pdf saved to your device.`);
  }

  function handleSend() {
    updateInvoice(invoice!.id, { status: "Sent" });
    const subject = encodeURIComponent(
      `Invoice ${invoice!.number} from ${business.name}`,
    );
    const body = encodeURIComponent(
      `Hi ${customer?.name ?? "there"},\n\nPlease find invoice ${invoice!.number} for ${money(totals.total, business.currency)}, due ${shortDate(invoice!.dueDate)}.\n\n${invoiceSettings.paymentInstructions}\n\nThank you,\n${business.name}`,
    );
    if (customer?.email) {
      window.location.href = `mailto:${customer.email}?subject=${subject}&body=${body}`;
    }
    success(
      "Invoice sent",
      customer?.email
        ? `Marked as sent and opened a draft to ${customer.email}.`
        : "Marked as sent.",
    );
  }

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft size={15} />
          Back to invoices
        </Link>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={15} />
            Edit
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const copy = duplicateInvoice(invoice.id);
              if (copy) {
                success("Invoice duplicated", `${copy.number} created as a draft.`);
                router.push(`/invoices/${copy.id}`);
              }
            }}
          >
            <Copy size={15} />
            Duplicate
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer size={15} />
            Print
          </Button>
          <Button size="sm" onClick={handlePdf}>
            <Download size={15} />
            Download PDF
          </Button>
          {invoice.status === "Draft" && (
            <Button size="sm" onClick={handleSend}>
              <Send size={15} />
              Send by email
            </Button>
          )}
          {balance > 0 && can("manage:payments") && (
            <Button size="sm" variant="primary" onClick={() => setPayOpen(true)}>
              <CreditCard size={15} />
              Record payment
            </Button>
          )}
          {balance > 0 && (
            <Button
              size="sm"
              variant="subtle"
              onClick={() => {
                updateInvoice(invoice.id, { status: "Paid" });
                success("Marked as paid", `${invoice.number} is now settled.`);
              }}
            >
              <Check size={15} />
              Mark as paid
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            aria-label="Delete invoice"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={15} className="text-rose-500" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* the printable document */}
        <Card className="print-area p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white">
                {business.logoInitials}
              </span>
              <div>
                <p className="text-lg font-semibold tracking-tight text-slate-900">
                  {business.name}
                </p>
                <address className="mt-1 text-[13px] not-italic leading-relaxed text-slate-500">
                  {business.addressLine}
                  <br />
                  {business.city}, {business.state} {business.postalCode}
                  <br />
                  {business.phone} · {business.email}
                  {business.taxId && (
                    <>
                      <br />
                      GSTIN: {business.taxId}
                    </>
                  )}
                </address>
              </div>
            </div>

            <div className="text-right">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                INVOICE
              </h1>
              <p className="mt-1 text-sm text-slate-500">{invoice.number}</p>
              <div className="mt-2 flex justify-end">
                <StatusBadge status={state} />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-between gap-6 border-t border-slate-200 pt-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Bill to
              </p>
              <p className="mt-2 text-[15px] font-semibold text-slate-900">
                {customer?.company || customer?.name || "—"}
              </p>
              <address className="mt-1 text-[13px] not-italic leading-relaxed text-slate-600">
                {customer?.company && customer?.name && (
                  <>
                    {customer.name}
                    <br />
                  </>
                )}
                {customer?.addressLine && (
                  <>
                    {customer.addressLine}
                    <br />
                  </>
                )}
                {[customer?.city, customer?.state, customer?.postalCode]
                  .filter(Boolean)
                  .join(", ")}
                <br />
                {customer?.country}
                {customer?.email && (
                  <>
                    <br />
                    {customer.email}
                  </>
                )}
              </address>
            </div>

            <div className="flex gap-10 text-right">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Invoice date
                </p>
                <p className="mt-2 text-[13px] font-medium text-slate-800">
                  {shortDate(invoice.issueDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Due date
                </p>
                <p
                  className={`mt-2 text-[13px] font-medium ${state === "Overdue" ? "text-rose-600" : "text-slate-800"}`}
                >
                  {shortDate(invoice.dueDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3 px-3 text-right">Qty</th>
                  <th className="pb-3 px-3 text-right">Unit price</th>
                  <th className="pb-3 px-3 text-right">Disc</th>
                  <th className="pb-3 px-3 text-right">Tax</th>
                  <th className="pb-3 pl-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((l) => {
                  const gross = l.unitPrice * l.quantity;
                  const net = gross - (gross * l.discount) / 100;
                  return (
                    <tr key={l.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium text-slate-800">
                        {l.name}
                      </td>
                      <td className="py-3 px-3 text-right tnum text-slate-600">
                        {l.quantity}
                      </td>
                      <td className="py-3 px-3 text-right tnum text-slate-600">
                        {money(l.unitPrice, business.currency)}
                      </td>
                      <td className="py-3 px-3 text-right tnum text-slate-600">
                        {l.discount ? `${l.discount}%` : "—"}
                      </td>
                      <td className="py-3 px-3 text-right tnum text-slate-600">
                        {l.taxRate}%
                      </td>
                      <td className="py-3 pl-3 text-right tnum font-medium text-slate-900">
                        {money(net, business.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <dl className="w-full max-w-xs space-y-2.5 text-sm">
              <TotalRow
                label="Subtotal"
                value={money(totals.subtotal, business.currency)}
              />
              {totals.discount > 0 && (
                <TotalRow
                  label="Discount"
                  value={`− ${money(totals.discount, business.currency)}`}
                  tone="rose"
                />
              )}
              <TotalRow label="Tax" value={money(totals.tax, business.currency)} />
              <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                <dt className="font-semibold text-slate-900">Total</dt>
                <dd className="tnum text-lg font-semibold text-slate-900">
                  {money(totals.total, business.currency)}
                </dd>
              </div>
              {paid > 0 && (
                <>
                  <TotalRow
                    label="Amount paid"
                    value={`− ${money(paid, business.currency)}`}
                    tone="emerald"
                  />
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                    <dt className="font-semibold text-slate-900">Balance due</dt>
                    <dd
                      className={`tnum text-lg font-semibold ${balance > 0 ? "text-amber-700" : "text-emerald-700"}`}
                    >
                      {money(balance, business.currency)}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          <div className="mt-8 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Payment instructions
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                {invoiceSettings.paymentInstructions}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Notes
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                {invoice.notes || invoiceSettings.footerMessage}
              </p>
            </div>
          </div>
        </Card>

        {/* side panel */}
        <div className="no-print space-y-6">
          <Card>
            <CardHeader title="Summary" />
            <dl className="divide-y divide-slate-100">
              {[
                ["Status", <StatusBadge key="s" status={state} />],
                ["Total", money(totals.total, business.currency)],
                ["Paid", money(paid, business.currency)],
                ["Balance", money(balance, business.currency)],
                ["Created by", invoice.createdBy],
                [
                  "Customer",
                  customer ? (
                    <Link
                      key="c"
                      href={`/customers/${customer.id}`}
                      className="font-medium text-brand-600 hover:text-brand-700"
                    >
                      {customer.company || customer.name}
                    </Link>
                  ) : (
                    "—"
                  ),
                ],
              ].map(([k, v], idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <dt className="text-[13px] text-slate-500">{k as string}</dt>
                  <dd className="text-right text-[13px] font-medium text-slate-800">
                    {v as React.ReactNode}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader
              title="Payment history"
              subtitle={`${invoicePayments.length} payment${invoicePayments.length === 1 ? "" : "s"}`}
            />
            {invoicePayments.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-500">No payments yet.</p>
                {can("manage:payments") && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-4"
                    onClick={() => setPayOpen(true)}
                  >
                    Record payment
                  </Button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {invoicePayments.map((p) => (
                  <li key={p.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-medium text-slate-800">
                        {p.number}
                      </span>
                      <span className="tnum text-[13px] font-semibold text-emerald-700">
                        {money(p.amount, business.currency)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {shortDate(p.date)} · {p.method}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {customer?.email && (
            <Card className="p-5">
              <p className="text-[13px] font-medium text-slate-800">
                Send to customer
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                Opens your email client with the invoice details pre-filled.
              </p>
              <Button className="mt-4 w-full" onClick={handleSend}>
                <Mail size={15} />
                Email {customer.email}
              </Button>
            </Card>
          )}
        </div>
      </div>

      <InvoiceFormModal
        open={editOpen}
        invoice={invoice}
        onClose={() => setEditOpen(false)}
      />
      <PaymentFormModal
        open={payOpen}
        defaultInvoiceId={invoice.id}
        onClose={() => setPayOpen(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete invoice"
        message={`Delete ${invoice.number}? This can't be undone.`}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteInvoice(invoice.id);
          success("Invoice deleted", `${invoice.number} has been removed.`);
          router.push("/invoices");
        }}
      />
    </>
  );
}

function TotalRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "rose" | "emerald";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`tnum font-medium ${
          tone === "rose"
            ? "text-rose-600"
            : tone === "emerald"
              ? "text-emerald-700"
              : "text-slate-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
