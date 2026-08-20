import type {
  AppNotification,
  AppState,
  AuditLog,
  Customer,
  Employee,
  Expense,
  ExpenseCategory,
  Invoice,
  InvoiceStatus,
  Item,
  LineItem,
  Order,
  OrderStatus,
  Payment,
  PaymentMethod,
} from "./types";

/**
 * Deterministic PRNG (mulberry32) so the demo workspace looks identical on
 * every machine — screenshots, walkthroughs and numbers stay reproducible.
 */
function rng(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Re-seeded at the top of every buildSeed() call. Without the reset the
 * generator would carry state between calls, so a second render (another
 * server request, or React's double-invoked initializer) would produce a
 * different workspace and the client would fail to hydrate.
 */
let rand = rng(20260820);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;

const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number, hour = 10) => {
  const d = new Date();
  d.setHours(hour, between(0, 59), 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

const FIRST = [
  "Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Meera", "Karan", "Divya",
  "Siddharth", "Neha", "Arjun", "Kavya", "Rahul", "Sneha", "Aditya", "Isha",
  "Nikhil", "Pooja", "Manish", "Tara", "Varun", "Ritika", "Sameer", "Anjali",
  "Harsh", "Lakshmi", "Yash", "Nisha",
];
const LAST = [
  "Sharma", "Iyer", "Mehta", "Reddy", "Nair", "Kapoor", "Bose", "Chopra",
  "Desai", "Joshi", "Malhotra", "Pillai", "Rao", "Sethi", "Verma", "Banerjee",
  "Gupta", "Khanna",
];
const COMPANIES = [
  "Northwind Retail", "Lumen Analytics", "Orbit Logistics", "Cedarwood Interiors",
  "Bluepeak Healthcare", "Vertex Manufacturing", "Silverline Media",
  "Quantum Edtech", "Harbour Foods", "Ironclad Security", "Kite Financial",
  "Solstice Travel", "Redwood Legal", "Nimbus Cloudworks", "Apex Fitness",
  "Meridian Textiles", "Copperfield Realty", "Brightlane Studios",
  "Falcon Auto Parts", "Greengrid Energy", "Trailhead Sports", "Sable Cosmetics",
  "Pinecrest Hotels", "Atlas Consulting", "Wavelength Audio",
];
const CITIES: [string, string][] = [
  ["Bengaluru", "Karnataka"], ["Mumbai", "Maharashtra"], ["Pune", "Maharashtra"],
  ["Hyderabad", "Telangana"], ["Chennai", "Tamil Nadu"], ["Gurugram", "Haryana"],
  ["Noida", "Uttar Pradesh"], ["Ahmedabad", "Gujarat"], ["Kolkata", "West Bengal"],
  ["Jaipur", "Rajasthan"], ["Kochi", "Kerala"], ["Indore", "Madhya Pradesh"],
];
const STREETS = [
  "MG Road", "Anna Salai", "Linking Road", "Park Street", "Brigade Road",
  "Residency Road", "Sector 44", "Church Street", "Hill Road", "SG Highway",
];

const PRODUCTS: [string, string, number, number, number][] = [
  // name, category, price, cost, taxRate
  ["ThinkEdge Laptop 14\"", "Hardware", 74900, 61000, 18],
  ["ThinkEdge Laptop 16\" Pro", "Hardware", 118500, 96000, 18],
  ["NovaDesk Monitor 27\" 4K", "Hardware", 32900, 25400, 18],
  ["NovaDesk Monitor 32\" QHD", "Hardware", 41200, 32800, 18],
  ["Mechanical Keyboard MX", "Accessories", 8900, 5600, 18],
  ["Ergonomic Wireless Mouse", "Accessories", 3200, 1850, 18],
  ["USB-C Docking Station", "Accessories", 12400, 8300, 18],
  ["Noise-Cancelling Headset", "Accessories", 15900, 10800, 18],
  ["1080p Conference Webcam", "Accessories", 7400, 4900, 18],
  ["Standing Desk Converter", "Furniture", 18900, 12600, 18],
  ["Ergonomic Task Chair", "Furniture", 24500, 16400, 18],
  ["Server Rack 12U", "Infrastructure", 46800, 37200, 18],
  ["Network Switch 24-Port", "Infrastructure", 28900, 22100, 18],
  ["Enterprise Wi-Fi 6 AP", "Infrastructure", 21400, 16200, 18],
  ["UPS 3kVA Online", "Infrastructure", 54600, 43900, 18],
  ["NAS Storage 16TB", "Infrastructure", 89200, 71500, 18],
  ["Barcode Scanner Pro", "Retail Tech", 11200, 7400, 18],
  ["Thermal Receipt Printer", "Retail Tech", 9800, 6300, 18],
  ["POS Terminal Bundle", "Retail Tech", 62500, 49800, 18],
  ["Tablet Kiosk Stand", "Retail Tech", 6900, 4100, 18],
];

const SERVICES: [string, string, number, number, number][] = [
  // name, category, price, taxRate, durationMinutes
  ["Cloud Migration Assessment", "Consulting", 145000, 18, 2400],
  ["Managed IT Support — Monthly", "Managed Services", 68000, 18, 0],
  ["Network Audit & Hardening", "Consulting", 92000, 18, 1440],
  ["Custom Web Application Build", "Development", 385000, 18, 0],
  ["Mobile App Development", "Development", 460000, 18, 0],
  ["Data Warehouse Setup", "Data", 275000, 18, 0],
  ["BI Dashboard Implementation", "Data", 158000, 18, 0],
  ["Cybersecurity Training Workshop", "Training", 42000, 18, 480],
  ["On-site Hardware Installation", "Field Services", 18500, 18, 240],
  ["Annual Maintenance Contract", "Managed Services", 124000, 18, 0],
];

const EMPLOYEES: [string, string, string, Employee["role"], number][] = [
  ["Rajesh Menon", "Founder & CEO", "Leadership", "Owner", 1180],
  ["Sarah Dsouza", "Operations Director", "Operations", "Admin", 980],
  ["Aditya Kulkarni", "Sales Manager", "Sales", "Manager", 820],
  ["Fatima Sheikh", "Finance Manager", "Finance", "Manager", 760],
  ["John Mathew", "Senior Account Executive", "Sales", "Employee", 610],
  ["Ritu Agarwal", "Account Executive", "Sales", "Employee", 430],
  ["Daniel Fernandes", "Solutions Engineer", "Delivery", "Employee", 340],
  ["Megha Nanda", "Customer Success Associate", "Support", "Employee", 190],
];

/** Recurring monthly costs, booked on the same day of every month. */
const RECURRING_EXPENSES: [string, ExpenseCategory, number, number, string][] = [
  // title, category, base amount, day of month, vendor
  ["Office rent — Koramangala HQ", "Rent", 185000, 3, "Prestige Estates"],
  ["Team payroll — engineering", "Salary", 420000, 1, "Internal Payroll"],
  ["Team payroll — sales & ops", "Salary", 260000, 1, "Internal Payroll"],
  ["AWS infrastructure", "Software", 68000, 7, "Amazon Web Services"],
  ["Google Workspace licences", "Software", 18000, 9, "Google Cloud India"],
  ["Electricity & water", "Utilities", 32000, 12, "BESCOM"],
  ["Fibre internet — 1 Gbps", "Utilities", 24000, 12, "ACT Fibernet"],
];

/** One-off costs, spread across the year. */
const ONE_OFF_EXPENSES: [string, ExpenseCategory, number, number, string][] = [
  ["Trade show booth — TechExpo", "Marketing", 320000, 41, "TechExpo India"],
  ["LinkedIn Ads campaign", "Marketing", 165000, 27, "LinkedIn Marketing"],
  ["Content & SEO agency", "Marketing", 96000, 104, "Ranktail Digital"],
  ["Brand refresh & collateral", "Marketing", 138000, 232, "Studio Kite"],
  ["Client visit — Mumbai", "Travel", 46800, 16, "MakeMyTrip Business"],
  ["Client visit — Hyderabad", "Travel", 31200, 93, "Cleartrip Corporate"],
  ["Team offsite — Coorg", "Travel", 184000, 168, "Wanderlust Retreats"],
  ["Developer workstations (4x)", "Equipment", 296000, 52, "Ingram Micro"],
  ["Conference room AV upgrade", "Equipment", 128000, 141, "Crestron Partner"],
  ["Server colocation renewal", "Equipment", 142000, 208, "Netmagic Solutions"],
  ["Warehouse racking & tools", "Equipment", 86000, 276, "Godrej Interio"],
  ["Figma & design tooling", "Software", 28400, 30, "Figma Inc."],
  ["Atlassian & CI tooling", "Software", 54000, 122, "Atlassian"],
  ["Accounting & CA retainer", "Other", 55000, 24, "Shah & Associates"],
  ["Corporate health insurance", "Other", 218000, 47, "ICICI Lombard"],
  ["Office housekeeping", "Other", 26500, 25, "CleanPro Facility"],
  ["Statutory audit fees", "Other", 92000, 197, "Shah & Associates"],
  ["Sales team incentives", "Salary", 175000, 35, "Internal Payroll"],
  ["Diwali bonus", "Salary", 340000, 289, "Internal Payroll"],
  ["Recruitment agency fee", "Other", 165000, 251, "Talentbridge"],
];

const PAYMENT_METHODS: PaymentMethod[] = [
  "Bank Transfer", "UPI", "Card", "Bank Transfer", "Cash", "Bank Transfer", "UPI",
];

const id = (prefix: string, n: number) => `${prefix}_${String(n).padStart(4, "0")}`;
const pad = (n: number, len = 5) => String(n).padStart(len, "0");

export function docTotal(items: LineItem[], discount = 0) {
  const sub = items.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const lineDiscounts = items.reduce(
    (s, l) => s + (l.unitPrice * l.quantity * l.discount) / 100,
    0,
  );
  const taxable = sub - lineDiscounts;
  const orderDiscount = (taxable * discount) / 100;
  const net = taxable - orderDiscount;
  const tax = items.reduce((s, l) => {
    const gross = l.unitPrice * l.quantity;
    const afterLine = gross - (gross * l.discount) / 100;
    const afterOrder = afterLine - (afterLine * discount) / 100;
    return s + (afterOrder * l.taxRate) / 100;
  }, 0);
  return {
    subtotal: sub,
    discount: lineDiscounts + orderDiscount,
    tax,
    total: Math.round((net + tax) * 100) / 100,
  };
}

export function buildSeed(): AppState {
  rand = rng(20260820);

  const employees: Employee[] = EMPLOYEES.map(
    ([name, position, department, role, joinedDaysAgo], i) => ({
      id: id("emp", i + 1),
      name,
      email: `${name.split(" ")[0].toLowerCase()}@buildforgeo.in`,
      phone: `+91 ${between(70, 99)}${between(10000000, 99999999)}`,
      position,
      department,
      role,
      joiningDate: iso(daysAgo(joinedDaysAgo)),
      status: i === 7 ? "Active" : "Active",
      avatarHue: (i * 47) % 360,
    }),
  );

  const salesReps = employees.filter(
    (e) => e.department === "Sales" || e.role === "Manager",
  );

  const items: Item[] = [
    ...PRODUCTS.map(([name, category, price, cost, taxRate], i) => {
      const stock = i % 7 === 3 ? 0 : i % 5 === 1 ? between(1, 6) : between(14, 180);
      return {
        id: id("itm", i + 1),
        kind: "Product" as const,
        name,
        sku: `BF-${category.slice(0, 3).toUpperCase()}-${pad(1001 + i, 4)}`,
        description: `${name} — supplied, configured and warranty-backed by BuildForgeo.`,
        category,
        price,
        costPrice: cost,
        taxRate,
        stock,
        minStock: 8,
        durationMinutes: null,
        status: "Active" as const,
        imageHue: (i * 37) % 360,
        createdAt: iso(daysAgo(between(120, 700))),
      };
    }),
    ...SERVICES.map(([name, category, price, taxRate, duration], i) => ({
      id: id("itm", PRODUCTS.length + i + 1),
      kind: "Service" as const,
      name,
      sku: `BF-SVC-${pad(2001 + i, 4)}`,
      description: `${name} delivered by BuildForgeo's certified consulting team.`,
      category,
      price,
      costPrice: Math.round(price * 0.42),
      taxRate,
      stock: null,
      minStock: null,
      durationMinutes: duration || null,
      status: "Active" as const,
      imageHue: ((i + 11) * 37) % 360,
      createdAt: iso(daysAgo(between(120, 700))),
    })),
  ];

  const customers: Customer[] = Array.from({ length: 25 }, (_, i) => {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`;
    const company = COMPANIES[i % COMPANIES.length];
    const [city, state] = CITIES[i % CITIES.length];
    const status = i % 11 === 4 ? "Lead" : i % 9 === 7 ? "Inactive" : "Active";
    const slug = company.toLowerCase().replace(/[^a-z]+/g, "");
    return {
      id: id("cus", i + 1),
      name,
      company,
      email: `${name.split(" ")[0].toLowerCase()}@${slug}.com`,
      phone: `+91 ${between(70, 99)}${between(10000000, 99999999)}`,
      addressLine: `${between(1, 240)}, ${pick(STREETS)}`,
      city,
      state,
      postalCode: String(between(110001, 700099)),
      country: "India",
      status: status as Customer["status"],
      tags: i % 4 === 0 ? ["Key Account"] : i % 3 === 0 ? ["SMB"] : ["Mid-Market"],
      ownerEmployeeId: salesReps[i % salesReps.length].id,
      createdAt: iso(daysAgo(between(20, 700))),
      notes:
        i % 3 === 0
          ? [
              {
                id: id("nte", i + 1),
                body: pick([
                  "Renewal conversation scheduled for next quarter. Wants a volume discount on hardware.",
                  "Procurement runs on 45-day terms — invoice early in the month.",
                  "Interested in the managed services bundle after the current AMC expires.",
                  "Escalation resolved. Very happy with the on-site response time.",
                ]),
                author: pick(salesReps).name,
                createdAt: iso(daysAgo(between(3, 90))),
              },
            ]
          : [],
    };
  });

  const activeCustomers = customers.filter((c) => c.status !== "Lead");

  function makeLines(count: number, seedIdx: number): LineItem[] {
    const chosen = new Set<number>();
    const lines: LineItem[] = [];
    for (let k = 0; k < count; k++) {
      let idx = between(0, items.length - 1);
      let guard = 0;
      while (chosen.has(idx) && guard++ < 12) idx = between(0, items.length - 1);
      chosen.add(idx);
      const it = items[idx];
      lines.push({
        id: id("lin", seedIdx * 10 + k),
        itemId: it.id,
        name: it.name,
        quantity: it.kind === "Service" ? 1 : between(1, 6),
        unitPrice: it.price,
        taxRate: it.taxRate,
        discount: k === 0 && seedIdx % 5 === 0 ? 5 : 0,
      });
    }
    return lines;
  }

  // ---- Orders spread across the last 12 months -----------------------------
  // Status follows the order's age rather than its index, so the pipeline reads
  // the way a real one does: drafts and pending orders this week, confirmed work
  // in the last few weeks, everything older completed.
  const orders: Order[] = [];
  for (let i = 0; i < 62; i++) {
    const daysBack = Math.max(
      1,
      Math.round(358 - (i / 61) * 356) + between(-2, 2),
    );
    const cust = activeCustomers[(i * 7) % activeCustomers.length];
    const status: OrderStatus =
      daysBack <= 3
        ? "Draft"
        : daysBack <= 8
          ? "Pending"
          : daysBack <= 30
            ? "Confirmed"
            : i % 19 === 5
              ? "Cancelled"
              : "Completed";
    orders.push({
      id: id("ord", i + 1),
      number: `ORD-${pad(1001 + i)}`,
      customerId: cust.id,
      items: makeLines(between(1, 4), i + 1),
      status,
      paymentMethod: pick(PAYMENT_METHODS),
      discount: i % 6 === 0 ? between(2, 8) : 0,
      notes: i % 8 === 0 ? "Deliver to the client's Bengaluru office, attn. procurement." : "",
      createdBy: pick(salesReps).name,
      createdAt: iso(daysAgo(daysBack)),
    });
  }
  orders.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  // ---- Invoices, derived from confirmed and completed orders ----------------
  // Status follows the due date: not yet due reads as Sent, past due is mostly
  // Paid with a realistic tail of Overdue and Partially Paid, and the two most
  // recent are still drafts.
  const invoices: Invoice[] = [];
  const billable = orders.filter(
    (o) => o.status === "Completed" || o.status === "Confirmed",
  );
  for (let i = 0; i < 50; i++) {
    // Step across the whole billable history so invoices reach back to the
    // start of the 12-month window instead of clustering in recent months.
    const src = billable[Math.min(
      billable.length - 1,
      Math.floor((i / 50) * billable.length),
    )];
    const issued = new Date(src.createdAt);
    issued.setDate(issued.getDate() + between(0, 3));
    if (+issued > Date.now()) issued.setTime(Date.now() - 86400000);
    const due = new Date(issued);
    due.setDate(due.getDate() + 15);
    const overdueDays = Math.floor((Date.now() - +due) / 86400000);

    // Drafts sit a little back in the list so the current month still carries
    // real billed revenue rather than only unissued documents.
    let status: InvoiceStatus;
    if (i === 3 || i === 11) status = "Draft";
    else if (i === 6) status = "Cancelled";
    else if (overdueDays < 0) status = i % 7 === 3 ? "Partially Paid" : "Sent";
    else if (i % 8 === 3) status = "Overdue";
    else if (i % 11 === 5) status = "Partially Paid";
    else status = "Paid";

    invoices.push({
      id: id("inv", i + 1),
      number: `INV-${pad(1001 + i)}`,
      customerId: src.customerId,
      orderId: src.id,
      items: src.items,
      issueDate: iso(issued),
      dueDate: iso(due),
      status,
      discount: src.discount,
      notes: "",
      createdBy: src.createdBy,
      createdAt: iso(issued),
    });
  }
  invoices.sort((a, b) => +new Date(b.issueDate) - +new Date(a.issueDate));

  // ---- Payments consistent with each invoice's status ---------------------
  const payments: Payment[] = [];
  let payNo = 1;
  for (const inv of invoices) {
    if (inv.status !== "Paid" && inv.status !== "Partially Paid") continue;
    const { total } = docTotal(inv.items, inv.discount);
    const paid = new Date(inv.issueDate);
    paid.setDate(paid.getDate() + between(2, 14));
    if (+paid > Date.now()) paid.setTime(Date.now() - 86400000);

    if (inv.status === "Paid" && payNo % 6 === 0) {
      // split into two receipts to demonstrate multiple payments per invoice
      const first = Math.round(total * 0.4);
      payments.push({
        id: id("pay", payNo),
        number: `PMT-${pad(2001 + payNo)}`,
        customerId: inv.customerId,
        invoiceId: inv.id,
        amount: first,
        date: iso(paid),
        method: pick(PAYMENT_METHODS),
        reference: `REF${between(100000, 999999)}`,
        notes: "Advance against invoice",
        createdBy: "Fatima Sheikh",
      });
      payNo++;
      const second = new Date(paid);
      second.setDate(second.getDate() + between(4, 12));
      if (+second > Date.now()) second.setTime(Date.now() - 3600000);
      payments.push({
        id: id("pay", payNo),
        number: `PMT-${pad(2001 + payNo)}`,
        customerId: inv.customerId,
        invoiceId: inv.id,
        amount: Math.round(total - first),
        date: iso(second),
        method: pick(PAYMENT_METHODS),
        reference: `REF${between(100000, 999999)}`,
        notes: "Balance settlement",
        createdBy: "Fatima Sheikh",
      });
      payNo++;
    } else {
      payments.push({
        id: id("pay", payNo),
        number: `PMT-${pad(2001 + payNo)}`,
        customerId: inv.customerId,
        invoiceId: inv.id,
        amount:
          inv.status === "Paid"
            ? Math.round(total)
            : Math.round(total * (between(30, 65) / 100)),
        date: iso(paid),
        method: pick(PAYMENT_METHODS),
        reference: `REF${between(100000, 999999)}`,
        notes: inv.status === "Paid" ? "Settled in full" : "Part payment received",
        createdBy: "Fatima Sheikh",
      });
      payNo++;
    }
  }
  payments.sort((a, b) => +new Date(b.date) - +new Date(a.date));

  // ---- Expenses: 12 months of recurring costs plus one-off spend ----------
  const expenses: Expense[] = [];
  let expNo = 1;

  for (let monthsBack = 11; monthsBack >= 0; monthsBack--) {
    for (const [title, category, base, day, vendor] of RECURRING_EXPENSES) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - monthsBack);
      d.setDate(day);
      d.setHours(11, between(0, 59), 0, 0);
      if (+d > Date.now()) continue; // don't book costs that haven't happened

      const month = d.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
      // Salaries creep up over the year; utilities wobble month to month.
      const drift =
        category === "Salary"
          ? 1 + (11 - monthsBack) * 0.012
          : 1 + between(-6, 8) / 100;

      expenses.push({
        id: id("exp", expNo),
        title: `${title} — ${month}`,
        category,
        amount: Math.round((base * drift) / 100) * 100,
        date: iso(d),
        method: category === "Salary" ? "Bank Transfer" : pick(PAYMENT_METHODS),
        vendor,
        description: `Recurring ${category.toLowerCase()} cost for ${month}.`,
        receiptName: expNo % 4 === 0 ? `receipt-${pad(expNo, 3)}.pdf` : null,
        createdBy: "Fatima Sheikh",
      });
      expNo++;
    }
  }

  for (const [title, category, amount, ago, vendor] of ONE_OFF_EXPENSES) {
    expenses.push({
      id: id("exp", expNo),
      title,
      category,
      amount,
      date: iso(daysAgo(ago)),
      method: pick(PAYMENT_METHODS),
      vendor,
      description: `${category} expense recorded for ${vendor}.`,
      receiptName: expNo % 3 === 0 ? `receipt-${pad(expNo, 3)}.pdf` : null,
      createdBy: "Fatima Sheikh",
    });
    expNo++;
  }

  expenses.sort((a, b) => +new Date(b.date) - +new Date(a.date));

  // ---- Notifications ------------------------------------------------------
  const lowStock = items.filter(
    (i) => i.stock !== null && i.minStock !== null && i.stock <= i.minStock,
  );
  const overdue = invoices.filter((i) => i.status === "Overdue");
  const cusById = (cid: string) => customers.find((c) => c.id === cid)!;

  const notifications: AppNotification[] = [
    ...payments.slice(0, 3).map((p, i) => ({
      id: id("ntf", i + 1),
      kind: "payment" as const,
      title: "Payment received",
      body: `${cusById(p.customerId).company} paid ₹${p.amount.toLocaleString("en-IN")} (${p.number}).`,
      href: "/payments",
      read: false,
      createdAt: p.date,
    })),
    ...orders.slice(0, 2).map((o, i) => ({
      id: id("ntf", 10 + i),
      kind: "order" as const,
      title: "New order created",
      body: `${o.number} for ${cusById(o.customerId).company} is ${o.status.toLowerCase()}.`,
      href: "/orders",
      read: false,
      createdAt: o.createdAt,
    })),
    ...overdue.slice(0, 2).map((inv, i) => ({
      id: id("ntf", 20 + i),
      kind: "invoice" as const,
      title: "Invoice overdue",
      body: `${inv.number} for ${cusById(inv.customerId).company} has passed its due date.`,
      href: "/invoices",
      read: false,
      createdAt: inv.dueDate,
    })),
    ...lowStock.slice(0, 3).map((it, i) => ({
      id: id("ntf", 30 + i),
      kind: "inventory" as const,
      title: it.stock === 0 ? "Out of stock" : "Low inventory",
      body: `${it.name} is down to ${it.stock} unit${it.stock === 1 ? "" : "s"}.`,
      href: "/products",
      read: i > 0,
      createdAt: iso(daysAgo(between(1, 6))),
    })),
    {
      id: id("ntf", 40),
      kind: "customer",
      title: "New customer added",
      body: `${customers[0].company} was added by ${employees[4].name}.`,
      href: "/customers",
      read: true,
      createdAt: iso(daysAgo(2, 15)),
    },
    {
      id: id("ntf", 41),
      kind: "employee",
      title: "Employee activity",
      body: `${employees[5].name} created 3 orders today.`,
      href: "/employees",
      read: true,
      createdAt: iso(daysAgo(1, 18)),
    },
  ]
    .map((n) => n as AppNotification)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  // ---- Audit log ----------------------------------------------------------
  const auditLogs: AuditLog[] = [
    ...invoices.slice(0, 6).map((inv, i) => ({
      id: id("aud", i + 1),
      actor: inv.createdBy,
      action: "created",
      entity: "Invoice",
      entityRef: inv.number,
      detail: `Created invoice ${inv.number} for ${cusById(inv.customerId).company}`,
      ip: `49.36.${between(1, 254)}.${between(1, 254)}`,
      device: pick(["Chrome · Windows", "Safari · macOS", "Chrome · Android"]),
      createdAt: inv.createdAt,
    })),
    ...payments.slice(0, 5).map((p, i) => ({
      id: id("aud", 20 + i),
      actor: p.createdBy,
      action: "recorded",
      entity: "Payment",
      entityRef: p.number,
      detail: `Recorded payment of ₹${p.amount.toLocaleString("en-IN")} from ${cusById(p.customerId).company}`,
      ip: `49.36.${between(1, 254)}.${between(1, 254)}`,
      device: "Chrome · Windows",
      createdAt: p.date,
    })),
    ...orders.slice(0, 5).map((o, i) => ({
      id: id("aud", 40 + i),
      actor: o.createdBy,
      action: "created",
      entity: "Order",
      entityRef: o.number,
      detail: `Created order ${o.number} for ${cusById(o.customerId).company}`,
      ip: `49.36.${between(1, 254)}.${between(1, 254)}`,
      device: pick(["Chrome · Windows", "Edge · Windows"]),
      createdAt: o.createdAt,
    })),
    {
      id: id("aud", 60),
      actor: "Rajesh Menon",
      action: "updated",
      entity: "Product",
      entityRef: items[2].sku,
      detail: `Changed price of ${items[2].name} to ₹${items[2].price.toLocaleString("en-IN")}`,
      ip: "49.36.12.88",
      device: "Safari · macOS",
      createdAt: iso(daysAgo(4, 11)),
    },
    {
      id: id("aud", 61),
      actor: "Sarah Dsouza",
      action: "updated",
      entity: "Employee",
      entityRef: employees[6].name,
      detail: `Changed role of ${employees[6].name} to ${employees[6].role}`,
      ip: "49.36.12.90",
      device: "Chrome · Windows",
      createdAt: iso(daysAgo(9, 16)),
    },
    {
      id: id("aud", 62),
      actor: "Rajesh Menon",
      action: "updated",
      entity: "Settings",
      entityRef: "Invoice settings",
      detail: "Changed default tax rate to 18% and payment terms to 15 days",
      ip: "49.36.12.88",
      device: "Safari · macOS",
      createdAt: iso(daysAgo(21, 9)),
    },
  ].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return {
    business: {
      id: "biz_0001",
      name: "BuildForgeo",
      legalName: "BuildForgeo Pvt. Ltd.",
      industry: "IT Services & Hardware",
      email: "accounts@buildforgeo.in",
      phone: "+91 80 4718 2200",
      website: "www.buildforgeo.in",
      addressLine: "4th Floor, Prestige Tower, 17 Koramangala 5th Block",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560095",
      country: "India",
      currency: "INR",
      taxId: "29AAFCT4512R1ZP",
      logoInitials: "BF",
    },
    invoiceSettings: {
      prefix: "INV-",
      nextNumber: 1051,
      defaultTaxRate: 18,
      paymentTermsDays: 15,
      footerMessage: "Thank you for your business. We appreciate the partnership.",
      paymentInstructions:
        "Bank: HDFC Bank, Koramangala · A/C: 50200041872214 · IFSC: HDFC0001284 · UPI: technova@hdfcbank",
    },
    notificationSettings: {
      newOrder: true,
      paymentReceived: true,
      invoiceOverdue: true,
      lowInventory: true,
      newCustomer: true,
      employeeActivity: false,
    },
    customers,
    items,
    orders,
    invoices,
    payments,
    expenses,
    employees,
    notifications,
    auditLogs,
  };
}
