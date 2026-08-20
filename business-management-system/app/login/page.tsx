"use client";

import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Avatar, Button, Field, Input } from "@/components/ui";
import { useToast } from "@/components/toast";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-auth";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}

function LoginView() {
  const { employees, signIn, session, ready } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const { error: toastError } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill the owner account when arriving from a "View demo" link.
  useEffect(() => {
    if (!ready) return;
    if (params.get("demo") === "1" && employees[0]) {
      setEmail(employees[0].email);
      setPassword(DEMO_PASSWORD);
    }
  }, [ready, params, employees]);

  useEffect(() => {
    if (ready && session) router.replace("/dashboard");
  }, [ready, session, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Enter your email address";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      next.email = "That doesn't look like a valid email";
    if (!password) next.password = "Enter your password";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    window.setTimeout(() => {
      const emp = employees.find(
        (x) => x.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (!emp || password !== DEMO_PASSWORD) {
        setSubmitting(false);
        setErrors({ password: "Incorrect email or password" });
        toastError(
          "Sign-in failed",
          "Use one of the demo accounts listed on the right.",
        );
        return;
      }
      if (emp.status === "Disabled") {
        setSubmitting(false);
        setErrors({ email: "This account has been disabled" });
        return;
      }
      signIn(emp.id);
      router.push("/dashboard");
    }, 450);
  }

  function quickSignIn(index: number) {
    const emp = employees[index];
    if (!emp) return;
    setSubmitting(true);
    signIn(emp.id);
    window.setTimeout(() => router.push("/dashboard"), 250);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-paper">
              BF
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-slate-900">
              BizFlow
            </span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Sign in to your business workspace.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <Field label="Email address" error={errors.email} required>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  invalid={!!errors.email}
                  placeholder="you@yourbusiness.com"
                  className="pl-9"
                />
              </div>
            </Field>

            <Field label="Password" error={errors.password} required>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  invalid={!!errors.password}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </Field>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[13px] text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Keep me signed in
              </label>
              <Link
                href="/forgot-password"
                className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Create your business
            </Link>
          </p>
        </div>
      </div>

      {/* demo panel */}
      <div className="hidden flex-col justify-center bg-ink-900 px-12 py-12 lg:flex">
        <div className="mx-auto w-full max-w-md">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">
            Demo workspace
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-paper">
            Explore BuildForgeo
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-300">
            A fictional IT services business with a full year of data — 25
            customers, 30 products and services, 50 invoices and a complete
            payment history. Pick a role to see how permissions change what you
            can access.
          </p>

          <div className="mt-8 space-y-3">
            {DEMO_ACCOUNTS.map((acct) => {
              const emp = employees[acct.employeeIndex];
              if (!emp) return null;
              return (
                <button
                  key={acct.label}
                  onClick={() => quickSignIn(acct.employeeIndex)}
                  disabled={submitting}
                  className="flex w-full items-center gap-4 rounded-xl border border-ink-700 bg-ink-800/60 p-4 text-left transition-colors hover:border-brand-500 hover:bg-ink-800 disabled:opacity-60"
                >
                  <Avatar name={emp.name} hue={emp.avatarHue} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-paper">
                      {acct.label}
                    </span>
                    <span className="block truncate text-[13px] text-ink-400">
                      {acct.blurb}
                    </span>
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-ink-500" />
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl border border-ink-700 bg-ink-800/40 p-4">
            <p className="text-[13px] font-medium text-ink-300">
              Or sign in manually
            </p>
            <dl className="mt-2 space-y-1 text-[13px] text-ink-400">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0">Email</dt>
                <dd className="text-ink-300">
                  {employees[0]?.email ?? "rajesh@buildforgeo.in"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0">Password</dt>
                <dd className="text-ink-300">{DEMO_PASSWORD}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
