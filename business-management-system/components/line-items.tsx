"use client";

import { Plus, Trash2 } from "lucide-react";
import { money } from "@/lib/format";
import { docTotal } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { CurrencyCode, Item, LineItem } from "@/lib/types";
import { Button, Input, Select } from "./ui";

let lineSeq = 0;

export function newLine(item?: Item): LineItem {
  return {
    id: `line_${Date.now().toString(36)}${lineSeq++}`,
    itemId: item?.id ?? "",
    name: item?.name ?? "",
    quantity: 1,
    unitPrice: item?.price ?? 0,
    taxRate: item?.taxRate ?? 0,
    discount: 0,
  };
}

/**
 * Editable line-item grid shared by the order and invoice forms.
 * Totals recalculate live: subtotal − discounts + tax.
 */
export function LineItemsEditor({
  lines,
  onChange,
  discount,
  onDiscountChange,
  currency,
  error,
}: {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  discount: number;
  onDiscountChange: (v: number) => void;
  currency: CurrencyCode;
  error?: string;
}) {
  const { items } = useStore();
  const catalogue = items.filter((i) => i.status === "Active");
  const totals = docTotal(lines, discount);

  const update = (id: string, patch: Partial<LineItem>) =>
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const pickItem = (id: string, itemId: string) => {
    const item = catalogue.find((i) => i.id === itemId);
    if (!item) {
      update(id, { itemId: "", name: "" });
      return;
    }
    update(id, {
      itemId: item.id,
      name: item.name,
      unitPrice: item.price,
      taxRate: item.taxRate,
    });
  };

  return (
    <div>
      <div className="overflow-x-auto scrollbar-thin rounded-lg border border-slate-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5">Item</th>
              <th className="w-20 px-3 py-2.5">Qty</th>
              <th className="w-32 px-3 py-2.5">Unit price</th>
              <th className="w-24 px-3 py-2.5">Disc %</th>
              <th className="w-24 px-3 py-2.5">Tax %</th>
              <th className="w-32 px-3 py-2.5 text-right">Amount</th>
              <th className="w-10 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const gross = line.unitPrice * line.quantity;
              const net = gross - (gross * line.discount) / 100;
              return (
                <tr key={line.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <Select
                      value={line.itemId}
                      onChange={(e) => pickItem(line.id, e.target.value)}
                      className="h-9 py-1"
                      aria-label="Select item"
                    >
                      <option value="">Select a product or service…</option>
                      <optgroup label="Products">
                        {catalogue
                          .filter((i) => i.kind === "Product")
                          .map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Services">
                        {catalogue
                          .filter((i) => i.kind === "Service")
                          .map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                      </optgroup>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        update(line.id, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="h-9 py-1"
                      aria-label="Quantity"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      value={line.unitPrice}
                      onChange={(e) =>
                        update(line.id, { unitPrice: Number(e.target.value) || 0 })
                      }
                      className="h-9 py-1"
                      aria-label="Unit price"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={line.discount}
                      onChange={(e) =>
                        update(line.id, { discount: Number(e.target.value) || 0 })
                      }
                      className="h-9 py-1"
                      aria-label="Line discount"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={line.taxRate}
                      onChange={(e) =>
                        update(line.id, { taxRate: Number(e.target.value) || 0 })
                      }
                      className="h-9 py-1"
                      aria-label="Tax rate"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium tnum text-slate-800">
                    {money(net, currency)}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      aria-label="Remove line"
                      onClick={() =>
                        onChange(lines.filter((l) => l.id !== line.id))
                      }
                      disabled={lines.length === 1}
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <Button size="sm" onClick={() => onChange([...lines, newLine()])}>
          <Plus size={15} />
          Add line
        </Button>

        <div className="w-full max-w-xs space-y-2 text-sm sm:w-auto">
          <div className="flex items-center justify-between gap-8">
            <span className="text-slate-500">Subtotal</span>
            <span className="tnum font-medium text-slate-800">
              {money(totals.subtotal, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="flex items-center gap-2 text-slate-500">
              Order discount
              <span className="inline-flex items-center">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={discount}
                  onChange={(e) =>
                    onDiscountChange(
                      Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    )
                  }
                  className="h-7 w-16 px-2 py-0 text-[13px]"
                  aria-label="Order discount percent"
                />
                <span className="ml-1 text-slate-400">%</span>
              </span>
            </span>
            <span className="tnum font-medium text-rose-600">
              −{money(totals.discount, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-slate-500">Tax</span>
            <span className="tnum font-medium text-slate-800">
              {money(totals.tax, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-8 border-t border-slate-200 pt-2">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="tnum text-base font-semibold text-slate-900">
              {money(totals.total, currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
