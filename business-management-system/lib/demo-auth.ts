/**
 * Demo-only credentials.
 *
 * This build ships a self-contained sales demo: the workspace lives in the
 * browser, so there is no server, no password hash and nothing secret to
 * protect. The password below is shown on the sign-in screen on purpose.
 * A production deployment would replace this file with a real auth provider
 * (Auth.js + hashed credentials) and never ship a shared password.
 */
export const DEMO_PASSWORD = "demo1234";

export const DEMO_ACCOUNTS = [
  {
    employeeIndex: 0,
    label: "Business Owner",
    blurb: "Full access — revenue, expenses, team and settings",
  },
  {
    employeeIndex: 2,
    label: "Sales Manager",
    blurb: "Customers, products, orders, invoices and reports",
  },
  {
    employeeIndex: 6,
    label: "Employee",
    blurb: "Assigned customers and orders only",
  },
] as const;
