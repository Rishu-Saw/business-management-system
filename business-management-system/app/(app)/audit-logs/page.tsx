"use client";

import { Download, ScrollText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/components/shell";
import { useToast } from "@/components/toast";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Pagination,
  Select,
  TableShell,
  Td,
  Th,
} from "@/components/ui";
import { downloadCsv } from "@/lib/export";
import { dateTime, relativeTime } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Tone } from "@/components/ui";

const PAGE_SIZE = 15;

const ACTION_TONE: Record<string, Tone> = {
  created: "green",
  updated: "blue",
  deleted: "red",
  recorded: "green",
  duplicated: "violet",
  "signed in": "slate",
  "added note": "blue",
};

export default function AuditLogsPage() {
  return (
    <RequirePermission permission="view:audit">
      <AuditLogsView />
    </RequirePermission>
  );
}

function AuditLogsView() {
  const { auditLogs, employees } = useStore();
  const { success } = useToast();

  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState("All");
  const [actor, setActor] = useState("All");
  const [page, setPage] = useState(1);

  const entities = useMemo(
    () => Array.from(new Set(auditLogs.map((l) => l.entity))).sort(),
    [auditLogs],
  );
  const actors = useMemo(
    () => Array.from(new Set(auditLogs.map((l) => l.actor))).sort(),
    [auditLogs],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return auditLogs
      .filter((l) => (entity === "All" ? true : l.entity === entity))
      .filter((l) => (actor === "All" ? true : l.actor === actor))
      .filter(
        (l) =>
          !q ||
          l.detail.toLowerCase().includes(q) ||
          l.entityRef.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q),
      );
  }, [auditLogs, query, entity, actor]);

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCsv() {
    downloadCsv(
      "audit-logs",
      ["Timestamp", "User", "Action", "Entity", "Reference", "Detail", "IP", "Device"],
      rows.map((l) => [
        new Date(l.createdAt).toISOString(),
        l.actor,
        l.action,
        l.entity,
        l.entityRef,
        l.detail,
        l.ip,
        l.device,
      ]),
    );
    success("Export ready", `${rows.length} log entries exported to CSV.`);
  }

  const hueFor = (name: string) =>
    employees.find((e) => e.name === name)?.avatarHue ?? 210;

  return (
    <>
      <PageHeader
        title="Audit logs"
        subtitle={`${auditLogs.length} recorded actions across the workspace`}
        actions={
          <Button onClick={exportCsv}>
            <Download size={15} />
            Export CSV
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by user, reference or description…"
              className="pl-9"
              aria-label="Search audit logs"
            />
          </div>
          <Select
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              setPage(1);
            }}
            className="w-auto min-w-[140px]"
            aria-label="Filter by entity"
          >
            <option>All</option>
            {entities.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </Select>
          <Select
            value={actor}
            onChange={(e) => {
              setActor(e.target.value);
              setPage(1);
            }}
            className="w-auto min-w-[160px]"
            aria-label="Filter by user"
          >
            <option>All</option>
            {actors.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<ScrollText size={22} />}
            title="No matching activity"
            message="Try a different search term or clear the filters."
            action={
              <Button
                onClick={() => {
                  setQuery("");
                  setEntity("All");
                  setActor("All");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <TableShell>
              <thead>
                <tr>
                  <Th>User</Th>
                  <Th>Action</Th>
                  <Th>Entity</Th>
                  <Th>Description</Th>
                  <Th>When</Th>
                  <Th>Device</Th>
                </tr>
              </thead>
              <tbody>
                {paged.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={log.actor}
                          hue={hueFor(log.actor)}
                          size={30}
                        />
                        <span className="truncate font-medium text-slate-900">
                          {log.actor}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={ACTION_TONE[log.action] ?? "slate"}>
                        {log.action}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="text-slate-700">{log.entity}</span>
                      <span className="block text-xs text-slate-500">
                        {log.entityRef}
                      </span>
                    </Td>
                    <Td className="max-w-[320px]">
                      <span className="block truncate text-slate-700">
                        {log.detail}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span className="block text-slate-700">
                        {relativeTime(log.createdAt)}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {dateTime(log.createdAt)}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span className="block text-slate-600">{log.device}</span>
                      <span className="block text-xs text-slate-400">
                        {log.ip}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>

            <div className="border-t border-slate-200">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={rows.length}
                onPage={setPage}
              />
            </div>
          </>
        )}
      </Card>
    </>
  );
}
