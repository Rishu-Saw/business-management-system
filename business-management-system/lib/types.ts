export type Role = "Owner" | "Admin" | "Manager" | "Employee";

export type Permission =
  | "view:dashboard"
  | "view:financials"
  | "manage:customers"
  | "manage:products"
  | "manage:orders"
  | "manage:invoices"
  | "manage:payments"
  | "manage:expenses"
  | "manage:employees"
  | "view:reports"
  | "manage:settings"
  | "view:audit";

/** Role -> permission matrix. Enforced in the UI and in lib/guard.ts. */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Owner: [
    "view:dashboard",
    "view:financials",
    "manage:customers",
    "manage:products",
    "manage:orders",
    "manage:invoices",
    "manage:payments",
    "manage:expenses",
    "manage:employees",
    "view:reports",
    "manage:settings",
    "view:audit",
  ],
  Admin: [
    "view:dashboard",
    "view:financials",
    "manage:customers",
    "manage:products",
    "manage:orders",
    "manage:invoices",
    "manage:payments",
    "manage:expenses",
    "manage:employees",
    "view:reports",
    "manage:settings",
    "view:audit",
  ],
  Manager: [
    "view:dashboard",
    "view:financials",
    "manage:customers",
    "manage:products",
    "manage:orders",
    "manage:invoices",
    "manage:payments",
    "view:reports",
  ],
  Employee: ["view:dashboard", "manage:customers", "manage:orders"],
};

export interface Business {
  id: string;
  name: string;
  legalName: string;
  industry: string;
  email: string;
  phone: string;
  website: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  currency: CurrencyCode;
  taxId: string;
  logoInitials: string;
}

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export interface InvoiceSettings {
  prefix: string;
  nextNumber: number;
  defaultTaxRate: number;
  paymentTermsDays: number;
  footerMessage: string;
  paymentInstructions: string;
}

export interface NotificationSettings {
  newOrder: boolean;
  paymentReceived: boolean;
  invoiceOverdue: boolean;
  lowInventory: boolean;
  newCustomer: boolean;
  employeeActivity: boolean;
}

export type CustomerStatus = "Active" | "Inactive" | "Lead";

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  status: CustomerStatus;
  tags: string[];
  ownerEmployeeId: string;
  notes: CustomerNote[];
  createdAt: string;
}

export interface CustomerNote {
  id: string;
  body: string;
  author: string;
  createdAt: string;
}

export type ItemKind = "Product" | "Service";
export type ItemStatus = "Active" | "Archived";

export interface Item {
  id: string;
  kind: ItemKind;
  name: string;
  sku: string;
  description: string;
  category: string;
  price: number;
  costPrice: number;
  taxRate: number;
  /** Products only. Services carry `null`. */
  stock: number | null;
  minStock: number | null;
  /** Services only, in minutes. */
  durationMinutes: number | null;
  status: ItemStatus;
  imageHue: number;
  createdAt: string;
}

export interface LineItem {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
}

export type OrderStatus =
  | "Draft"
  | "Pending"
  | "Confirmed"
  | "Completed"
  | "Cancelled";

export interface Order {
  id: string;
  number: string;
  customerId: string;
  items: LineItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  discount: number;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export type InvoiceStatus =
  | "Draft"
  | "Sent"
  | "Partially Paid"
  | "Paid"
  | "Overdue"
  | "Cancelled";

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  orderId: string | null;
  items: LineItem[];
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  discount: number;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export type PaymentMethod = "Cash" | "Bank Transfer" | "UPI" | "Card" | "Other";

export interface Payment {
  id: string;
  number: string;
  customerId: string;
  invoiceId: string | null;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
  createdBy: string;
}

export type ExpenseCategory =
  | "Salary"
  | "Rent"
  | "Utilities"
  | "Software"
  | "Marketing"
  | "Travel"
  | "Equipment"
  | "Other";

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  method: PaymentMethod;
  vendor: string;
  description: string;
  receiptName: string | null;
  createdBy: string;
}

export type EmployeeStatus = "Active" | "Disabled";

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  role: Role;
  joiningDate: string;
  status: EmployeeStatus;
  avatarHue: number;
}

export type NotificationKind =
  | "order"
  | "payment"
  | "invoice"
  | "inventory"
  | "customer"
  | "employee";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityRef: string;
  detail: string;
  ip: string;
  device: string;
  createdAt: string;
}

export interface Session {
  employeeId: string;
  name: string;
  email: string;
  role: Role;
}

export interface AppState {
  business: Business;
  invoiceSettings: InvoiceSettings;
  notificationSettings: NotificationSettings;
  customers: Customer[];
  items: Item[];
  orders: Order[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  employees: Employee[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
}
