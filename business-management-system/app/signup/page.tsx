"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { Button, Field, Input, Select } from "@/components/ui";
import { DEMO_PASSWORD } from "@/lib/demo-auth";
import { useStore } from "@/lib/store";

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

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Singapore",
  "Australia",
  "Canada",
  "Germany",
];

const HIGHLIGHTS = [
  "Your workspace is created instantly",
  "Sample customers, products and invoices included",
  "Invite your team and set their permissions",
  "No credit card required",
];

export default function SignupPage() {
  const { addEmployee, updateBusiness, signIn } = useStore();
  const router = useRouter();
  const { success } = useToast();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    businessName: "",
    businessType: INDUSTRIES[0],
    phone: "",
    country: COUNTRIES[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Enter your full name";
    if (!form.email.trim()) e.email = "Enter your email address";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      e.email = "That doesn't look like a valid email";
    if (form.password.length < 8)
      e.password = "Use at least 8 characters";
    if (!form.businessName.trim()) e.businessName = "Enter your business name";
    if (!form.phone.trim()) e.phone = "Enter a contact number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    window.setTimeout(() => {
      const owner = addEmployee({
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        position: "Founder",
        department: "Leadership",
        role: "Owner",
        joiningDate: new Date().toISOString(),
        status: "Active",
        avatarHue: 224,
      });

      updateBusiness({
        name: form.businessName.trim(),
        legalName: form.businessName.trim(),
        industry: form.businessType,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        country: form.country,
        logoInitials: form.businessName
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase())
          .join(""),
      });

      signIn(owner.id);
      success(
        "Workspace created",
        `${form.businessName.trim()} is ready. Let's finish setup.`,
      );
      router.push("/onboarding");
    }, 600);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-lg">
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-paper">
              BF
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-slate-900">
              BizFlow
            </span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Create your business account
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            One workspace for your customers, sales and finances.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.fullName} required>
                <Input
                  value={form.fullName}
                  onChange={(e) => set("fullName")(e.target.value)}
                  invalid={!!errors.fullName}
                  placeholder="Rajesh Menon"
                  autoComplete="name"
                />
              </Field>
              <Field label="Work email" error={errors.email} required>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  invalid={!!errors.email}
                  placeholder="you@yourbusiness.com"
                  autoComplete="email"
                />
              </Field>
            </div>

            <Field
              label="Password"
              error={errors.password}
              hint="At least 8 characters."
              required
            >
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set("password")(e.target.value)}
                invalid={!!errors.password}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name" error={errors.businessName} required>
                <Input
                  value={form.businessName}
                  onChange={(e) => set("businessName")(e.target.value)}
                  invalid={!!errors.businessName}
                  placeholder="BuildForgeo"
                />
              </Field>
              <Field label="Business type" required>
                <Select
                  value={form.businessType}
                  onChange={(e) => set("businessType")(e.target.value)}
                >
                  {INDUSTRIES.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone number" error={errors.phone} required>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                  invalid={!!errors.phone}
                  placeholder="+91 80 4718 2200"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Country" required>
                <Select
                  value={form.country}
                  onChange={(e) => set("country")(e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating workspace…
                </>
              ) : (
                <>
                  Create business account
                  <ArrowRight size={16} />
                </>
              )}
            </Button>

            <p className="text-center text-xs leading-relaxed text-slate-500">
              By creating an account you agree to the BizFlow terms of service
              and privacy policy.
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden flex-col justify-center bg-ink-900 px-12 py-12 lg:flex">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-paper">
            Everything you need on day one
          </h2>
          <ul className="mt-7 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600">
                  <Check size={13} className="text-paper" />
                </span>
                <span className="text-[15px] leading-snug text-ink-300">
                  {h}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-xl border border-ink-700 bg-ink-800/50 p-5">
            <p className="text-[13px] leading-relaxed text-ink-400">
              Just want to look around? Skip the form and open the demo
              workspace with a year of sample data.
            </p>
            <Link
              href="/login?demo=1"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
            >
              View demo
              <ArrowRight size={15} />
            </Link>
            <p className="mt-3 text-xs text-ink-500">
              Demo password: {DEMO_PASSWORD}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
