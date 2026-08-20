"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";

/** Rough strength meter: length plus character-class variety. */
function strengthOf(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const COLORS = [
  "bg-slate-200",
  "bg-rose-500",
  "bg-amber-500",
  "bg-brand-500",
  "bg-emerald-500",
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const score = strengthOf(password);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (password.length < 8) next.password = "Use at least 8 characters";
    if (password !== confirm) next.confirm = "Passwords don't match";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setDone(true);
      window.setTimeout(() => router.push("/login"), 2200);
    }, 700);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-paper">
            BF
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-slate-900">
            BizFlow
          </span>
        </Link>

        <div className="card p-7">
          {done ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={22} />
              </span>
              <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
                Password updated
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Taking you back to sign in…
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                Choose a new password
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Make it something you haven&apos;t used before.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                <Field label="New password" error={errors.password} required>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    invalid={!!errors.password}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </Field>

                {password.length > 0 && (
                  <div>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${
                            i < score ? COLORS[score] : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {LABELS[score]}
                    </p>
                  </div>
                )}

                <Field label="Confirm password" error={errors.confirm} required>
                  <Input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    invalid={!!errors.confirm}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </Field>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
