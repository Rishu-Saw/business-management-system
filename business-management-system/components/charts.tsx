"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money, moneyCompact } from "@/lib/format";
import type { SalesSlice, SeriesPoint } from "@/lib/selectors";
import type { CurrencyCode } from "@/lib/types";

/**
 * Chart palette — categorical slots 1 and 2 of the validated reference palette.
 * Verified on a #ffffff surface: worst-pair CVD ΔE 9.2, normal-vision ΔE 24.0.
 * Slots are assigned to entities (revenue, expenses) and never reordered.
 */
export const SERIES = {
  revenue: "#2a78d6",
  expenses: "#eb6834",
} as const;

const INK = {
  muted: "#898781",
  grid: "#e2e8f0",
  axis: "#cbd5e1",
};

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  currency: CurrencyCode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-pop">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1.5 space-y-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-3 text-[13px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-slate-600">{p.name}</span>
            <span className="ml-auto tnum font-medium text-slate-900">
              {money(p.value, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Revenue vs. expenses over the selected range. One axis, two entities. */
export function RevenueChart({
  data,
  currency,
  height = 280,
}: {
  data: SeriesPoint[];
  currency: CurrencyCode;
  height?: number;
}) {
  const empty = data.every((d) => d.revenue === 0 && d.expenses === 0);

  return (
    <div>
      <div className="mb-3 flex items-center gap-5">
        {(
          [
            ["Revenue", SERIES.revenue],
            ["Expenses", SERIES.expenses],
          ] as const
        ).map(([label, color]) => (
          <span key={label} className="flex items-center gap-2 text-[13px] text-slate-600">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: color }}
            />
            {label}
          </span>
        ))}
      </div>

      <div style={{ height }} className="relative">
        {empty && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <p className="rounded-lg bg-white/80 px-4 py-2 text-[13px] text-slate-500">
              No activity in this period yet.
            </p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 6, right: 8, bottom: 0, left: 4 }}
          >
            <defs>
              <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES.revenue} stopOpacity={0.18} />
                <stop offset="100%" stopColor={SERIES.revenue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-expenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES.expenses} stopOpacity={0.14} />
                <stop offset="100%" stopColor={SERIES.expenses} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke={INK.grid}
              strokeDasharray="0"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: INK.axis }}
              tick={{ fill: INK.muted, fontSize: 11 }}
              minTickGap={16}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={58}
              tick={{ fill: INK.muted, fontSize: 11 }}
              tickFormatter={(v: number) => moneyCompact(v, currency)}
            />
            <Tooltip
              cursor={{ stroke: INK.axis, strokeWidth: 1 }}
              content={<ChartTooltip currency={currency} />}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={SERIES.revenue}
              strokeWidth={2}
              fill="url(#grad-revenue)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke={SERIES.expenses}
              strokeWidth={2}
              fill="url(#grad-expenses)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Sales magnitude by product, service or category. A single-series ranked bar
 * list with direct value labels — no legend needed, and no color carries meaning.
 */
export function SalesBreakdown({
  slices,
  currency,
  limit = 6,
}: {
  slices: SalesSlice[];
  currency: CurrencyCode;
  limit?: number;
}) {
  if (!slices.length) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        No sales recorded for this selection yet.
      </p>
    );
  }

  const shown = slices.slice(0, limit);
  const max = Math.max(...shown.map((s) => s.value), 1);

  return (
    <ul className="space-y-3.5">
      {shown.map((s) => (
        <li key={s.name}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="truncate text-[13px] font-medium text-slate-700">
              {s.name}
            </span>
            <span className="shrink-0 tnum text-[13px] font-semibold text-slate-900">
              {money(s.value, currency)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, (s.value / max) * 100)}%`,
                  background: SERIES.revenue,
                }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs text-slate-500">
              {s.units} {s.units === 1 ? "unit" : "units"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
