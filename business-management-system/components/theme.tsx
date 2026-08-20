"use client";

import clsx from "clsx";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export type ThemeChoice = "light" | "dark" | "system";

export const THEME_KEY = "bizflow:theme";

/**
 * Inlined in <head> so the theme is applied before first paint — without it the
 * page flashes light before React mounts. Kept in sync with `applyTheme`.
 */
export const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem("${THEME_KEY}")||"system";var d=c==="dark"||(c==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

function resolve(choice: ThemeChoice) {
  if (choice === "system") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return choice;
}

function applyTheme(choice: ThemeChoice) {
  document.documentElement.classList.toggle("dark", resolve(choice) === "dark");
}

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let stored: ThemeChoice = "system";
    try {
      stored = (localStorage.getItem(THEME_KEY) as ThemeChoice) ?? "system";
    } catch {
      /* private mode — fall back to system */
    }
    setChoice(stored);
    setMounted(true);
  }, []);

  // Follow the OS while the user is on "system".
  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  const setTheme = (next: ThemeChoice) => {
    setChoice(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
  };

  return { choice, setTheme, mounted, resolved: mounted ? resolve(choice) : "light" };
}

const OPTIONS: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

/** Compact single-button toggle that cycles light → dark → system. */
export function ThemeToggle({ className }: { className?: string }) {
  const { choice, setTheme, mounted } = useTheme();

  const index = OPTIONS.findIndex((o) => o.value === choice);
  const current = OPTIONS[index === -1 ? 2 : index];
  const next = OPTIONS[(index + 1) % OPTIONS.length];
  const Icon = current.Icon;

  return (
    <button
      type="button"
      onClick={() => setTheme(next.value)}
      aria-label={`Theme: ${current.label}. Switch to ${next.label}.`}
      title={`Theme: ${current.label}`}
      className={clsx(
        "flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800",
        className,
      )}
    >
      {/* Render nothing until mounted so the icon can't contradict the theme. */}
      {mounted ? <Icon size={18} /> : <span className="h-[18px] w-[18px]" />}
    </button>
  );
}

/** Three-way segmented control, used in Settings. */
export function ThemePicker() {
  const { choice, setTheme, mounted } = useTheme();

  return (
    <div className="flex gap-1.5 rounded-lg bg-slate-100 p-1">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && choice === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={clsx(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
