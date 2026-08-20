"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast";
import { CURRENCY_SYMBOL, inputDate, money } from "@/lib/format";
import { docTotal, invoiceBalance, invoiceTotal } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type {
  Customer,
  Employee,
  Expense,
  ExpenseCategory,
  Invoice,
  Item,
  LineItem,
  Order,
  Payment,
  PaymentMethod,
  Role,
} from "@/lib/types";
import { LineItemsEditor, newLine } from "./line-items";
import { Button, Field, Input, Select, Textarea } from "./ui";

const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Bank Transfer",
  "UPI",
  "Card",
  "Other",
];

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Salary",
  "Rent",
  "Utilities",
  "Software",
  "Marketing",
  "Travel",
  "Equipment",
  "Other",
];

const ROLES: Role[] = ["Owner", "Admin", "Manager", "Employee"];

function Footer({
  onCancel,
  submitLabel,
  onSubmit,
}: {
  onCancel: () => void;
  submitLabel: string;
  onSubmit: () => void;
}) {
  return (
    <>
      <Button onClick={onCancel}>Cancel</Button>
      <Button variant="primary" onClick={onSubmit}>
        {submitLabel}
      </Button>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Customer                                                                    */
/* -------------------------------------------------------------------------- */

const EMPTY_CUSTOMER = {
  name: "",
  company: "",
  email: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  status: "Active" as Customer["status"],
  tags: "",
  ownerEmployeeId: "",
};

export function CustomerForm({
  customer,
  onDone,
  onCancel,
  renderFooter,
}: {
  customer?: Customer;
  onDone: (c: Customer) => void;
  onCancel: () => void;
  renderFooter: (footer: React.ReactNode) => void;
}) {
  const { addCustomer, updateCustomer, employees, business, session } = useStore();
  const { success } = useToast();
  const [form, setForm] = useState({ ...EMPTY_CUSTOMER, country: business.country });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name,
        company: customer.company,
        email: customer.email,
        phone: customer.phone,
        addressLine: customer.addressLine,
        city: customer.city,
        state: customer.state,
        postalCode: customer.postalCode,
        country: customer.country,
        status: customer.status,
        tags: customer.tags.join(", "),
        ownerEmployeeId: customer.ownerEmployeeId,
      });
    } else {
      setForm({
        ...EMPTY_CUSTOMER,
        country: business.country,
        ownerEmployeeId: session?.employeeId ?? employees[0]?.id ?? "",
      });
    }
    setErrors({});
  }, [customer, business.country, session, employees]);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Customer name is required";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Enter a valid email address";
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      addressLine: form.addressLine.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country,
      status: form.status,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      ownerEmployeeId: form.ownerEmployeeId,
    };

    if (customer) {
      updateCustomer(customer.id, payload);
      success("Customer updated", `${payload.name} has been saved.`);
      onDone({ ...customer, ...payload });
    } else {
      const created = addCustomer({
        ...payload,
        notes: [],
        createdAt: new Date().toISOString(),
      });
      success("Customer added", `${created.name} is now in your CRM.`);
      onDone(created);
    }
  }

  useEffect(() => {
    renderFooter(
      <Footer
        onCancel={onCancel}
        onSubmit={submit}
        submitLabel={customer ? "Save changes" : "Add customer"}
      />,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, customer]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name" error={errors.name} required>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            invalid={!!errors.name}
            placeholder="Priya Iyer"
          />
        </Field>
        <Field label="Company">
          <Input
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            placeholder="Lumen Analytics"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            invalid={!!errors.email}
            placeholder="priya@lumen.com"
          />
        </Field>
        <Field label="Phone">
          <Input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+91 98765 43210"
          />
        </Field>
      </div>

      <Field label="Address">
        <Input
          value={form.addressLine}
          onChange={(e) => set("addressLine", e.target.value)}
          placeholder="12, Brigade Road"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City">
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="State">
          <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
        </Field>
        <Field label="Postal code">
          <Input
            value={form.postalCode}
            onChange={(e) => set("postalCode", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option>Active</option>
            <option>Lead</option>
            <option>Inactive</option>
          </Select>
        </Field>
        <Field label="Account owner">
          <Select
            value={form.ownerEmployeeId}
            onChange={(e) => set("ownerEmployeeId", e.target.value)}
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tags" hint="Comma separated">
          <Input
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="Key Account"
          />
        </Field>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Product / service                                                           */
/* -------------------------------------------------------------------------- */

export function ItemForm({
  item,
  defaultKind = "Product",
  onDone,
  onCancel,
  renderFooter,
}: {
  item?: Item;
  defaultKind?: Item["kind"];
  onDone: () => void;
  onCancel: () => void;
  renderFooter: (footer: React.ReactNode) => void;
}) {
  const { addItem, updateItem, business, invoiceSettings, items } = useStore();
  const { success } = useToast();
  const symbol = CURRENCY_SYMBOL[business.currency];

  const [form, setForm] = useState({
    kind: defaultKind as Item["kind"],
    name: "",
    sku: "",
    description: "",
    category: "",
    price: "",
    costPrice: "",
    taxRate: String(invoiceSettings.defaultTaxRate),
    stock: "0",
    minStock: "5",
    durationMinutes: "",
    status: "Active" as Item["status"],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort(),
    [items],
  );

  useEffect(() => {
    if (item) {
      setForm({
        kind: item.kind,
        name: item.name,
        sku: item.sku,
        description: item.description,
        category: item.category,
        price: String(item.price),
        costPrice: String(item.costPrice),
        taxRate: String(item.taxRate),
        stock: item.stock === null ? "0" : String(item.stock),
        minStock: item.minStock === null ? "5" : String(item.minStock),
        durationMinutes:
          item.durationMinutes === null ? "" : String(item.durationMinutes),
        status: item.status,
      });
    }
    setErrors({});
  }, [item]);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.price || Number(form.price) < 0)
      e.price = "Enter a selling price";
    if (form.kind === "Product" && !form.sku.trim())
      e.sku = "SKU is required for products";
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      kind: form.kind,
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim(),
      category: form.category.trim() || "General",
      price: Number(form.price),
      costPrice: Number(form.costPrice) || 0,
      taxRate: Number(form.taxRate) || 0,
      stock: form.kind === "Product" ? Number(form.stock) || 0 : null,
      minStock: form.kind === "Product" ? Number(form.minStock) || 0 : null,
      durationMinutes:
        form.kind === "Service" && form.durationMinutes
          ? Number(form.durationMinutes)
          : null,
      status: form.status,
      imageHue: item?.imageHue ?? Math.floor(Math.random() * 360),
    };

    if (item) {
      updateItem(item.id, payload);
      success("Saved", `${payload.name} has been updated.`);
    } else {
      addItem(payload);
      success(
        `${payload.kind} added`,
        `${payload.name} is ready to sell.`,
      );
    }
    onDone();
  }

  useEffect(() => {
    renderFooter(
      <Footer
        onCancel={onCancel}
        onSubmit={submit}
        submitLabel={item ? "Save changes" : `Add ${form.kind.toLowerCase()}`}
      />,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, item]);

  const margin =
    Number(form.price) > 0 && Number(form.costPrice) > 0
      ? ((Number(form.price) - Number(form.costPrice)) / Number(form.price)) * 100
      : null;

  return (
    <div className="space-y-4">
      {!item && (
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          {(["Product", "Service"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => set("kind", k)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                form.kind === k
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`${form.kind} name`} error={errors.name} required>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            invalid={!!errors.name}
            placeholder={
              form.kind === "Product"
                ? "ThinkEdge Laptop 14\""
                : "Cloud Migration Assessment"
            }
          />
        </Field>
        {form.kind === "Product" ? (
          <Field label="SKU" error={errors.sku} required>
            <Input
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
              invalid={!!errors.sku}
              placeholder="TN-HAR-1001"
            />
          </Field>
        ) : (
          <Field label="Duration (minutes)" hint="Leave blank if not time-based">
            <Input
              type="number"
              min={0}
              value={form.durationMinutes}
              onChange={(e) => set("durationMinutes", e.target.value)}
              placeholder="480"
            />
          </Field>
        )}
      </div>

      <Field label="Description">
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What the customer gets."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" hint={categories.slice(0, 3).join(" · ")}>
          <Input
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            list="item-categories"
            placeholder="Hardware"
          />
          <datalist id="item-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option>Active</option>
            <option>Archived</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={`Selling price (${symbol})`} error={errors.price} required>
          <Input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            invalid={!!errors.price}
          />
        </Field>
        <Field
          label={`Cost price (${symbol})`}
          hint={margin !== null ? `Margin ${margin.toFixed(1)}%` : undefined}
        >
          <Input
            type="number"
            min={0}
            value={form.costPrice}
            onChange={(e) => set("costPrice", e.target.value)}
          />
        </Field>
        <Field label="Tax rate (%)">
          <Input
            type="number"
            min={0}
            max={100}
            value={form.taxRate}
            onChange={(e) => set("taxRate", e.target.value)}
          />
        </Field>
      </div>

      {form.kind === "Product" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Stock quantity">
            <Input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
            />
          </Field>
          <Field
            label="Minimum stock level"
            hint="You'll be notified when stock hits this level."
          >
            <Input
              type="number"
              min={0}
              value={form.minStock}
              onChange={(e) => set("minStock", e.target.value)}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Order                                                                       */
/* -------------------------------------------------------------------------- */

export function OrderForm({
  order,
  defaultCustomerId,
  onDone,
  onCancel,
  renderFooter,
}: {
  order?: Order;
  defaultCustomerId?: string;
  onDone: (o: Order) => void;
  onCancel: () => void;
  renderFooter: (footer: React.ReactNode) => void;
}) {
  const { customers, addOrder, updateOrder, business } = useStore();
  const { success } = useToast();

  const [customerId, setCustomerId] = useState(defaultCustomerId ?? "");
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<Order["status"]>("Pending");
  const [method, setMethod] = useState<PaymentMethod>("Bank Transfer");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (order) {
      setCustomerId(order.customerId);
      setLines(order.items.length ? order.items : [newLine()]);
      setDiscount(order.discount);
      setStatus(order.status);
      setMethod(order.paymentMethod);
      setNotes(order.notes);
    } else {
      setCustomerId(defaultCustomerId ?? "");
      setLines([newLine()]);
      setDiscount(0);
      setStatus("Pending");
      setNotes("");
    }
    setErrors({});
  }, [order, defaultCustomerId]);

  function submit() {
    const e: Record<string, string> = {};
    if (!customerId) e.customerId = "Choose a customer";
    const valid = lines.filter((l) => l.itemId && l.quantity > 0);
    if (!valid.length) e.lines = "Add at least one product or service";
    setErrors(e);
    if (Object.keys(e).length) return;

    if (order) {
      updateOrder(order.id, {
        customerId,
        items: valid,
        discount,
        status,
        paymentMethod: method,
        notes,
      });
      success("Order updated", `${order.number} has been saved.`);
      onDone({ ...order, customerId, items: valid, discount, status, notes });
    } else {
      const created = addOrder({
        customerId,
        items: valid,
        discount,
        status,
        paymentMethod: method,
        notes,
      });
      success(
        "Order created",
        `${created.number} · ${money(docTotal(valid, discount).total, business.currency)}`,
      );
      onDone(created);
    }
  }

  useEffect(() => {
    renderFooter(
      <Footer
        onCancel={onCancel}
        onSubmit={submit}
        submitLabel={order ? "Save changes" : "Create order"}
      />,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, lines, discount, status, method, notes, order]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Customer" error={errors.customerId} required>
          <Select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            invalid={!!errors.customerId}
          >
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? ` — ${c.company}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as Order["status"])}
          >
            <option>Draft</option>
            <option>Pending</option>
            <option>Confirmed</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </Select>
        </Field>
        <Field label="Payment method">
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium text-slate-700">Line items</p>
        <LineItemsEditor
          lines={lines}
          onChange={setLines}
          discount={discount}
          onDiscountChange={setDiscount}
          currency={business.currency}
          error={errors.lines}
        />
      </div>

      <Field label="Notes">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Delivery instructions, PO number…"
        />
      </Field>

      <p className="rounded-lg bg-slate-50 px-4 py-3 text-[13px] leading-relaxed text-slate-600">
        Confirming or completing an order reduces stock for every product line
        automatically.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Invoice                                                                     */
/* -------------------------------------------------------------------------- */

export function InvoiceForm({
  invoice,
  fromOrder,
  defaultCustomerId,
  onDone,
  onCancel,
  renderFooter,
}: {
  invoice?: Invoice;
  fromOrder?: Order;
  defaultCustomerId?: string;
  onDone: (i: Invoice) => void;
  onCancel: () => void;
  renderFooter: (footer: React.ReactNode) => void;
}) {
  const { customers, addInvoice, updateInvoice, business, invoiceSettings } =
    useStore();
  const { success } = useToast();

  const today = new Date();
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + invoiceSettings.paymentTermsDays);

  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<Invoice["status"]>("Draft");
  const [issueDate, setIssueDate] = useState(inputDate(today));
  const [dueDate, setDueDate] = useState(inputDate(defaultDue));
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (invoice) {
      setCustomerId(invoice.customerId);
      setLines(invoice.items.length ? invoice.items : [newLine()]);
      setDiscount(invoice.discount);
      setStatus(invoice.status);
      setIssueDate(inputDate(invoice.issueDate));
      setDueDate(inputDate(invoice.dueDate));
      setNotes(invoice.notes);
    } else if (fromOrder) {
      setCustomerId(fromOrder.customerId);
      setLines(fromOrder.items);
      setDiscount(fromOrder.discount);
      setStatus("Sent");
      setNotes(fromOrder.notes);
    } else {
      setCustomerId(defaultCustomerId ?? "");
      setLines([newLine()]);
      setDiscount(0);
      setStatus("Draft");
      setNotes("");
    }
    setErrors({});
  }, [invoice, fromOrder, defaultCustomerId]);

  function submit() {
    const e: Record<string, string> = {};
    if (!customerId) e.customerId = "Choose a customer";
    const valid = lines.filter((l) => l.itemId && l.quantity > 0);
    if (!valid.length) e.lines = "Add at least one product or service";
    if (new Date(dueDate) < new Date(issueDate))
      e.dueDate = "Due date can't be before the issue date";
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      customerId,
      items: valid,
      discount,
      status,
      issueDate: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      notes,
      orderId: fromOrder?.id ?? invoice?.orderId ?? null,
    };

    if (invoice) {
      updateInvoice(invoice.id, payload);
      success("Invoice updated", `${invoice.number} has been saved.`);
      onDone({ ...invoice, ...payload });
    } else {
      const created = addInvoice(payload);
      success(
        "Invoice created",
        `${created.number} · ${money(docTotal(valid, discount).total, business.currency)}`,
      );
      onDone(created);
    }
  }

  useEffect(() => {
    renderFooter(
      <Footer
        onCancel={onCancel}
        onSubmit={submit}
        submitLabel={invoice ? "Save changes" : "Create invoice"}
      />,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, lines, discount, status, issueDate, dueDate, notes, invoice]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer" error={errors.customerId} required>
          <Select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            invalid={!!errors.customerId}
          >
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? ` — ${c.company}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as Invoice["status"])}
          >
            <option>Draft</option>
            <option>Sent</option>
            <option>Partially Paid</option>
            <option>Paid</option>
            <option>Overdue</option>
            <option>Cancelled</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Invoice date" required>
          <Input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
        </Field>
        <Field label="Due date" error={errors.dueDate} required>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            invalid={!!errors.dueDate}
          />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium text-slate-700">Line items</p>
        <LineItemsEditor
          lines={lines}
          onChange={setLines}
          discount={discount}
          onDiscountChange={setDiscount}
          currency={business.currency}
          error={errors.lines}
        />
      </div>

      <Field label="Notes" hint="Shown on the invoice under the totals.">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Thank you for your business."
        />
      </Field>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Payment                                                                     */
/* -------------------------------------------------------------------------- */

export function PaymentForm({
  defaultCustomerId,
  defaultInvoiceId,
  onDone,
  onCancel,
  renderFooter,
}: {
  defaultCustomerId?: string;
  defaultInvoiceId?: string;
  onDone: (p: Payment) => void;
  onCancel: () => void;
  renderFooter: (footer: React.ReactNode) => void;
}) {
  const { customers, invoices, payments, addPayment, business } = useStore();
  const { success } = useToast();

  const [customerId, setCustomerId] = useState(defaultCustomerId ?? "");
  const [invoiceId, setInvoiceId] = useState(defaultInvoiceId ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(inputDate(new Date()));
  const [method, setMethod] = useState<PaymentMethod>("Bank Transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Only invoices that still owe money can receive a payment.
  const openInvoices = useMemo(
    () =>
      invoices.filter(
        (i) =>
          (!customerId || i.customerId === customerId) &&
          i.status !== "Cancelled" &&
          i.status !== "Draft" &&
          invoiceBalance(i, payments) > 0,
      ),
    [invoices, payments, customerId],
  );

  const selected = invoices.find((i) => i.id === invoiceId);
  const balance = selected ? invoiceBalance(selected, payments) : 0;

  useEffect(() => {
    if (!defaultInvoiceId) return;
    const inv = invoices.find((i) => i.id === defaultInvoiceId);
    if (inv) {
      setCustomerId(inv.customerId);
      setInvoiceId(inv.id);
      setAmount(String(Math.round(invoiceBalance(inv, payments))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultInvoiceId]);

  function selectInvoice(id: string) {
    setInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      setCustomerId(inv.customerId);
      setAmount(String(Math.round(invoiceBalance(inv, payments))));
    }
  }

  function submit() {
    const e: Record<string, string> = {};
    if (!customerId) e.customerId = "Choose a customer";
    if (!amount || Number(amount) <= 0) e.amount = "Enter an amount above zero";
    if (selected && Number(amount) > balance + 1)
      e.amount = `That's more than the ${money(balance, business.currency)} outstanding`;
    setErrors(e);
    if (Object.keys(e).length) return;

    const created = addPayment({
      customerId,
      invoiceId: invoiceId || null,
      amount: Number(amount),
      date: new Date(date).toISOString(),
      method,
      reference: reference.trim(),
      notes: notes.trim(),
    });
    success(
      "Payment recorded",
      `${money(Number(amount), business.currency)} received${selected ? ` against ${selected.number}` : ""}.`,
    );
    onDone(created);
  }

  useEffect(() => {
    renderFooter(
      <Footer onCancel={onCancel} onSubmit={submit} submitLabel="Record payment" />,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, invoiceId, amount, date, method, reference, notes]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer" error={errors.customerId} required>
          <Select
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setInvoiceId("");
            }}
            invalid={!!errors.customerId}
          >
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? ` — ${c.company}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Against invoice"
          hint="Leave blank to record an advance payment."
        >
          <Select
            value={invoiceId}
            onChange={(e) => selectInvoice(e.target.value)}
          >
            <option value="">No specific invoice</option>
            {openInvoices.map((i) => (
              <option key={i.id} value={i.id}>
                {i.number} — {money(invoiceBalance(i, payments), business.currency)}{" "}
                due
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {selected && (
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-4 text-center">
          <div>
            <p className="text-xs text-slate-500">Invoice total</p>
            <p className="mt-0.5 tnum text-sm font-semibold text-slate-900">
              {money(invoiceTotal(selected), business.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Already paid</p>
            <p className="mt-0.5 tnum text-sm font-semibold text-emerald-700">
              {money(invoiceTotal(selected) - balance, business.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Outstanding</p>
            <p className="mt-0.5 tnum text-sm font-semibold text-amber-700">
              {money(balance, business.currency)}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label={`Amount (${CURRENCY_SYMBOL[business.currency]})`}
          error={errors.amount}
          required
        >
          <Input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            invalid={!!errors.amount}
          />
        </Field>
        <Field label="Date" required>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Method">
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Reference number">
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="REF482910 / UTR"
          />
        </Field>
        <Field label="Notes">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>

      {selected && Number(amount) > 0 && Number(amount) < balance && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          This is a partial payment. {selected.number} will be marked{" "}
          <strong>Partially Paid</strong> with{" "}
          {money(balance - Number(amount), business.currency)} still outstanding.
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Expense                                                                     */
/* -------------------------------------------------------------------------- */

export function ExpenseForm({
  expense,
  onDone,
  onCancel,
  renderFooter,
}: {
  expense?: Expense;
  onDone: () => void;
  onCancel: () => void;
  renderFooter: (footer: React.ReactNode) => void;
}) {
  const { addExpense, updateExpense, business } = useStore();
  const { success } = useToast();

  const [form, setForm] = useState({
    title: "",
    category: "Other" as ExpenseCategory,
    amount: "",
    date: inputDate(new Date()),
    method: "Bank Transfer" as PaymentMethod,
    vendor: "",
    description: "",
    receiptName: null as string | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title,
        category: expense.category,
        amount: String(expense.amount),
        date: inputDate(expense.date),
        method: expense.method,
        vendor: expense.vendor,
        description: expense.description,
        receiptName: expense.receiptName,
      });
    }
    setErrors({});
  }, [expense]);

  function submit() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Give the expense a title";
    if (!form.amount || Number(form.amount) <= 0)
      e.amount = "Enter an amount above zero";
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      title: form.title.trim(),
      category: form.category,
      amount: Number(form.amount),
      date: new Date(form.date).toISOString(),
      method: form.method,
      vendor: form.vendor.trim(),
      description: form.description.trim(),
      receiptName: form.receiptName,
    };

    if (expense) {
      updateExpense(expense.id, payload);
      success("Expense updated", `"${payload.title}" has been saved.`);
    } else {
      addExpense(payload);
      success(
        "Expense recorded",
        `${money(payload.amount, business.currency)} under ${payload.category}.`,
      );
    }
    onDone();
  }

  useEffect(() => {
    renderFooter(
      <Footer
        onCancel={onCancel}
        onSubmit={submit}
        submitLabel={expense ? "Save changes" : "Record expense"}
      />,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, expense]);

  return (
    <div className="space-y-4">
      <Field label="Expense title" error={errors.title} required>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          invalid={!!errors.title}
          placeholder="Office rent — March"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Category">
          <Select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as ExpenseCategory })
            }
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field
          label={`Amount (${CURRENCY_SYMBOL[business.currency]})`}
          error={errors.amount}
          required
        >
          <Input
            type="number"
            min={0}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            invalid={!!errors.amount}
          />
        </Field>
        <Field label="Date" required>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Payment method">
          <Select
            value={form.method}
            onChange={(e) =>
              setForm({ ...form, method: e.target.value as PaymentMethod })
            }
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <Field label="Vendor">
          <Input
            value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            placeholder="Prestige Estates"
          />
        </Field>
      </div>

      <Field label="Description">
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </Field>

      <Field label="Receipt" hint="PDF, JPG or PNG up to 5 MB.">
        <div className="flex items-center gap-3">
          <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            Choose file
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) =>
                setForm({
                  ...form,
                  receiptName: e.target.files?.[0]?.name ?? null,
                })
              }
            />
          </label>
          <span className="truncate text-[13px] text-slate-500">
            {form.receiptName ?? "No file selected"}
          </span>
          {form.receiptName && (
            <button
              type="button"
              onClick={() => setForm({ ...form, receiptName: null })}
              className="text-[13px] font-medium text-rose-600 hover:text-rose-700"
            >
              Remove
            </button>
          )}
        </div>
      </Field>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Employee                                                                    */
/* -------------------------------------------------------------------------- */

export function EmployeeForm({
  employee,
  onDone,
  onCancel,
  renderFooter,
}: {
  employee?: Employee;
  onDone: () => void;
  onCancel: () => void;
  renderFooter: (footer: React.ReactNode) => void;
}) {
  const { addEmployee, updateEmployee, employees } = useStore();
  const { success } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "Operations",
    role: "Employee" as Role,
    joiningDate: inputDate(new Date()),
    status: "Active" as Employee["status"],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        role: employee.role,
        joiningDate: inputDate(employee.joiningDate),
        status: employee.status,
      });
    }
    setErrors({});
  }, [employee]);

  function submit() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Enter the employee's name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid work email";
    else if (
      employees.some(
        (x) =>
          x.email.toLowerCase() === form.email.trim().toLowerCase() &&
          x.id !== employee?.id,
      )
    )
      e.email = "Another employee already uses this email";
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      position: form.position.trim() || "Team member",
      department: form.department,
      role: form.role,
      joiningDate: new Date(form.joiningDate).toISOString(),
      status: form.status,
      avatarHue: employee?.avatarHue ?? Math.floor(Math.random() * 360),
    };

    if (employee) {
      updateEmployee(employee.id, payload);
      success("Employee updated", `${payload.name} has been saved.`);
    } else {
      addEmployee(payload);
      success("Employee added", `${payload.name} can now sign in as ${payload.role}.`);
    }
    onDone();
  }

  useEffect(() => {
    renderFooter(
      <Footer
        onCancel={onCancel}
        onSubmit={submit}
        submitLabel={employee ? "Save changes" : "Add employee"}
      />,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, employee]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.name} required>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            invalid={!!errors.name}
          />
        </Field>
        <Field label="Work email" error={errors.email} required>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            invalid={!!errors.email}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone">
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field label="Position">
          <Input
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            placeholder="Account Executive"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Department">
          <Select
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          >
            {["Leadership", "Sales", "Operations", "Finance", "Delivery", "Support"].map(
              (d) => (
                <option key={d}>{d}</option>
              ),
            )}
          </Select>
        </Field>
        <Field label="Joining date">
          <Input
            type="date"
            value={form.joiningDate}
            onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Role"
          hint="Controls what this person can see and do."
        >
          <Select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as Employee["status"] })
            }
          >
            <option>Active</option>
            <option>Disabled</option>
          </Select>
        </Field>
      </div>

      <div className="rounded-lg bg-slate-50 px-4 py-3 text-[13px] leading-relaxed text-slate-600">
        <strong className="text-slate-800">{form.role}</strong> —{" "}
        {form.role === "Owner" || form.role === "Admin"
          ? "full access to every module, including financials, employees and settings."
          : form.role === "Manager"
            ? "customers, products, orders, invoices, payments and reports. No access to expenses, employees or settings."
            : "assigned customers and orders only. Revenue, expenses and settings stay hidden."}
      </div>
    </div>
  );
}
