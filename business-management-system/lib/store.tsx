"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { buildSeed } from "./seed";
import type {
  AppNotification,
  AppState,
  AuditLog,
  Customer,
  CustomerNote,
  Employee,
  Expense,
  Invoice,
  InvoiceSettings,
  Item,
  NotificationKind,
  NotificationSettings,
  Order,
  Payment,
  Permission,
  Session,
} from "./types";
import { ROLE_PERMISSIONS } from "./types";

const STATE_KEY = "bizflow:state:v3";
const SESSION_KEY = "bizflow:session:v3";

type Draft<T> = Omit<T, "id">;

interface StoreValue extends AppState {
  session: Session | null;
  ready: boolean;
  signIn: (employeeId: string) => void;
  signOut: () => void;
  can: (permission: Permission) => boolean;
  resetDemoData: () => void;

  addCustomer: (c: Draft<Customer>) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addCustomerNote: (customerId: string, body: string) => void;

  addItem: (i: Omit<Draft<Item>, "createdAt">) => Item;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;

  addOrder: (o: Omit<Draft<Order>, "number" | "createdBy" | "createdAt">) => Order;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  deleteOrder: (id: string) => void;

  addInvoice: (
    i: Omit<Draft<Invoice>, "number" | "createdBy" | "createdAt">,
  ) => Invoice;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  duplicateInvoice: (id: string) => Invoice | null;

  addPayment: (
    p: Omit<Draft<Payment>, "number" | "createdBy">,
  ) => Payment;
  deletePayment: (id: string) => void;

  addExpense: (e: Omit<Draft<Expense>, "createdBy">) => Expense;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addEmployee: (e: Draft<Employee>) => Employee;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  updateBusiness: (patch: Partial<AppState["business"]>) => void;
  updateInvoiceSettings: (patch: Partial<InvoiceSettings>) => void;
  updateNotificationSettings: (patch: Partial<NotificationSettings>) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

let counter = 0;
const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}`;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => buildSeed());
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  // Load persisted workspace on the client only, so server and first client
  // render always agree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STATE_KEY);
      if (raw) setState(JSON.parse(raw) as AppState);
      const rawSession = window.localStorage.getItem(SESSION_KEY);
      if (rawSession) setSession(JSON.parse(rawSession) as Session);
    } catch {
      // Corrupt storage falls back to a fresh seeded workspace.
    }
    setReady(true);
  }, []);

  // `ready` must gate the writes, and it must be state rather than a ref: on the
  // mount pass both effects run before any re-render, so a ref set above would
  // already be true here and this effect would write the *seed* over whatever we
  // just loaded. Keyed on state, the first pass short-circuits and the write
  // only happens once the loaded workspace is actually in `state`.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      /* quota — demo data is disposable */
    }
  }, [state, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else window.localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, [session, ready]);

  const actorName = session?.name ?? "System";

  const audit = useCallback(
    (
      s: AppState,
      action: string,
      entity: string,
      entityRef: string,
      detail: string,
    ): AuditLog[] => {
      const log: AuditLog = {
        id: uid("aud"),
        actor: actorName,
        action,
        entity,
        entityRef,
        detail,
        ip: "49.36.12.104",
        device:
          typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent)
            ? "Safari · macOS"
            : "Chrome · Windows",
        createdAt: new Date().toISOString(),
      };
      return [log, ...s.auditLogs];
    },
    [actorName],
  );

  const notify = useCallback(
    (
      s: AppState,
      kind: NotificationKind,
      title: string,
      body: string,
      href: string,
    ): AppNotification[] => {
      const enabled: Record<NotificationKind, keyof NotificationSettings> = {
        order: "newOrder",
        payment: "paymentReceived",
        invoice: "invoiceOverdue",
        inventory: "lowInventory",
        customer: "newCustomer",
        employee: "employeeActivity",
      };
      if (!s.notificationSettings[enabled[kind]]) return s.notifications;
      return [
        {
          id: uid("ntf"),
          kind,
          title,
          body,
          href,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...s.notifications,
      ];
    },
    [],
  );

  // ---- session ------------------------------------------------------------
  const signIn = useCallback(
    (employeeId: string) => {
      const emp = state.employees.find((e) => e.id === employeeId);
      if (!emp) return;
      setSession({
        employeeId: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
      });
      setState((s) => ({
        ...s,
        auditLogs: [
          {
            id: uid("aud"),
            actor: emp.name,
            action: "signed in",
            entity: "Session",
            entityRef: emp.email,
            detail: `${emp.name} signed in as ${emp.role}`,
            ip: "49.36.12.104",
            device: "Chrome · Windows",
            createdAt: new Date().toISOString(),
          },
          ...s.auditLogs,
        ],
      }));
    },
    [state.employees],
  );

  const signOut = useCallback(() => setSession(null), []);

  const can = useCallback(
    (permission: Permission) =>
      !!session && ROLE_PERMISSIONS[session.role].includes(permission),
    [session],
  );

  const resetDemoData = useCallback(() => {
    const fresh = buildSeed();
    setState(fresh);
    try {
      window.localStorage.setItem(STATE_KEY, JSON.stringify(fresh));
    } catch {
      /* ignore */
    }
  }, []);

  // ---- customers ----------------------------------------------------------
  const addCustomer = useCallback<StoreValue["addCustomer"]>(
    (draft) => {
      const customer: Customer = { ...draft, id: uid("cus") };
      setState((s) => ({
        ...s,
        customers: [customer, ...s.customers],
        notifications: notify(
          s,
          "customer",
          "New customer added",
          `${customer.company || customer.name} was added to the workspace.`,
          `/customers/${customer.id}`,
        ),
        auditLogs: audit(
          s,
          "created",
          "Customer",
          customer.name,
          `Created customer ${customer.name}${customer.company ? ` (${customer.company})` : ""}`,
        ),
      }));
      return customer;
    },
    [audit, notify],
  );

  const updateCustomer = useCallback<StoreValue["updateCustomer"]>(
    (id, patch) =>
      setState((s) => {
        const before = s.customers.find((c) => c.id === id);
        return {
          ...s,
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          auditLogs: audit(
            s,
            "updated",
            "Customer",
            before?.name ?? id,
            `Updated customer ${before?.name ?? id}`,
          ),
        };
      }),
    [audit],
  );

  const deleteCustomer = useCallback<StoreValue["deleteCustomer"]>(
    (id) =>
      setState((s) => {
        const before = s.customers.find((c) => c.id === id);
        return {
          ...s,
          customers: s.customers.filter((c) => c.id !== id),
          auditLogs: audit(
            s,
            "deleted",
            "Customer",
            before?.name ?? id,
            `Deleted customer ${before?.name ?? id}`,
          ),
        };
      }),
    [audit],
  );

  const addCustomerNote = useCallback<StoreValue["addCustomerNote"]>(
    (customerId, body) =>
      setState((s) => {
        const note: CustomerNote = {
          id: uid("nte"),
          body,
          author: actorName,
          createdAt: new Date().toISOString(),
        };
        const before = s.customers.find((c) => c.id === customerId);
        return {
          ...s,
          customers: s.customers.map((c) =>
            c.id === customerId ? { ...c, notes: [note, ...c.notes] } : c,
          ),
          auditLogs: audit(
            s,
            "added note",
            "Customer",
            before?.name ?? customerId,
            `Added a note on ${before?.name ?? customerId}`,
          ),
        };
      }),
    [actorName, audit],
  );

  // ---- products & services ------------------------------------------------
  const addItem = useCallback<StoreValue["addItem"]>(
    (draft) => {
      const item: Item = {
        ...draft,
        id: uid("itm"),
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        items: [item, ...s.items],
        auditLogs: audit(
          s,
          "created",
          item.kind,
          item.sku || item.name,
          `Created ${item.kind.toLowerCase()} ${item.name}`,
        ),
      }));
      return item;
    },
    [audit],
  );

  const updateItem = useCallback<StoreValue["updateItem"]>(
    (id, patch) =>
      setState((s) => {
        const before = s.items.find((i) => i.id === id);
        const priceChanged =
          before && patch.price !== undefined && patch.price !== before.price;
        return {
          ...s,
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
          auditLogs: audit(
            s,
            "updated",
            before?.kind ?? "Product",
            before?.sku ?? id,
            priceChanged
              ? `Changed price of ${before!.name} to ${patch.price}`
              : `Updated ${before?.name ?? id}`,
          ),
        };
      }),
    [audit],
  );

  const deleteItem = useCallback<StoreValue["deleteItem"]>(
    (id) =>
      setState((s) => {
        const before = s.items.find((i) => i.id === id);
        return {
          ...s,
          items: s.items.filter((i) => i.id !== id),
          auditLogs: audit(
            s,
            "deleted",
            before?.kind ?? "Product",
            before?.sku ?? id,
            `Deleted ${before?.name ?? id}`,
          ),
        };
      }),
    [audit],
  );

  /** Decrements stock for product lines and raises low-stock notifications. */
  const applyStock = useCallback(
    (s: AppState, order: Order): { items: Item[]; notifications: AppNotification[] } => {
      let notifications = s.notifications;
      const items = s.items.map((it) => {
        if (it.stock === null) return it;
        const line = order.items.find((l) => l.itemId === it.id);
        if (!line) return it;
        const next = Math.max(0, it.stock - line.quantity);
        if (it.minStock !== null && next <= it.minStock && it.stock > it.minStock) {
          notifications = [
            {
              id: uid("ntf"),
              kind: "inventory",
              title: next === 0 ? "Out of stock" : "Low inventory",
              body: `${it.name} is down to ${next} unit${next === 1 ? "" : "s"}.`,
              href: "/products",
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...notifications,
          ];
        }
        return { ...it, stock: next };
      });
      return { items, notifications };
    },
    [],
  );

  // ---- orders -------------------------------------------------------------
  const addOrder = useCallback<StoreValue["addOrder"]>(
    (draft) => {
      let created: Order | null = null;
      setState((s) => {
        const seq = 1001 + s.orders.length;
        const order: Order = {
          ...draft,
          id: uid("ord"),
          number: `ORD-${String(seq).padStart(5, "0")}`,
          createdBy: actorName,
          createdAt: new Date().toISOString(),
        };
        created = order;
        const customer = s.customers.find((c) => c.id === order.customerId);
        const stocked =
          order.status === "Confirmed" || order.status === "Completed"
            ? applyStock(s, order)
            : { items: s.items, notifications: s.notifications };
        return {
          ...s,
          orders: [order, ...s.orders],
          items: stocked.items,
          notifications: notify(
            { ...s, notifications: stocked.notifications },
            "order",
            "New order created",
            `${order.number} for ${customer?.company ?? "a customer"} is ${order.status.toLowerCase()}.`,
            "/orders",
          ),
          auditLogs: audit(
            s,
            "created",
            "Order",
            order.number,
            `Created order ${order.number} for ${customer?.company ?? "a customer"}`,
          ),
        };
      });
      return created!;
    },
    [actorName, applyStock, audit, notify],
  );

  const updateOrder = useCallback<StoreValue["updateOrder"]>(
    (id, patch) =>
      setState((s) => {
        const before = s.orders.find((o) => o.id === id);
        if (!before) return s;
        const after = { ...before, ...patch };
        const justFulfilled =
          (after.status === "Confirmed" || after.status === "Completed") &&
          before.status !== "Confirmed" &&
          before.status !== "Completed";
        const stocked = justFulfilled
          ? applyStock(s, after)
          : { items: s.items, notifications: s.notifications };
        return {
          ...s,
          orders: s.orders.map((o) => (o.id === id ? after : o)),
          items: stocked.items,
          notifications: stocked.notifications,
          auditLogs: audit(
            s,
            "updated",
            "Order",
            before.number,
            patch.status && patch.status !== before.status
              ? `Changed order ${before.number} status to ${patch.status}`
              : `Updated order ${before.number}`,
          ),
        };
      }),
    [applyStock, audit],
  );

  const deleteOrder = useCallback<StoreValue["deleteOrder"]>(
    (id) =>
      setState((s) => {
        const before = s.orders.find((o) => o.id === id);
        return {
          ...s,
          orders: s.orders.filter((o) => o.id !== id),
          auditLogs: audit(
            s,
            "deleted",
            "Order",
            before?.number ?? id,
            `Deleted order ${before?.number ?? id}`,
          ),
        };
      }),
    [audit],
  );

  // ---- invoices -----------------------------------------------------------
  const addInvoice = useCallback<StoreValue["addInvoice"]>(
    (draft) => {
      let created: Invoice | null = null;
      setState((s) => {
        const n = s.invoiceSettings.nextNumber;
        const invoice: Invoice = {
          ...draft,
          id: uid("inv"),
          number: `${s.invoiceSettings.prefix}${String(n).padStart(5, "0")}`,
          createdBy: actorName,
          createdAt: new Date().toISOString(),
        };
        created = invoice;
        const customer = s.customers.find((c) => c.id === invoice.customerId);
        return {
          ...s,
          invoices: [invoice, ...s.invoices],
          invoiceSettings: { ...s.invoiceSettings, nextNumber: n + 1 },
          auditLogs: audit(
            s,
            "created",
            "Invoice",
            invoice.number,
            `Created invoice ${invoice.number} for ${customer?.company ?? "a customer"}`,
          ),
        };
      });
      return created!;
    },
    [actorName, audit],
  );

  const updateInvoice = useCallback<StoreValue["updateInvoice"]>(
    (id, patch) =>
      setState((s) => {
        const before = s.invoices.find((i) => i.id === id);
        if (!before) return s;
        return {
          ...s,
          invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)),
          auditLogs: audit(
            s,
            "updated",
            "Invoice",
            before.number,
            patch.status && patch.status !== before.status
              ? `Changed invoice ${before.number} status to ${patch.status}`
              : `Updated invoice ${before.number}`,
          ),
        };
      }),
    [audit],
  );

  const deleteInvoice = useCallback<StoreValue["deleteInvoice"]>(
    (id) =>
      setState((s) => {
        const before = s.invoices.find((i) => i.id === id);
        return {
          ...s,
          invoices: s.invoices.filter((i) => i.id !== id),
          payments: s.payments.map((p) =>
            p.invoiceId === id ? { ...p, invoiceId: null } : p,
          ),
          auditLogs: audit(
            s,
            "deleted",
            "Invoice",
            before?.number ?? id,
            `Deleted invoice ${before?.number ?? id}`,
          ),
        };
      }),
    [audit],
  );

  const duplicateInvoice = useCallback<StoreValue["duplicateInvoice"]>(
    (id) => {
      let created: Invoice | null = null;
      setState((s) => {
        const src = s.invoices.find((i) => i.id === id);
        if (!src) return s;
        const n = s.invoiceSettings.nextNumber;
        const issue = new Date();
        const due = new Date();
        due.setDate(due.getDate() + s.invoiceSettings.paymentTermsDays);
        const copy: Invoice = {
          ...src,
          id: uid("inv"),
          number: `${s.invoiceSettings.prefix}${String(n).padStart(5, "0")}`,
          orderId: null,
          status: "Draft",
          issueDate: issue.toISOString(),
          dueDate: due.toISOString(),
          createdBy: actorName,
          createdAt: issue.toISOString(),
        };
        created = copy;
        return {
          ...s,
          invoices: [copy, ...s.invoices],
          invoiceSettings: { ...s.invoiceSettings, nextNumber: n + 1 },
          auditLogs: audit(
            s,
            "duplicated",
            "Invoice",
            copy.number,
            `Duplicated ${src.number} into ${copy.number}`,
          ),
        };
      });
      return created;
    },
    [actorName, audit],
  );

  // ---- payments -----------------------------------------------------------
  const addPayment = useCallback<StoreValue["addPayment"]>(
    (draft) => {
      let created: Payment | null = null;
      setState((s) => {
        const seq = 2001 + s.payments.length;
        const payment: Payment = {
          ...draft,
          id: uid("pay"),
          number: `PMT-${String(seq).padStart(5, "0")}`,
          createdBy: actorName,
        };
        created = payment;
        const customer = s.customers.find((c) => c.id === payment.customerId);

        // Recompute the linked invoice's status from all payments against it.
        let invoices = s.invoices;
        if (payment.invoiceId) {
          const inv = s.invoices.find((i) => i.id === payment.invoiceId);
          if (inv) {
            const paid =
              s.payments
                .filter((p) => p.invoiceId === inv.id)
                .reduce((sum, p) => sum + p.amount, 0) + payment.amount;
            const total = invoiceTotal(inv);
            const status =
              paid >= total - 1
                ? "Paid"
                : paid > 0
                  ? "Partially Paid"
                  : inv.status;
            invoices = s.invoices.map((i) =>
              i.id === inv.id ? { ...i, status } : i,
            );
          }
        }

        return {
          ...s,
          payments: [payment, ...s.payments],
          invoices,
          notifications: notify(
            s,
            "payment",
            "Payment received",
            `${customer?.company ?? "A customer"} paid ${payment.amount.toLocaleString("en-IN")} (${payment.number}).`,
            "/payments",
          ),
          auditLogs: audit(
            s,
            "recorded",
            "Payment",
            payment.number,
            `Recorded payment of ${payment.amount.toLocaleString("en-IN")} from ${customer?.company ?? "a customer"}`,
          ),
        };
      });
      return created!;
    },
    [actorName, audit, notify],
  );

  const deletePayment = useCallback<StoreValue["deletePayment"]>(
    (id) =>
      setState((s) => {
        const before = s.payments.find((p) => p.id === id);
        const remaining = s.payments.filter((p) => p.id !== id);
        let invoices = s.invoices;
        if (before?.invoiceId) {
          const inv = s.invoices.find((i) => i.id === before.invoiceId);
          if (inv) {
            const paid = remaining
              .filter((p) => p.invoiceId === inv.id)
              .reduce((sum, p) => sum + p.amount, 0);
            const total = invoiceTotal(inv);
            const status =
              paid >= total - 1 ? "Paid" : paid > 0 ? "Partially Paid" : "Sent";
            invoices = s.invoices.map((i) =>
              i.id === inv.id ? { ...i, status } : i,
            );
          }
        }
        return {
          ...s,
          payments: remaining,
          invoices,
          auditLogs: audit(
            s,
            "deleted",
            "Payment",
            before?.number ?? id,
            `Deleted payment ${before?.number ?? id}`,
          ),
        };
      }),
    [audit],
  );

  // ---- expenses -----------------------------------------------------------
  const addExpense = useCallback<StoreValue["addExpense"]>(
    (draft) => {
      const expense: Expense = { ...draft, id: uid("exp"), createdBy: actorName };
      setState((s) => ({
        ...s,
        expenses: [expense, ...s.expenses],
        auditLogs: audit(
          s,
          "recorded",
          "Expense",
          expense.title,
          `Recorded ${expense.category.toLowerCase()} expense "${expense.title}"`,
        ),
      }));
      return expense;
    },
    [actorName, audit],
  );

  const updateExpense = useCallback<StoreValue["updateExpense"]>(
    (id, patch) =>
      setState((s) => {
        const before = s.expenses.find((e) => e.id === id);
        return {
          ...s,
          expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          auditLogs: audit(
            s,
            "updated",
            "Expense",
            before?.title ?? id,
            `Updated expense "${before?.title ?? id}"`,
          ),
        };
      }),
    [audit],
  );

  const deleteExpense = useCallback<StoreValue["deleteExpense"]>(
    (id) =>
      setState((s) => {
        const before = s.expenses.find((e) => e.id === id);
        return {
          ...s,
          expenses: s.expenses.filter((e) => e.id !== id),
          auditLogs: audit(
            s,
            "deleted",
            "Expense",
            before?.title ?? id,
            `Deleted expense "${before?.title ?? id}"`,
          ),
        };
      }),
    [audit],
  );

  // ---- employees ----------------------------------------------------------
  const addEmployee = useCallback<StoreValue["addEmployee"]>(
    (draft) => {
      const employee: Employee = { ...draft, id: uid("emp") };
      setState((s) => ({
        ...s,
        employees: [...s.employees, employee],
        auditLogs: audit(
          s,
          "created",
          "Employee",
          employee.name,
          `Added employee ${employee.name} as ${employee.role}`,
        ),
      }));
      return employee;
    },
    [audit],
  );

  const updateEmployee = useCallback<StoreValue["updateEmployee"]>(
    (id, patch) =>
      setState((s) => {
        const before = s.employees.find((e) => e.id === id);
        return {
          ...s,
          employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          auditLogs: audit(
            s,
            "updated",
            "Employee",
            before?.name ?? id,
            patch.role && before && patch.role !== before.role
              ? `Changed role of ${before.name} to ${patch.role}`
              : patch.status && before && patch.status !== before.status
                ? `Set ${before.name} to ${patch.status}`
                : `Updated employee ${before?.name ?? id}`,
          ),
        };
      }),
    [audit],
  );

  const deleteEmployee = useCallback<StoreValue["deleteEmployee"]>(
    (id) =>
      setState((s) => {
        const before = s.employees.find((e) => e.id === id);
        return {
          ...s,
          employees: s.employees.filter((e) => e.id !== id),
          auditLogs: audit(
            s,
            "deleted",
            "Employee",
            before?.name ?? id,
            `Removed employee ${before?.name ?? id}`,
          ),
        };
      }),
    [audit],
  );

  // ---- settings -----------------------------------------------------------
  const updateBusiness = useCallback<StoreValue["updateBusiness"]>(
    (patch) =>
      setState((s) => ({
        ...s,
        business: { ...s.business, ...patch },
        auditLogs: audit(
          s,
          "updated",
          "Settings",
          "Business profile",
          "Updated the business profile",
        ),
      })),
    [audit],
  );

  const updateInvoiceSettings = useCallback<StoreValue["updateInvoiceSettings"]>(
    (patch) =>
      setState((s) => ({
        ...s,
        invoiceSettings: { ...s.invoiceSettings, ...patch },
        auditLogs: audit(
          s,
          "updated",
          "Settings",
          "Invoice settings",
          "Updated invoice settings",
        ),
      })),
    [audit],
  );

  const updateNotificationSettings = useCallback<
    StoreValue["updateNotificationSettings"]
  >(
    (patch) =>
      setState((s) => ({
        ...s,
        notificationSettings: { ...s.notificationSettings, ...patch },
      })),
    [],
  );

  const markNotificationRead = useCallback<StoreValue["markNotificationRead"]>(
    (id) =>
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
      })),
    [],
  );

  const markAllNotificationsRead = useCallback(
    () =>
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
      })),
    [],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      session,
      ready,
      signIn,
      signOut,
      can,
      resetDemoData,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addCustomerNote,
      addItem,
      updateItem,
      deleteItem,
      addOrder,
      updateOrder,
      deleteOrder,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      duplicateInvoice,
      addPayment,
      deletePayment,
      addExpense,
      updateExpense,
      deleteExpense,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      updateBusiness,
      updateInvoiceSettings,
      updateNotificationSettings,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      state,
      session,
      ready,
      signIn,
      signOut,
      can,
      resetDemoData,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addCustomerNote,
      addItem,
      updateItem,
      deleteItem,
      addOrder,
      updateOrder,
      deleteOrder,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      duplicateInvoice,
      addPayment,
      deletePayment,
      addExpense,
      updateExpense,
      deleteExpense,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      updateBusiness,
      updateInvoiceSettings,
      updateNotificationSettings,
      markNotificationRead,
      markAllNotificationsRead,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

/** Local copy of the document total so the store has no import cycle. */
function invoiceTotal(inv: Invoice) {
  const sub = inv.items.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const lineDisc = inv.items.reduce(
    (s, l) => s + (l.unitPrice * l.quantity * l.discount) / 100,
    0,
  );
  const taxable = sub - lineDisc;
  const net = taxable - (taxable * inv.discount) / 100;
  const tax = inv.items.reduce((s, l) => {
    const gross = l.unitPrice * l.quantity;
    const afterLine = gross - (gross * l.discount) / 100;
    const afterOrder = afterLine - (afterLine * inv.discount) / 100;
    return s + (afterOrder * l.taxRate) / 100;
  }, 0);
  return Math.round((net + tax) * 100) / 100;
}
