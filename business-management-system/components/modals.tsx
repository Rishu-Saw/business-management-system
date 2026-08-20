"use client";

import { useState, type ReactNode } from "react";
import {
  CustomerForm,
  EmployeeForm,
  ExpenseForm,
  InvoiceForm,
  ItemForm,
  OrderForm,
  PaymentForm,
} from "./forms";
import { Modal } from "./ui";
import type {
  Customer,
  Employee,
  Expense,
  Invoice,
  Item,
  Order,
  Payment,
} from "@/lib/types";

/**
 * Thin wrappers that pair each entity form with a modal shell. The form pushes
 * its own footer buttons up through `renderFooter` so validation lives with the
 * fields rather than in every page that opens the dialog.
 */

interface Base {
  open: boolean;
  onClose: () => void;
}

export function CustomerFormModal({
  open,
  onClose,
  customer,
  onSaved,
}: Base & { customer?: Customer; onSaved?: (c: Customer) => void }) {
  const [footer, setFooter] = useState<ReactNode>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer ? "Edit customer" : "Add customer"}
      description={
        customer
          ? "Update this customer's contact and account details."
          : "Create a new customer record in your CRM."
      }
      width="max-w-2xl"
      footer={footer}
    >
      {open && (
        <CustomerForm
          customer={customer}
          renderFooter={setFooter}
          onCancel={onClose}
          onDone={(c) => {
            onSaved?.(c);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

export function ItemFormModal({
  open,
  onClose,
  item,
  defaultKind,
  onSaved,
}: Base & {
  item?: Item;
  defaultKind?: Item["kind"];
  onSaved?: () => void;
}) {
  const [footer, setFooter] = useState<ReactNode>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? `Edit ${item.kind.toLowerCase()}` : "Add product or service"}
      description={
        item
          ? "Update pricing, tax and stock details."
          : "Add something you sell so it can be used on orders and invoices."
      }
      width="max-w-2xl"
      footer={footer}
    >
      {open && (
        <ItemForm
          item={item}
          defaultKind={defaultKind}
          renderFooter={setFooter}
          onCancel={onClose}
          onDone={() => {
            onSaved?.();
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

export function OrderFormModal({
  open,
  onClose,
  order,
  defaultCustomerId,
  onSaved,
}: Base & {
  order?: Order;
  defaultCustomerId?: string;
  onSaved?: (o: Order) => void;
}) {
  const [footer, setFooter] = useState<ReactNode>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={order ? `Edit order ${order.number}` : "Create order"}
      description="Pick a customer, add line items, and the totals calculate themselves."
      width="max-w-4xl"
      footer={footer}
    >
      {open && (
        <OrderForm
          order={order}
          defaultCustomerId={defaultCustomerId}
          renderFooter={setFooter}
          onCancel={onClose}
          onDone={(o) => {
            onSaved?.(o);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

export function InvoiceFormModal({
  open,
  onClose,
  invoice,
  fromOrder,
  defaultCustomerId,
  onSaved,
}: Base & {
  invoice?: Invoice;
  fromOrder?: Order;
  defaultCustomerId?: string;
  onSaved?: (i: Invoice) => void;
}) {
  const [footer, setFooter] = useState<ReactNode>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        invoice
          ? `Edit invoice ${invoice.number}`
          : fromOrder
            ? `Invoice for ${fromOrder.number}`
            : "Create invoice"
      }
      description="Line items, tax and discounts roll up into the total automatically."
      width="max-w-4xl"
      footer={footer}
    >
      {open && (
        <InvoiceForm
          invoice={invoice}
          fromOrder={fromOrder}
          defaultCustomerId={defaultCustomerId}
          renderFooter={setFooter}
          onCancel={onClose}
          onDone={(i) => {
            onSaved?.(i);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

export function PaymentFormModal({
  open,
  onClose,
  defaultCustomerId,
  defaultInvoiceId,
  onSaved,
}: Base & {
  defaultCustomerId?: string;
  defaultInvoiceId?: string;
  onSaved?: (p: Payment) => void;
}) {
  const [footer, setFooter] = useState<ReactNode>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
      description="Full or partial — the invoice status updates on its own."
      width="max-w-2xl"
      footer={footer}
    >
      {open && (
        <PaymentForm
          defaultCustomerId={defaultCustomerId}
          defaultInvoiceId={defaultInvoiceId}
          renderFooter={setFooter}
          onCancel={onClose}
          onDone={(p) => {
            onSaved?.(p);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

export function ExpenseFormModal({
  open,
  onClose,
  expense,
  onSaved,
}: Base & { expense?: Expense; onSaved?: () => void }) {
  const [footer, setFooter] = useState<ReactNode>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? "Edit expense" : "Add expense"}
      description="Keep costs categorised so your profit figure stays accurate."
      width="max-w-2xl"
      footer={footer}
    >
      {open && (
        <ExpenseForm
          expense={expense}
          renderFooter={setFooter}
          onCancel={onClose}
          onDone={() => {
            onSaved?.();
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

export function EmployeeFormModal({
  open,
  onClose,
  employee,
  onSaved,
}: Base & { employee?: Employee; onSaved?: () => void }) {
  const [footer, setFooter] = useState<ReactNode>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? "Edit employee" : "Add employee"}
      description="Assign a role to control what this person can access."
      width="max-w-2xl"
      footer={footer}
    >
      {open && (
        <EmployeeForm
          employee={employee}
          renderFooter={setFooter}
          onCancel={onClose}
          onDone={() => {
            onSaved?.();
            onClose();
          }}
        />
      )}
    </Modal>
  );
}
