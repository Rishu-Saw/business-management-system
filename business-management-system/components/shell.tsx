"use client";

import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChevronDown,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Package,
  Receipt,
  ScrollText,
  Search,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { relativeTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Permission } from "@/lib/types";
import { Avatar, Badge, Button } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "view:dashboard" },
  { href: "/customers", label: "Customers", icon: Users, permission: "manage:customers" },
  { href: "/products", label: "Products", icon: Package, permission: "manage:orders" },
  { href: "/orders", label: "Orders", icon: ShoppingCart, permission: "manage:orders" },
  { href: "/invoices", label: "Invoices", icon: FileText, permission: "manage:invoices" },
  { href: "/payments", label: "Payments", icon: CreditCard, permission: "manage:payments" },
  { href: "/expenses", label: "Expenses", icon: Receipt, permission: "manage:expenses" },
  { href: "/employees", label: "Employees", icon: UsersRound, permission: "manage:employees" },
  { href: "/reports", label: "Reports", icon: TrendingUp, permission: "view:reports" },
  { href: "/audit-logs", label: "Audit logs", icon: ScrollText, permission: "view:audit" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "manage:settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { business, session, ready, can } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [ready, session, router]);

  useEffect(() => setMobileOpen(false), [pathname]);

  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
          Loading workspace…
        </div>
      </div>
    );
  }

  const visible = NAV.filter((n) => can(n.permission));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar — fixed on desktop, drawer on mobile */}
      <aside
        className={clsx(
          "no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              {business.logoInitials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold leading-tight text-slate-900">
                {business.name}
              </span>
              <span className="block text-[11px] uppercase tracking-wide text-slate-400">
                BizFlow
              </span>
            </span>
          </Link>
          <button
            className="lg:hidden text-slate-400 hover:text-slate-700"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4 scrollbar-thin">
          {visible.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon size={18} className={active ? "text-brand-600" : "text-slate-400"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[13px] font-medium text-slate-800">Demo workspace</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-500">
              Data is seeded locally. Reset it any time from Settings.
            </p>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="lg:pl-64">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { session, signOut, customers, invoices, items } = useStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: { label: string; sub: string; href: string }[] = [];
    for (const c of customers) {
      if (
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      )
        out.push({ label: c.name, sub: c.company, href: `/customers/${c.id}` });
      if (out.length > 12) break;
    }
    for (const i of invoices) {
      if (out.length > 12) break;
      if (i.number.toLowerCase().includes(q))
        out.push({ label: i.number, sub: "Invoice", href: `/invoices/${i.id}` });
    }
    for (const it of items) {
      if (out.length > 12) break;
      if (it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q))
        out.push({ label: it.name, sub: it.sku, href: "/products" });
    }
    return out.slice(0, 8);
  }, [query, customers, invoices, items]);

  return (
    <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        className="lg:hidden text-slate-500 hover:text-slate-800"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <MenuIcon size={20} />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 150)}
          placeholder="Search customers, invoices, products…"
          className="input-base pl-9"
          aria-label="Global search"
        />
        {focused && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-pop">
            {results.map((r) => (
              <button
                key={r.href + r.label}
                onMouseDown={() => {
                  router.push(r.href);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="truncate text-[13px] font-medium text-slate-800">
                  {r.label}
                </span>
                <span className="shrink-0 text-xs text-slate-400">{r.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <NotificationBell />
        <UserMenu session={session!} onSignOut={() => { signOut(); router.push("/login"); }} />
      </div>
    </header>
  );
}

function NotificationBell() {
  const { notifications, markNotificationRead, markAllNotificationsRead } =
    useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              {unread > 0 && <Badge tone="red">{unread} new</Badge>}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-[13px] font-medium text-brand-600 hover:text-brand-700"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">
                You&apos;re all caught up.
              </p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    markNotificationRead(n.id);
                    setOpen(false);
                    router.push(n.href);
                  }}
                  className={clsx(
                    "flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                    !n.read && "bg-brand-50/40",
                  )}
                >
                  <span
                    className={clsx(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-brand-500",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-slate-900">
                      {n.title}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-slate-500">
                      {n.body}
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {relativeTime(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({
  session,
  onSignOut,
}: {
  session: { name: string; email: string; role: string };
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-slate-100"
      >
        <Avatar name={session.name} hue={224} size={32} />
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] font-medium leading-tight text-slate-800">
            {session.name}
          </span>
          <span className="block text-[11px] text-slate-500">{session.role}</span>
        </span>
        <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">{session.name}</p>
            <p className="truncate text-[13px] text-slate-500">{session.email}</p>
            <Badge tone="blue" className="mt-2">
              {session.role}
            </Badge>
          </div>
          <div className="p-1.5">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
            >
              <Settings size={15} className="text-slate-400" />
              Business settings
            </Link>
            <button
              onClick={onSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-rose-600 hover:bg-rose-50"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Blocks a page when the signed-in role lacks the required permission. */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: React.ReactNode;
}) {
  const { can, ready } = useStore();
  if (!ready) return null;
  if (can(permission)) return <>{children}</>;
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="text-xl font-semibold text-slate-900">
        You don&apos;t have access to this page
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Your role doesn&apos;t include the{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px]">
          {permission}
        </code>{" "}
        permission. Ask an owner or admin to grant it.
      </p>
      <Button variant="primary" className="mt-6" onClick={() => history.back()}>
        Go back
      </Button>
    </div>
  );
}
