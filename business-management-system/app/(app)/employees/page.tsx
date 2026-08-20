"use client";

import {
  Ban,
  CheckCircle2,
  Download,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EmployeeFormModal } from "@/components/modals";
import { RequirePermission } from "@/components/shell";
import { useToast } from "@/components/toast";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
  Menu,
  MenuItem,
  PageHeader,
  Select,
  StatusBadge,
  TableShell,
  Td,
  Th,
} from "@/components/ui";
import { downloadCsv } from "@/lib/export";
import { relativeTime, shortDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { ROLE_PERMISSIONS, type Employee, type Role } from "@/lib/types";

const ROLES: Role[] = ["Owner", "Admin", "Manager", "Employee"];

const ROLE_SUMMARY: Record<Role, string> = {
  Owner: "Full access to every module, including financials and settings.",
  Admin: "Same access as the owner, for a trusted second-in-command.",
  Manager: "Customers, products, orders, invoices, payments and reports.",
  Employee: "Assigned customers and orders only — no financial visibility.",
};

export default function EmployeesPage() {
  return (
    <RequirePermission permission="manage:employees">
      <EmployeesView />
    </RequirePermission>
  );
}

function EmployeesView() {
  const {
    employees,
    customers,
    orders,
    invoices,
    auditLogs,
    session,
    updateEmployee,
    deleteEmployee,
  } = useStore();
  const { success, error } = useToast();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | undefined>();
  const [toDelete, setToDelete] = useState<Employee | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees
      .filter((e) => (role === "All" ? true : e.role === role))
      .filter(
        (e) =>
          !q ||
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q),
      );
  }, [employees, query, role]);

  const activityFor = (emp: Employee) => {
    const ownedCustomers = customers.filter(
      (c) => c.ownerEmployeeId === emp.id,
    ).length;
    const createdOrders = orders.filter((o) => o.createdBy === emp.name).length;
    const createdInvoices = invoices.filter(
      (i) => i.createdBy === emp.name,
    ).length;
    const lastLog = auditLogs.find((l) => l.actor === emp.name);
    return { ownedCustomers, createdOrders, createdInvoices, lastLog };
  };

  function exportCsv() {
    downloadCsv(
      "employees",
      ["Name", "Email", "Phone", "Position", "Department", "Role", "Joining date", "Status"],
      rows.map((e) => [
        e.name,
        e.email,
        e.phone,
        e.position,
        e.department,
        e.role,
        new Date(e.joiningDate).toISOString().slice(0, 10),
        e.status,
      ]),
    );
    success("Export ready", `${rows.length} employees exported to CSV.`);
  }

  const roleCounts = ROLES.map((r) => ({
    role: r,
    count: employees.filter((e) => e.role === r).length,
  }));

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={`${employees.filter((e) => e.status === "Active").length} active of ${employees.length} team members`}
        actions={
          <>
            <Button onClick={exportCsv}>
              <Download size={15} />
              Export CSV
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              <Plus size={15} />
              Add employee
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {roleCounts.map(({ role: r, count }) => (
          <Card key={r} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StatusBadge status={r} />
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {count}
                </p>
                <p className="mt-1 text-xs leading-snug text-slate-500">
                  {ROLE_SUMMARY[r]}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, position or department…"
              className="pl-9"
              aria-label="Search employees"
            />
          </div>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-auto min-w-[140px]"
            aria-label="Filter by role"
          >
            <option>All</option>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<UsersRound size={22} />}
            title="No matching employees"
            message="Try a different search term or clear the role filter."
            action={
              <Button
                onClick={() => {
                  setQuery("");
                  setRole("All");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Employee</Th>
                <Th>Contact</Th>
                <Th>Department</Th>
                <Th>Role</Th>
                <Th>Activity</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
                <Th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {rows.map((emp) => {
                const activity = activityFor(emp);
                const isSelf = session?.employeeId === emp.id;
                return (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.name} hue={emp.avatarHue} size={36} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate font-medium text-slate-900">
                            {emp.name}
                            {isSelf && <Badge tone="blue">You</Badge>}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {emp.position}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <a
                        href={`mailto:${emp.email}`}
                        className="flex items-center gap-1.5 truncate text-slate-700 hover:text-brand-600"
                      >
                        <Mail size={13} className="shrink-0 text-slate-400" />
                        {emp.email}
                      </a>
                      {emp.phone && (
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone size={12} className="shrink-0" />
                          {emp.phone}
                        </span>
                      )}
                    </Td>
                    <Td className="text-slate-600">{emp.department}</Td>
                    <Td>
                      <Select
                        value={emp.role}
                        disabled={isSelf}
                        onChange={(e) => {
                          updateEmployee(emp.id, { role: e.target.value as Role });
                          success(
                            "Role updated",
                            `${emp.name} is now ${e.target.value}.`,
                          );
                        }}
                        className="h-8 w-auto min-w-[115px] py-0 text-[13px]"
                        aria-label={`Role for ${emp.name}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </Select>
                    </Td>
                    <Td>
                      <p className="text-[13px] text-slate-700">
                        {activity.createdInvoices} invoices ·{" "}
                        {activity.createdOrders} orders
                      </p>
                      <p className="text-xs text-slate-500">
                        {activity.lastLog
                          ? `Active ${relativeTime(activity.lastLog.createdAt)}`
                          : `${activity.ownedCustomers} customers assigned`}
                      </p>
                    </Td>
                    <Td className="whitespace-nowrap text-slate-500">
                      {shortDate(emp.joiningDate)}
                    </Td>
                    <Td>
                      <StatusBadge status={emp.status} />
                    </Td>
                    <Td>
                      <Menu
                        trigger={({ onClick }) => (
                          <IconButton label="Employee actions" onClick={onClick}>
                            <MoreHorizontal size={17} />
                          </IconButton>
                        )}
                      >
                        {(close) => (
                          <>
                            <MenuItem
                              onClick={() => {
                                close();
                                setEditing(emp);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil size={15} className="text-slate-400" />
                              Edit
                            </MenuItem>
                            <MenuItem
                              disabled={isSelf}
                              onClick={() => {
                                close();
                                const next =
                                  emp.status === "Active" ? "Disabled" : "Active";
                                updateEmployee(emp.id, { status: next });
                                success(
                                  next === "Active"
                                    ? "Employee enabled"
                                    : "Employee disabled",
                                  `${emp.name} is now ${next.toLowerCase()}.`,
                                );
                              }}
                            >
                              {emp.status === "Active" ? (
                                <>
                                  <Ban size={15} className="text-slate-400" />
                                  Disable access
                                </>
                              ) : (
                                <>
                                  <CheckCircle2
                                    size={15}
                                    className="text-slate-400"
                                  />
                                  Enable access
                                </>
                              )}
                            </MenuItem>
                            <MenuItem
                              danger
                              disabled={isSelf}
                              onClick={() => {
                                close();
                                if (isSelf) {
                                  error(
                                    "Not allowed",
                                    "You can't remove your own account.",
                                  );
                                  return;
                                }
                                setToDelete(emp);
                              }}
                            >
                              <Trash2 size={15} />
                              Remove
                            </MenuItem>
                          </>
                        )}
                      </Menu>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
      </Card>

      {/* permission matrix */}
      <Card className="mt-6">
        <CardHeader
          title="Role permissions"
          subtitle="What each role can access. Checks are enforced on every page, not just in the menu."
          action={
            <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-500">
              <ShieldCheck size={15} className="text-emerald-600" />
              Enforced server-side in production
            </span>
          }
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
                      <CheckCircle2
                        size={16}
                        className="mx-auto text-emerald-600"
                      />
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

      <EmployeeFormModal
        open={formOpen}
        employee={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Remove employee"
        message={`Remove ${toDelete?.name} from the workspace? They will lose access immediately. Records they created stay in your history.`}
        confirmLabel="Remove"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteEmployee(toDelete.id);
            success("Employee removed", `${toDelete.name} no longer has access.`);
          }
          setToDelete(null);
        }}
      />
    </>
  );
}
