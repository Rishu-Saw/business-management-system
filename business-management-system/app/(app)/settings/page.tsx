"use client";

import { Bell, Building2, FileText, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { RequirePermission } from "@/components/shell";
import { ThemePicker } from "@/components/theme";
import { useToast } from "@/components/toast";
import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  Field,
  Input,
  PageHeader,
  Select,
  StatusBadge,
  TableShell,
  Td,
  Textarea,
  Th,
  Toggle,
} from "@/components/ui";
import { CURRENCY_SYMBOL } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  ROLE_PERMISSIONS,
  type CurrencyCode,
  type NotificationSettings,
  type Role,
} from "@/lib/types";

type Tab = "business" | "invoice" | "permissions" | "notifications";

const TABS: [Tab, string, typeof Building2][] = [
  ["business", "Business profile", Building2],
  ["invoice", "Invoice settings", FileText],
  ["permissions", "User permissions", ShieldCheck],
  ["notifications", "Notifications", Bell],
];

const CURRENCIES: CurrencyCode[] = ["INR", "USD", "EUR", "GBP"];
const ROLES: Role[] = ["Owner", "Admin", "Manager", "Employee"];

export default function SettingsPage() {
  return (
    <RequirePermission permission="manage:settings">
      <SettingsView />
    </RequirePermission>
  );
}

function SettingsView() {
  const {
    business,
    invoiceSettings,
    notificationSettings,
    employees,
    updateBusiness,
    updateInvoiceSettings,
    updateNotificationSettings,
    updateEmployee,
    resetDemoData,
    session,
  } = useStore();
  const { success } = useToast();

  const [tab, setTab] = useState<Tab>("business");
  const [confirmReset, setConfirmReset] = useState(false);

  const [profile, setProfile] = useState(business);
  const [invoiceForm, setInvoiceForm] = useState(invoiceSettings);

  useEffect(() => setProfile(business), [business]);
  useEffect(() => setInvoiceForm(invoiceSettings), [invoiceSettings]);

  return (
    <>
      <PageHeader
        title="Business settings"
        subtitle="Configure your business profile, invoicing defaults and team access."
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1.5 overflow-x-auto scrollbar-thin lg:flex-col lg:overflow-visible">
          {TABS.map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors ${
                tab === key
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon
                size={17}
                className={tab === key ? "text-brand-600" : "text-slate-400"}
              />
              {label}
            </button>
          ))}
        </nav>

        <div className="space-y-6">
          {tab === "business" && (
            <Card>
              <CardHeader
                title="Business profile"
                subtitle="Appears on every invoice you send."
              />
              <div className="space-y-4 p-5">
                <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-paper">
                    {profile.logoInitials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">Logo</p>
                    <p className="mt-0.5 text-[13px] text-slate-500">
                      Two initials shown in the sidebar and on invoices.
                    </p>
                  </div>
                  <Input
                    value={profile.logoInitials}
                    maxLength={2}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        logoInitials: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-20 text-center"
                    aria-label="Logo initials"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Business name" required>
                    <Input
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Legal name">
                    <Input
                      value={profile.legalName}
                      onChange={(e) =>
                        setProfile({ ...profile, legalName: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Industry">
                    <Input
                      value={profile.industry}
                      onChange={(e) =>
                        setProfile({ ...profile, industry: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Tax ID / GSTIN">
                    <Input
                      value={profile.taxId}
                      onChange={(e) =>
                        setProfile({ ...profile, taxId: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Billing email">
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Phone">
                    <Input
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <Field label="Website">
                  <Input
                    value={profile.website}
                    onChange={(e) =>
                      setProfile({ ...profile, website: e.target.value })
                    }
                  />
                </Field>

                <Field label="Address">
                  <Input
                    value={profile.addressLine}
                    onChange={(e) =>
                      setProfile({ ...profile, addressLine: e.target.value })
                    }
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-4">
                  <Field label="City">
                    <Input
                      value={profile.city}
                      onChange={(e) =>
                        setProfile({ ...profile, city: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="State">
                    <Input
                      value={profile.state}
                      onChange={(e) =>
                        setProfile({ ...profile, state: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Postal code">
                    <Input
                      value={profile.postalCode}
                      onChange={(e) =>
                        setProfile({ ...profile, postalCode: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Country">
                    <Input
                      value={profile.country}
                      onChange={(e) =>
                        setProfile({ ...profile, country: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <Field
                  label="Currency"
                  hint="Applies to invoices, payments, expenses and every report."
                >
                  <Select
                    value={profile.currency}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        currency: e.target.value as CurrencyCode,
                      })
                    }
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {CURRENCY_SYMBOL[c]} — {c}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3">
                <Button onClick={() => setProfile(business)}>Reset</Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    updateBusiness(profile);
                    success("Settings saved", "Your business profile is updated.");
                  }}
                >
                  <Save size={15} />
                  Save changes
                </Button>
              </div>
            </Card>
          )}

          {tab === "invoice" && (
            <Card>
              <CardHeader
                title="Invoice settings"
                subtitle="Defaults applied to every new invoice."
              />
              <div className="space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Invoice prefix" hint="e.g. INV-">
                    <Input
                      value={invoiceForm.prefix}
                      onChange={(e) =>
                        setInvoiceForm({ ...invoiceForm, prefix: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Next invoice number">
                    <Input
                      type="number"
                      min={1}
                      value={invoiceForm.nextNumber}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          nextNumber: Number(e.target.value) || 1,
                        })
                      }
                    />
                  </Field>
                  <Field label="Default tax rate (%)">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={invoiceForm.defaultTaxRate}
                      onChange={(e) =>
                        setInvoiceForm({
                          ...invoiceForm,
                          defaultTaxRate: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="rounded-lg bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
                  Your next invoice will be numbered{" "}
                  <strong className="text-slate-900">
                    {invoiceForm.prefix}
                    {String(invoiceForm.nextNumber).padStart(5, "0")}
                  </strong>
                  .
                </div>

                <Field
                  label="Payment terms (days)"
                  hint="Due date is set this many days after the invoice date."
                >
                  <Input
                    type="number"
                    min={0}
                    value={invoiceForm.paymentTermsDays}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        paymentTermsDays: Number(e.target.value) || 0,
                      })
                    }
                  />
                </Field>

                <Field label="Payment instructions">
                  <Textarea
                    value={invoiceForm.paymentInstructions}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        paymentInstructions: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field
                  label="Footer message"
                  hint="Shown under the totals when an invoice has no notes."
                >
                  <Textarea
                    value={invoiceForm.footerMessage}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        footerMessage: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3">
                <Button onClick={() => setInvoiceForm(invoiceSettings)}>
                  Reset
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    updateInvoiceSettings(invoiceForm);
                    success("Settings saved", "Invoice defaults updated.");
                  }}
                >
                  <Save size={15} />
                  Save changes
                </Button>
              </div>
            </Card>
          )}

          {tab === "permissions" && (
            <>
              <Card>
                <CardHeader
                  title="Team roles"
                  subtitle="Change a role to change what that person can access."
                />
                <TableShell>
                  <thead>
                    <tr>
                      <Th>Employee</Th>
                      <Th>Department</Th>
                      <Th>Role</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <Td>
                          <span className="font-medium text-slate-900">
                            {emp.name}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {emp.email}
                          </span>
                        </Td>
                        <Td className="text-slate-600">{emp.department}</Td>
                        <Td>
                          <Select
                            value={emp.role}
                            disabled={session?.employeeId === emp.id}
                            onChange={(e) => {
                              updateEmployee(emp.id, {
                                role: e.target.value as Role,
                              });
                              success(
                                "Role updated",
                                `${emp.name} is now ${e.target.value}.`,
                              );
                            }}
                            className="h-8 w-auto min-w-[120px] py-0 text-[13px]"
                            aria-label={`Role for ${emp.name}`}
                          >
                            {ROLES.map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </Select>
                        </Td>
                        <Td>
                          <StatusBadge status={emp.status} />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableShell>
              </Card>

              <Card>
                <CardHeader
                  title="Permission matrix"
                  subtitle="Each page checks these permissions before it renders."
                />
                <TableShell>
                  <thead>
                    <tr>
                      <Th>Permission</Th>
                      {ROLES.map((r) => (
                        <Th key={r} className="text-center">
                          {r}
                        </Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROLE_PERMISSIONS.Owner.map((perm) => (
                      <tr key={perm} className="hover:bg-slate-50">
                        <Td>
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px] text-slate-700">
                            {perm}
                          </code>
                        </Td>
                        {ROLES.map((r) => (
                          <Td key={r} className="text-center">
                            {ROLE_PERMISSIONS[r].includes(perm) ? (
                              <span className="text-emerald-600">✓</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </Td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </TableShell>
              </Card>
            </>
          )}

          {tab === "notifications" && (
            <Card>
              <CardHeader
                title="Notification preferences"
                subtitle="Choose which events appear in your notification centre."
              />
              <div className="divide-y divide-slate-100 px-5">
                {(
                  [
                    ["newOrder", "New order", "When someone on your team creates an order."],
                    ["paymentReceived", "Payment received", "When a payment is recorded against an invoice."],
                    ["invoiceOverdue", "Invoice overdue", "When an invoice passes its due date unpaid."],
                    ["lowInventory", "Low inventory", "When a product hits its minimum stock level."],
                    ["newCustomer", "New customer", "When a customer is added to the CRM."],
                    ["employeeActivity", "Employee activity", "Daily summary of what your team did."],
                  ] as [keyof NotificationSettings, string, string][]
                ).map(([key, label, description]) => (
                  <Toggle
                    key={key}
                    checked={notificationSettings[key]}
                    onChange={(v) => {
                      updateNotificationSettings({ [key]: v });
                      success(
                        v ? "Notifications on" : "Notifications off",
                        `${label} notifications ${v ? "enabled" : "disabled"}.`,
                      );
                    }}
                    label={label}
                    description={description}
                  />
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Appearance"
              subtitle="Choose a theme, or follow your operating system."
            />
            <div className="p-5">
              <ThemePicker />
            </div>
          </Card>

          {/* demo controls */}
          <Card className="border-amber-200 bg-amber-50/40">
            <div className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-slate-900">
                  Demo workspace
                </p>
                <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-600">
                  This workspace stores its data in your browser. Resetting
                  restores the original BuildForgeo sample data — 25
                  customers, 30 products and services, 50 invoices and a year of
                  payment history. Anything you&apos;ve added will be discarded.
                </p>
              </div>
              <Button onClick={() => setConfirmReset(true)}>
                <RotateCcw size={15} />
                Reset demo data
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data"
        message="This restores the original sample workspace and discards every change you've made. Continue?"
        confirmLabel="Reset workspace"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
          setConfirmReset(false);
          success("Workspace reset", "The original demo data has been restored.");
        }}
      />
    </>
  );
}
