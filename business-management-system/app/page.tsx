import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  CreditCard,
  FileText,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Customer CRM",
    body: "One record per customer with contact details, purchase history, outstanding balance, notes and full activity timeline.",
  },
  {
    icon: Package,
    title: "Products & inventory",
    body: "Track products and services, cost vs. selling price, tax rates and stock levels. Inventory adjusts automatically on every sale.",
  },
  {
    icon: ShoppingCart,
    title: "Sales orders",
    body: "Build an order in seconds. Subtotal, discounts and tax are calculated live, then convert it to an invoice with one click.",
  },
  {
    icon: FileText,
    title: "Professional invoices",
    body: "Branded invoices with your logo and payment terms. Download a PDF, print it, or mark it paid — status updates itself.",
  },
  {
    icon: CreditCard,
    title: "Payments & receivables",
    body: "Record full or partial payments across cash, UPI, card and bank transfer. Invoice status follows the money automatically.",
  },
  {
    icon: Receipt,
    title: "Expense tracking",
    body: "Log rent, salaries, software and travel against clear categories so your profit figure is always the real one.",
  },
  {
    icon: TrendingUp,
    title: "Reports & analytics",
    body: "Sales, profit & loss, customer, invoice and inventory reports over any date range — exportable to CSV or PDF.",
  },
  {
    icon: UsersRound,
    title: "Team & permissions",
    body: "Invite your team as Owner, Admin, Manager or Employee. Financial data stays visible only to the people who should see it.",
  },
  {
    icon: ShieldCheck,
    title: "Audit trail",
    body: "Every invoice raised, payment recorded and price changed is logged with the user, timestamp and device.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create your business",
    body: "Sign up, name your business and pick your currency. Your workspace is ready in under a minute.",
  },
  {
    n: "02",
    title: "Add customers and products",
    body: "Import your customer list and set up the products or services you sell, with prices and tax rates.",
  },
  {
    n: "03",
    title: "Start managing sales",
    body: "Raise orders, convert them into invoices and send them to customers straight from the dashboard.",
  },
  {
    n: "04",
    title: "Track your finances",
    body: "Record payments and expenses as they happen, and watch revenue, profit and receivables update live.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "₹0",
    cadence: "/month",
    blurb: "For solo owners just getting organised.",
    features: [
      "Up to 50 customers",
      "Unlimited invoices",
      "1 user",
      "Basic dashboard",
      "Email support",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Business",
    price: "₹1,499",
    cadence: "/month",
    blurb: "For growing teams that sell every day.",
    features: [
      "Unlimited customers",
      "Up to 10 team members",
      "Inventory management",
      "Full reports & exports",
      "Audit logs",
      "Priority support",
    ],
    cta: "Start 14-day trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    blurb: "For multi-branch businesses with custom needs.",
    features: [
      "Everything in Business",
      "Unlimited team members",
      "Custom roles & permissions",
      "Dedicated account manager",
      "SSO & advanced security",
      "99.9% uptime SLA",
    ],
    cta: "Talk to sales",
    featured: false,
  },
];

const FAQS = [
  {
    q: "Is my business data private?",
    a: "Yes. Every business gets an isolated workspace. Customers, invoices, products and payments belong to one business only and are never visible to another — every request is authorised against the business that owns the record.",
  },
  {
    q: "Can I control what my employees see?",
    a: "Yes. BizFlow ships with four roles — Owner, Admin, Manager and Employee. Employees can work with customers and orders but cannot open revenue figures, expenses, payroll or business settings unless you grant it.",
  },
  {
    q: "Which currencies do you support?",
    a: "INR, USD, EUR and GBP out of the box, chosen during onboarding. Every amount across invoices, reports and the dashboard follows the currency you pick.",
  },
  {
    q: "Can I send invoices to customers?",
    a: "Invoices can be downloaded as a branded PDF, printed, or emailed to the customer. Once payment arrives you record it against the invoice and the status moves to Partially Paid or Paid on its own.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. BizFlow runs in the browser on desktop, tablet and phone. Tables collapse into readable cards on small screens so you can check outstanding payments on the move.",
  },
  {
    q: "How does the demo work?",
    a: "The demo workspace belongs to TechNova Solutions, a fictional IT services business with a year of realistic data — 25 customers, 30 products and services, 50 invoices and a full payment history. Explore anything; you can reset the data whenever you like.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <Hero />
      <Metrics />
      <Features />
      <HowItWorks />
      <DashboardPreview />
      <Pricing />
      <Faq />
      <CtaBand />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            BF
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-slate-900">
            BizFlow
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {[
            ["Features", "#features"],
            ["How it works", "#how"],
            ["Pricing", "#pricing"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60rem 30rem at 50% -10%, #eef4ff 0%, transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-20 text-center sm:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[13px] font-medium text-brand-700">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Built for small and medium businesses
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl">
          Manage your entire business in one place
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
          Customers, sales, invoices, payments, inventory and analytics — all from
          one powerful business management platform.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand-600 px-6 text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Start free
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/login?demo=1"
            className="inline-flex h-12 items-center rounded-lg border border-slate-300 bg-white px-6 text-[15px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            View demo
          </Link>
        </div>

        <p className="mt-4 text-[13px] text-slate-500">
          No credit card required · Explore a fully populated demo workspace
        </p>
      </div>
    </section>
  );
}

function Metrics() {
  const stats = [
    ["4,200+", "Businesses onboarded"],
    ["₹280 Cr", "Invoiced through BizFlow"],
    ["12 min", "Average setup time"],
    ["99.9%", "Uptime last 12 months"],
  ];
  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-5 py-10 sm:grid-cols-4">
        {stats.map(([value, label]) => (
          <div key={label} className="px-4 py-3 text-center">
            <p className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {value}
            </p>
            <p className="mt-1 text-[13px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Everything included
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          One platform instead of six spreadsheets
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-slate-600">
          Every module talks to the others. Raise an order and it updates
          inventory, becomes an invoice, and lands in your revenue chart.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-card transition-shadow hover:shadow-pop"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-slate-900">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {f.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Up and running the same afternoon
          </h2>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-4">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-card"
            >
              <span className="text-sm font-semibold text-brand-600">{s.n}</span>
              <h3 className="mt-3 text-[15px] font-semibold text-slate-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const bars = [42, 58, 51, 70, 63, 88, 76, 95, 84, 100, 91, 78];
  const months = ["S", "O", "N", "D", "J", "F", "M", "A", "M", "J", "J", "A"];

  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Dashboard preview
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Your whole business, at a glance
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-slate-600">
          Revenue, profit, outstanding payments and recent activity — the first
          thing you see every morning.
        </p>
      </div>

      <div className="mt-14 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
        {/* browser chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-3 rounded-md bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200">
            app.bizflow.io/dashboard
          </span>
        </div>

        <div className="flex">
          {/* mini sidebar */}
          <div className="hidden w-48 shrink-0 border-r border-slate-200 p-4 sm:block">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-[11px] font-bold text-white">
                TN
              </span>
              <span className="text-[13px] font-semibold text-slate-800">
                TechNova
              </span>
            </div>
            <div className="mt-5 space-y-1.5">
              {[
                "Dashboard",
                "Customers",
                "Products",
                "Orders",
                "Invoices",
                "Payments",
                "Reports",
              ].map((l, i) => (
                <div
                  key={l}
                  className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium ${
                    i === 0
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-500"
                  }`}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* mini content */}
          <div className="min-w-0 flex-1 bg-slate-50 p-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Total revenue", "₹1.94 Cr", "+12.4%", "text-emerald-600"],
                ["Net profit", "₹62.8 L", "+8.1%", "text-emerald-600"],
                ["Outstanding", "₹18.2 L", "9 invoices", "text-amber-600"],
                ["Customers", "25", "+3 this month", "text-slate-500"],
              ].map(([label, value, delta, tone]) => (
                <div
                  key={label}
                  className="rounded-lg border border-slate-200 bg-white p-3.5"
                >
                  <p className="text-[11px] font-medium text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1.5 text-lg font-semibold tracking-tight text-slate-900">
                    {value}
                  </p>
                  <p className={`mt-0.5 text-[11px] font-medium ${tone}`}>
                    {delta}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-slate-800">
                    Revenue
                  </p>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                    Last 12 months
                  </span>
                </div>
                <div className="mt-5 flex h-28 items-end gap-1.5">
                  {bars.map((h, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className="w-full rounded-sm bg-brand-500/85"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[9px] text-slate-400">
                        {months[i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-[13px] font-semibold text-slate-800">
                  Recent activity
                </p>
                <div className="mt-3 space-y-2.5">
                  {[
                    ["INV-01048", "Northwind Retail", "Paid"],
                    ["INV-01047", "Lumen Analytics", "Sent"],
                    ["INV-01046", "Orbit Logistics", "Overdue"],
                    ["INV-01045", "Cedarwood", "Paid"],
                  ].map(([no, who, status]) => (
                    <div key={no} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-slate-800">
                          {no}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                          {who}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                          status === "Paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : status === "Overdue"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-brand-50 text-brand-700"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/login?demo=1"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          <BarChart3 size={17} />
          Open the live demo dashboard
        </Link>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Simple plans that grow with you
          </h2>
          <p className="mt-4 text-[17px] text-slate-600">
            Start free, upgrade when your team does. Cancel any time.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border bg-white p-7 ${
                p.featured
                  ? "border-brand-500 shadow-pop ring-1 ring-brand-500"
                  : "border-slate-200 shadow-card"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-[15px] font-semibold text-slate-900">
                {p.name}
              </h3>
              <p className="mt-1 text-[13px] text-slate-500">{p.blurb}</p>
              <p className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-slate-900">
                  {p.price}
                </span>
                <span className="text-sm text-slate-500">{p.cadence}</span>
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Check
                      size={17}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`mt-7 inline-flex h-11 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  p.featured
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-slate-500">
          Prices shown are indicative for this demo. Billing is not enabled.
        </p>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-24">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          FAQ
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Questions, answered
        </h2>
      </div>

      <div className="mt-12 divide-y divide-slate-200 border-y border-slate-200">
        {FAQS.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-slate-900">
              {f.q}
              <span className="shrink-0 text-slate-400 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="bg-slate-900">
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Stop running your business from spreadsheets
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-slate-300">
          Open the demo workspace and click through a full year of a real-looking
          business — customers, invoices, payments and reports.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/login?demo=1"
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-[15px] font-medium text-slate-900 transition-colors hover:bg-slate-100"
          >
            View demo
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center rounded-lg border border-slate-700 px-6 text-[15px] font-medium text-white transition-colors hover:bg-slate-800"
          >
            Create an account
          </Link>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
            BF
          </span>
          <span className="text-sm font-semibold text-slate-900">BizFlow</span>
        </div>
        <p className="text-[13px] text-slate-500">
          © {new Date().getFullYear()} BizFlow. A portfolio demonstration
          product.
        </p>
        <div className="flex gap-6 text-[13px] text-slate-500">
          <a href="#features" className="hover:text-slate-900">
            Features
          </a>
          <a href="#pricing" className="hover:text-slate-900">
            Pricing
          </a>
          <Link href="/login" className="hover:text-slate-900">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
