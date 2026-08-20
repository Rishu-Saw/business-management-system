# BizFlow — Business Management & CRM

A multi-module business management platform for small and medium businesses:
customers, products and services, sales orders, invoices, payments, expenses,
employees, reporting and audit logs — all behind one dashboard.

Built as a **client demo**: every screen is real and every CRUD operation works
end to end, backed by a seeded workspace that persists in the browser rather
than a database server. See [Demo build notes](#demo-build-notes) for what that
means and what would change for production.

---

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build && npm start   # production build
```

## Demo accounts

Password for every account: `demo1234`

| Role | Email | What they can see |
|---|---|---|
| Business Owner | `rajesh@buildforgeo.in` | Everything — revenue, expenses, team, settings |
| Sales Manager | `aditya@buildforgeo.in` | Customers, products, orders, invoices, payments, reports |
| Employee | `daniel@buildforgeo.in` | Assigned customers and orders only — no financials |

The sign-in screen has one-click buttons for all three, so you can show how the
navigation and the dashboard change with the role.

## The demo walkthrough

The flow worth showing, in order:

**Landing page** → **Sign in** → **Dashboard** → **Customer profile** →
**Product catalogue** → **Order** → **Invoice (PDF)** → **Payment** →
**Reports**

1. **Landing page** (`/`) — hero, features, how it works, dashboard preview,
   pricing, FAQ.
2. **Sign in** (`/login`) — pick "Business Owner" from the demo panel.
3. **Dashboard** — KPI cards, revenue vs. expenses over today / 7d / 30d / 12m,
   sales breakdown by category, recent transactions, outstanding invoices.
4. **Customers** — search, filter, sort, paginate; open a profile for the
   financial summary, invoice and payment history, orders and notes.
5. **Products** — inventory tiles (in stock / low / out), catalogue with margin.
6. **Orders** — create one; totals compute live and stock drops when you confirm
   it. Then *Convert to invoice*.
7. **Invoices** — open one for the branded document. **Download PDF** produces a
   real, properly laid-out A4 invoice. **Print** prints the document alone.
8. **Payments** — record a partial payment against an invoice and watch the
   status move to *Partially Paid*, then *Paid* once settled.
9. **Reports** — five reports over any date range, exportable to CSV and PDF.
10. **Audit logs** — every action you just took is listed with user, timestamp
    and device.

Sign out and back in as the **Employee** account to show that revenue figures,
expenses, employees and settings disappear entirely.

## Modules

| Module | Highlights |
|---|---|
| Authentication | Sign in / sign up / forgot & reset password, session persistence, role-based access |
| Onboarding | Three-step wizard — business profile, currency, first records — with progress |
| Dashboard | Six KPIs with period-on-period deltas, interactive charts, quick actions |
| Customers | Full CRM: list with search/filter/sort/pagination, profile with 4 tabs, notes |
| Products & services | Products with SKU, stock and minimum levels; services with duration |
| Orders | Line-item editor, live subtotal − discount + tax, five statuses, stock sync |
| Invoices | Six statuses, branded PDF, print, duplicate, email, mark as paid |
| Payments | Full, partial and multiple payments per invoice; status recalculated automatically |
| Expenses | Eight categories, receipt attachment, spend-by-category breakdown |
| Employees | Add / edit / disable / remove, role assignment, live permission matrix |
| Reports | Sales, P&L, customer, invoice and inventory reports; CSV + PDF export |
| Notifications | Unread badge, notification centre, mark one / all as read, per-type preferences |
| Settings | Business profile, invoice defaults, permissions, notification preferences |
| Audit logs | User, action, entity, timestamp, IP and device for every change |

## Tech

- **Next.js 14** (App Router) + **TypeScript** (strict)
- **Tailwind CSS** with a small hand-rolled component library (`components/ui.tsx`)
- **Recharts** for the revenue chart
- **jsPDF** + **jspdf-autotable** for invoice and report PDFs
- **lucide-react** for icons

### Layout

```
app/
  page.tsx              landing page
  login/ signup/ forgot-password/ reset-password/ onboarding/
  (app)/                authenticated shell — sidebar + topbar
    dashboard/ customers/ products/ orders/ invoices/
    payments/ expenses/ employees/ reports/ audit-logs/ settings/
components/
  ui.tsx                buttons, cards, inputs, modals, tables, menus, toasts
  shell.tsx             sidebar, topbar, global search, notifications, permission gate
  forms.tsx             one form per entity, with validation
  modals.tsx            form + modal wrappers
  line-items.tsx        shared order/invoice line editor
  charts.tsx            revenue chart and sales breakdown
lib/
  types.ts              domain model + role/permission matrix
  seed.ts               deterministic demo workspace
  store.tsx             app state, CRUD, audit logging, notifications
  selectors.ts          derived metrics (totals, balances, KPIs, series)
  export.ts             CSV + report PDF
  invoice-pdf.ts        branded invoice PDF
```

### Design notes

- **Chart colours** use the first two slots of a CVD-validated categorical
  palette (`#2a78d6` revenue, `#eb6834` expenses) — verified for
  colour-vision-deficiency separation against a white surface. Colour is
  assigned to the entity, never to rank, so filtering never repaints a series.
- **Currency** is a single setting. Change it in Settings and every invoice,
  report and KPI follows.
- **Permissions** are checked in three places: the sidebar hides what you can't
  reach, each page wraps itself in `<RequirePermission>`, and financial columns
  are omitted from tables for roles without `view:financials`.

## Demo build notes

This build is deliberately self-contained so it can be opened and demonstrated
anywhere with no backend, database or API keys.

- **Data lives in the browser.** The workspace is seeded deterministically by
  `lib/seed.ts` and persisted to `localStorage`. Every create, edit and delete
  is real and survives a refresh. *Reset demo data* in Settings restores the
  original sample workspace.
- **The demo password is intentionally public.** It is defined in
  `lib/demo-auth.ts` and shown on the sign-in screen. There is no server, no
  password hash and nothing secret to protect. A production deployment replaces
  that file with a real auth provider.
- **Emailing an invoice** opens your mail client with the details pre-filled
  rather than sending through a mail service.

### What production would add

The domain model, permission matrix and module boundaries are already shaped for
a real backend, so the path is mostly mechanical:

1. **PostgreSQL + Prisma** — the entities in `lib/types.ts` map one-to-one to
   tables. Every business record carries a `business_id`.
2. **REST/server actions** — replace the `useStore()` mutations with API calls
   under `/api/customers`, `/api/invoices`, and so on. `lib/selectors.ts` moves
   server-side where the queries belong.
3. **Auth.js** with hashed credentials and email verification, replacing
   `lib/demo-auth.ts`.
4. **Server-side authorisation** on every endpoint: authenticated, correct role,
   and the record's `business_id` matching the session's business. The
   client-side checks in this build are a UX layer, not the security boundary.
5. **S3-compatible storage** for logos and expense receipts.
6. **Transactional email** for invoice delivery and password resets.

---

*BizFlow is a portfolio demonstration product. BuildForgeo and all
customers, invoices and figures in the demo workspace are fictional.*
