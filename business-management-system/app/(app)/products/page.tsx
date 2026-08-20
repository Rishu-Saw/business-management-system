"use client";

import {
  AlertTriangle,
  Download,
  MoreHorizontal,
  Package,
  PackageX,
  Pencil,
  Plus,
  Search,
  Trash2,
  Warehouse,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ItemFormModal } from "@/components/modals";
import { RequirePermission } from "@/components/shell";
import { useToast } from "@/components/toast";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
  Menu,
  MenuItem,
  PageHeader,
  Pagination,
  Select,
  StatusBadge,
  TableShell,
  Td,
  Th,
} from "@/components/ui";
import { downloadCsv } from "@/lib/export";
import { money, num } from "@/lib/format";
import { inventoryValue, stockState } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Item } from "@/lib/types";

const PAGE_SIZE = 10;

export default function ProductsPage() {
  return (
    <RequirePermission permission="manage:orders">
      <ProductsView />
    </RequirePermission>
  );
}

function ProductsView() {
  const { items, business, deleteItem, can } = useStore();
  const { success } = useToast();

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("All");
  const [category, setCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Item | undefined>();
  const [toDelete, setToDelete] = useState<Item | null>(null);

  const canEdit = can("manage:products");
  const showMoney = can("view:financials");

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items],
  );

  const products = items.filter((i) => i.kind === "Product");
  const lowStock = products.filter((i) => stockState(i) === "low");
  const outOfStock = products.filter((i) => stockState(i) === "out");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => (kind === "All" ? true : i.kind === kind))
      .filter((i) => (category === "All" ? true : i.category === category))
      .filter((i) => {
        if (stockFilter === "All") return true;
        const state = stockState(i);
        if (stockFilter === "In stock") return state === "ok";
        if (stockFilter === "Low stock") return state === "low";
        if (stockFilter === "Out of stock") return state === "out";
        return true;
      })
      .filter(
        (i) =>
          !q ||
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q),
      );
  }, [items, query, kind, category, stockFilter]);

  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCsv() {
    downloadCsv(
      "products-and-services",
      ["Name", "Type", "SKU", "Category", "Price", "Cost", "Tax %", "Stock", "Min stock", "Status"],
      rows.map((i) => [
        i.name,
        i.kind,
        i.sku,
        i.category,
        i.price,
        i.costPrice,
        i.taxRate,
        i.stock ?? "",
        i.minStock ?? "",
        i.status,
      ]),
    );
    success("Export ready", `${rows.length} records exported to CSV.`);
  }

  return (
    <>
      <PageHeader
        title="Products & services"
        subtitle={`${products.length} products · ${items.length - products.length} services`}
        actions={
          <>
            <Button onClick={exportCsv}>
              <Download size={15} />
              Export CSV
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                onClick={() => {
                  setEditing(undefined);
                  setFormOpen(true);
                }}
              >
                <Plus size={15} />
                Add item
              </Button>
            )}
          </>
        }
      />

      {/* inventory summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InventoryStat
          icon={<Package size={18} />}
          label="Products in catalogue"
          value={num(products.length)}
          hint={`${items.length - products.length} services`}
        />
        <InventoryStat
          icon={<Warehouse size={18} />}
          label="Units in stock"
          value={num(products.reduce((s, i) => s + (i.stock ?? 0), 0))}
          hint={
            showMoney
              ? `${money(inventoryValue(items), business.currency)} at cost`
              : undefined
          }
        />
        <InventoryStat
          icon={<AlertTriangle size={18} />}
          label="Low stock"
          value={num(lowStock.length)}
          hint={lowStock.length ? "At or below minimum" : "All healthy"}
          tone={lowStock.length ? "warn" : "neutral"}
          onClick={() => {
            setStockFilter("Low stock");
            setPage(1);
          }}
        />
        <InventoryStat
          icon={<PackageX size={18} />}
          label="Out of stock"
          value={num(outOfStock.length)}
          hint={outOfStock.length ? "Needs reordering" : "Nothing out of stock"}
          tone={outOfStock.length ? "bad" : "neutral"}
          onClick={() => {
            setStockFilter("Out of stock");
            setPage(1);
          }}
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-4">
          <div className="relative min-w-[200px] flex-1">
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
              placeholder="Search by name, SKU or category…"
              className="pl-9"
              aria-label="Search products"
            />
          </div>
          <Select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setPage(1);
            }}
            className="w-auto min-w-[120px]"
            aria-label="Filter by type"
          >
            <option>All</option>
            <option>Product</option>
            <option>Service</option>
          </Select>
          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-auto min-w-[140px]"
            aria-label="Filter by category"
          >
            <option>All</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setPage(1);
            }}
            className="w-auto min-w-[140px]"
            aria-label="Filter by stock level"
          >
            <option>All</option>
            <option>In stock</option>
            <option>Low stock</option>
            <option>Out of stock</option>
          </Select>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Package size={22} />}
            title="Nothing matches those filters"
            message="Try a different search term, or clear the filters to see everything."
            action={
              <Button
                onClick={() => {
                  setQuery("");
                  setKind("All");
                  setCategory("All");
                  setStockFilter("All");
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
                  <Th>Item</Th>
                  <Th>SKU</Th>
                  <Th>Category</Th>
                  <Th className="text-right">Price</Th>
                  {showMoney && <Th className="text-right">Cost</Th>}
                  {showMoney && <Th className="text-right">Margin</Th>}
                  <Th>Stock</Th>
                  <Th>Status</Th>
                  {canEdit && <Th className="w-12" />}
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => {
                  const state = stockState(item);
                  const margin =
                    item.price > 0
                      ? ((item.price - item.costPrice) / item.price) * 100
                      : 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <Td>
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold"
                            style={{
                              background: `hsl(${item.imageHue} 70% 94%)`,
                              color: `hsl(${item.imageHue} 55% 34%)`,
                            }}
                          >
                            {item.kind === "Service" ? "SVC" : "PRD"}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[240px] truncate font-medium text-slate-900">
                              {item.name}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {item.kind}
                              {item.durationMinutes
                                ? ` · ${Math.round(item.durationMinutes / 60)}h`
                                : ""}
                            </span>
                          </span>
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap text-slate-500">
                        {item.sku}
                      </Td>
                      <Td>
                        <Badge>{item.category}</Badge>
                      </Td>
                      <Td className="text-right tnum font-medium text-slate-900">
                        {money(item.price, business.currency)}
                        <span className="block text-xs font-normal text-slate-400">
                          +{item.taxRate}% tax
                        </span>
                      </Td>
                      {showMoney && (
                        <Td className="text-right tnum text-slate-600">
                          {money(item.costPrice, business.currency)}
                        </Td>
                      )}
                      {showMoney && (
                        <Td className="text-right tnum text-slate-600">
                          {margin.toFixed(0)}%
                        </Td>
                      )}
                      <Td>
                        {state === "n/a" ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span className="tnum font-medium text-slate-800">
                              {item.stock}
                            </span>
                            {state === "out" && <Badge tone="red">Out</Badge>}
                            {state === "low" && <Badge tone="amber">Low</Badge>}
                          </span>
                        )}
                      </Td>
                      <Td>
                        <StatusBadge status={item.status} />
                      </Td>
                      {canEdit && (
                        <Td>
                          <Menu
                            trigger={({ onClick }) => (
                              <IconButton label="Item actions" onClick={onClick}>
                                <MoreHorizontal size={17} />
                              </IconButton>
                            )}
                          >
                            {(close) => (
                              <>
                                <MenuItem
                                  onClick={() => {
                                    close();
                                    setEditing(item);
                                    setFormOpen(true);
                                  }}
                                >
                                  <Pencil size={15} className="text-slate-400" />
                                  Edit
                                </MenuItem>
                                <MenuItem
                                  danger
                                  onClick={() => {
                                    close();
                                    setToDelete(item);
                                  }}
                                >
                                  <Trash2 size={15} />
                                  Delete
                                </MenuItem>
                              </>
                            )}
                          </Menu>
                        </Td>
                      )}
                    </tr>
                  );
                })}
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

      <ItemFormModal
        open={formOpen}
        item={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
      />
      <ConfirmDialog
        open={!!toDelete}
        title={`Delete ${toDelete?.kind.toLowerCase() ?? "item"}`}
        message={`Delete ${toDelete?.name}? Existing orders and invoices keep their line items, but this will no longer be available to sell.`}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteItem(toDelete.id);
            success("Deleted", `${toDelete.name} has been removed.`);
          }
          setToDelete(null);
        }}
      />
    </>
  );
}

function InventoryStat({
  icon,
  label,
  value,
  hint,
  tone = "neutral",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "warn" | "bad";
  onClick?: () => void;
}) {
  const iconTone =
    tone === "warn"
      ? "bg-amber-50 text-amber-600"
      : tone === "bad"
        ? "bg-rose-50 text-rose-600"
        : "bg-brand-50 text-brand-600";

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTone}`}
        >
          {icon}
        </span>
      </div>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="card p-5 text-left transition-shadow hover:shadow-pop"
      >
        {content}
      </button>
    );
  }
  return <Card className="p-5">{content}</Card>;
}
