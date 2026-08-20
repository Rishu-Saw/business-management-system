"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Coins,
  Rocket,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { CURRENCY_SYMBOL } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { CurrencyCode } from "@/lib/types";

const STEPS = [
  { title: "Business", icon: Building2, blurb: "Tell us about your business" },
  { title: "Currency", icon: Coins, blurb: "How you bill your customers" },
  { title: "Setup", icon: Rocket, blurb: "Add your first records" },
];

const INDUSTRIES = [
  "IT Services & Hardware",
  "Retail & E-commerce",
  "Manufacturing",
  "Professional Services",
  "Healthcare",
  "Hospitality",
  "Construction",
  "Education",
  "Logistics",
  "Other",
];

const CURRENCIES: { code: CurrencyCode; name: string; region: string }[] = [
  { code: "INR", name: "Indian Rupee", region: "India" },
  { code: "USD", name: "US Dollar", region: "United States" },
  { code: "EUR", name: "Euro", region: "Eurozone" },
  { code: "GBP", name: "British Pound", region: "United Kingdom" },
];

export default function OnboardingPage() {
  const {
    business,
    invoiceSettings,
    session,
    ready,
    updateBusiness,
    updateInvoiceSettings,
    addItem,
    addEmployee,
    addCustomer,
  } = useStore();
  const router = useRouter();
  const { success } = useToast();

  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: "",
    industry: INDUSTRIES[0],
    phone: "",
    email: "",
    addressLine: "",
    city: "",
    website: "",
    logoInitials: "",
  });
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [product, setProduct] = useState({ name: "", price: "" });
  const [employee, setEmployee] = useState({ name: "", email: "" });
  const [customerBulk, setCustomerBulk] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("");
  const [defaultTax, setDefaultTax] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    setProfile({
      name: business.name,
      industry: business.industry,
      phone: business.phone,
      email: business.email,
      addressLine: business.addressLine,
      city: business.city,
      website: business.website,
      logoInitials: business.logoInitials,
    });
    setCurrency(business.currency);
    setInvoicePrefix(invoiceSettings.prefix);
    setDefaultTax(String(invoiceSettings.defaultTaxRate));
  }, [ready, session, business, invoiceSettings, router]);

  if (!ready || !session) return null;

  function next() {
    if (step === 0) {
      const e: Record<string, string> = {};
      if (!profile.name.trim()) e.name = "Enter your business name";
      if (profile.email && !/^\S+@\S+\.\S+$/.test(profile.email))
        e.email = "Enter a valid email";
      setErrors(e);
      if (Object.keys(e).length) return;
      updateBusiness({
        name: profile.name.trim(),
        industry: profile.industry,
        phone: profile.phone,
        email: profile.email,
        addressLine: profile.addressLine,
        city: profile.city,
        website: profile.website,
        logoInitials:
          profile.logoInitials.trim().slice(0, 2).toUpperCase() ||
          profile.name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join(""),
      });
    }
    if (step === 1) updateBusiness({ currency });
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function finish() {
    let created = 0;

    if (product.name.trim() && Number(product.price) > 0) {
      addItem({
        kind: "Product",
        name: product.name.trim(),
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        description: "",
        category: "General",
        price: Number(product.price),
        costPrice: Math.round(Number(product.price) * 0.6),
        taxRate: Number(defaultTax) || 0,
        stock: 0,
        minStock: 5,
        durationMinutes: null,
        status: "Active",
        imageHue: 210,
      });
      created++;
    }

    if (employee.name.trim() && /^\S+@\S+\.\S+$/.test(employee.email)) {
      addEmployee({
        name: employee.name.trim(),
        email: employee.email.trim().toLowerCase(),
        phone: "",
        position: "Team member",
        department: "Operations",
        role: "Employee",
        joiningDate: new Date().toISOString(),
        status: "Active",
        avatarHue: 160,
      });
      created++;
    }

    // "Import customers" accepts pasted rows: Name, Company, Email
    for (const row of customerBulk.split("\n")) {
      const parts = row.split(",").map((p) => p.trim());
      if (!parts[0]) continue;
      addCustomer({
        name: parts[0],
        company: parts[1] ?? "",
        email: parts[2] ?? "",
        phone: "",
        addressLine: "",
        city: "",
        state: "",
        postalCode: "",
        country: business.country,
        status: "Active",
        tags: [],
        ownerEmployeeId: session!.employeeId,
        notes: [],
        createdAt: new Date().toISOString(),
      });
      created++;
    }

    updateInvoiceSettings({
      prefix: invoicePrefix.trim() || "INV-",
      defaultTaxRate: Number(defaultTax) || 0,
    });

    success(
      "Setup complete",
      created > 0
        ? `${created} record${created === 1 ? "" : "s"} added. Welcome to BizFlow.`
        : "Your workspace is ready.",
    );
    router.push("/dashboard");
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-paper">
            BF
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-slate-900">
            BizFlow
          </span>
        </div>

        {/* progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const state = i < step ? "done" : i === step ? "current" : "todo";
              return (
                <div key={s.title} className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      state === "done"
                        ? "border-brand-600 bg-brand-600 text-paper"
                        : state === "current"
                          ? "border-brand-600 bg-white text-brand-600"
                          : "border-slate-200 bg-white text-slate-300"
                    }`}
                  >
                    {state === "done" ? <Check size={18} /> : <Icon size={18} />}
                  </span>
                  <span className="hidden sm:block">
                    <span
                      className={`block text-[13px] font-medium ${
                        state === "todo" ? "text-slate-400" : "text-slate-900"
                      }`}
                    >
                      Step {i + 1}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {s.title}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="card p-7">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {STEPS[step].blurb}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Step {step + 1} of {STEPS.length} · You can change all of this later
            in Settings.
          </p>

          <div className="mt-7">
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Business name" error={errors.name} required>
                    <Input
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      invalid={!!errors.name}
                    />
                  </Field>
                  <Field
                    label="Logo initials"
                    hint="Shown in the sidebar and on invoices."
                  >
                    <Input
                      maxLength={2}
                      value={profile.logoInitials}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          logoInitials: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="BF"
                    />
                  </Field>
                </div>

                <Field label="Industry">
                  <Select
                    value={profile.industry}
                    onChange={(e) =>
                      setProfile({ ...profile, industry: e.target.value })
                    }
                  >
                    {INDUSTRIES.map((i) => (
                      <option key={i}>{i}</option>
                    ))}
                  </Select>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone">
                    <Input
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Billing email" error={errors.email}>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      invalid={!!errors.email}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Address">
                    <Input
                      value={profile.addressLine}
                      onChange={(e) =>
                        setProfile({ ...profile, addressLine: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="City">
                    <Input
                      value={profile.city}
                      onChange={(e) =>
                        setProfile({ ...profile, city: e.target.value })
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
                    placeholder="www.yourbusiness.com"
                  />
                </Field>
              </div>
            )}

            {step === 1 && (
              <div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCurrency(c.code)}
                      className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                        currency === c.code
                          ? "border-brand-600 bg-brand-50/60 ring-1 ring-brand-600"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-lg text-lg font-semibold ${
                          currency === c.code
                            ? "bg-brand-600 text-paper"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {CURRENCY_SYMBOL[c.code]}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-900">
                          {c.code} — {c.name}
                        </span>
                        <span className="block text-[13px] text-slate-500">
                          {c.region}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-[13px] leading-relaxed text-slate-600">
                  Every amount across invoices, payments, expenses and reports
                  will be shown in {currency}. Need something else? Choose the
                  closest option now and change it in Settings later.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <section>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Add your first product or service
                  </h2>
                  <div className="mt-3 grid gap-4 sm:grid-cols-[2fr_1fr]">
                    <Field label="Name">
                      <Input
                        value={product.name}
                        onChange={(e) =>
                          setProduct({ ...product, name: e.target.value })
                        }
                        placeholder="Managed IT Support — Monthly"
                      />
                    </Field>
                    <Field label={`Price (${CURRENCY_SYMBOL[currency]})`}>
                      <Input
                        type="number"
                        min={0}
                        value={product.price}
                        onChange={(e) =>
                          setProduct({ ...product, price: e.target.value })
                        }
                        placeholder="68000"
                      />
                    </Field>
                  </div>
                </section>

                <section className="border-t border-slate-200 pt-6">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Invite your first employee
                  </h2>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <Field label="Name">
                      <Input
                        value={employee.name}
                        onChange={(e) =>
                          setEmployee({ ...employee, name: e.target.value })
                        }
                        placeholder="Ritu Agarwal"
                      />
                    </Field>
                    <Field label="Work email">
                      <Input
                        type="email"
                        value={employee.email}
                        onChange={(e) =>
                          setEmployee({ ...employee, email: e.target.value })
                        }
                        placeholder="ritu@yourbusiness.com"
                      />
                    </Field>
                  </div>
                </section>

                <section className="border-t border-slate-200 pt-6">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Import customers
                  </h2>
                  <Field
                    label="Paste one customer per line"
                    hint="Format: Name, Company, Email"
                    className="mt-3"
                  >
                    <Textarea
                      value={customerBulk}
                      onChange={(e) => setCustomerBulk(e.target.value)}
                      placeholder={
                        "Priya Iyer, Lumen Analytics, priya@lumen.com\nRohan Mehta, Orbit Logistics, rohan@orbit.com"
                      }
                    />
                  </Field>
                </section>

                <section className="border-t border-slate-200 pt-6">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Invoice settings
                  </h2>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <Field label="Invoice prefix">
                      <Input
                        value={invoicePrefix}
                        onChange={(e) => setInvoicePrefix(e.target.value)}
                        placeholder="INV-"
                      />
                    </Field>
                    <Field label="Default tax rate (%)">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={defaultTax}
                        onChange={(e) => setDefaultTax(e.target.value)}
                      />
                    </Field>
                  </div>
                </section>

                <p className="flex items-start gap-2 rounded-lg bg-brand-50 px-4 py-3 text-[13px] leading-relaxed text-brand-800">
                  <Sparkles size={16} className="mt-0.5 shrink-0" />
                  Every field here is optional — skip anything you&apos;d rather
                  do later. Your workspace already has sample data so the
                  dashboard has something to show.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
            <Button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft size={16} />
              Back
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                Skip for now
              </Button>
              {step < STEPS.length - 1 ? (
                <Button variant="primary" onClick={next}>
                  Continue
                  <ArrowRight size={16} />
                </Button>
              ) : (
                <Button variant="primary" onClick={finish}>
                  Finish setup
                  <Check size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
