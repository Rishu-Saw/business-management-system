"use client";

import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 700);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            BF
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-slate-900">
            BizFlow
          </span>
        </Link>

        <div className="card p-7">
          {sent ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <MailCheck size={22} />
              </span>
              <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
                Check your inbox
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                If an account exists for{" "}
                <strong className="text-slate-900">{email}</strong>, we&apos;ve
                sent a link to reset your password. The link expires in 30
                minutes.
              </p>
              <Link href="/reset-password" className="mt-6 block">
                <Button variant="primary" className="w-full">
                  Open the reset link
                </Button>
              </Link>
              <p className="mt-3 text-xs text-slate-500">
                Email isn&apos;t wired up in this demo — the button above takes
                you straight to the reset screen.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                Reset your password
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Enter the email you signed up with and we&apos;ll send you a
                reset link.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                <Field label="Email address" error={error} required>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    invalid={!!error}
                    placeholder="you@yourbusiness.com"
                    autoComplete="email"
                  />
                </Field>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending link…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={15} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
