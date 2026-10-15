"use client";

import React, { useState } from "react";
import {
  Boxes,
  Plus,
  Send,
  Scale,
  Search,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SyncButton } from "./SyncButton";
import { cn } from "@/lib/utils";
import type { CentralStockCardItem } from "@/actions/mutations";
import type { Role } from "@/lib/utils";

interface CentralStockCardProps {
  items: CentralStockCardItem[];
  role: Role;
  onOpenInflow?: (preselectedItemId?: string) => void;
  onOpenSendStock?: () => void;
  onOpenCentralAdjustment?: () => void;
}

export function CentralStockCard({
  items,
  role,
  onOpenInflow,
  onOpenSendStock,
  onOpenCentralAdjustment,
}: CentralStockCardProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (statusFilter === "KRITIS") return item.status === "KRITIS";
    if (statusFilter === "WARNING") return item.status === "WARNING";
    if (statusFilter === "AMAN") return item.status === "AMAN";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Search and Action Hub */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#121620] p-3 sm:p-4 rounded-2xl border border-white/[0.06] shadow-elevated-card">
        <div className="flex flex-1 items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode SKU, nama barang master, kategori..."
              className="w-full rounded-xl border border-white/[0.08] bg-[#0C0F15] py-2 pl-10 pr-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/[0.08] bg-[#0C0F15] px-3.5 py-2 text-xs sm:text-sm text-zinc-200 font-medium focus:border-amber-400 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="ALL">Semua Status ({items.length})</option>
            <option value="KRITIS">🔴 Stok Kritis (Low)</option>
            <option value="WARNING">🟡 Perlu Monitor</option>
            <option value="AMAN">🟢 Stok Aman</option>
          </select>
        </div>

        {/* Action Buttons for Admin */}
        {role === "ADMIN_PUSAT" && (
          <div className="flex flex-wrap items-center gap-2">
            {onOpenInflow && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => onOpenInflow()}
                className="text-xs"
              >
                <Plus className="h-4 w-4 mr-1 stroke-[2.5]" />
                + Inflow Supplier
              </Button>
            )}

            {onOpenSendStock && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenSendStock}
                className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                Kirim Surat Jalan
              </Button>
            )}

            {onOpenCentralAdjustment && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenCentralAdjustment}
                className="text-xs text-zinc-300"
                title="Penyesuaian Stok Gudang Pusat"
              >
                <Scale className="h-3.5 w-3.5 mr-1 text-sky-400" />
                Adjustment
              </Button>
            )}

            <SyncButton />
          </div>
        )}
      </div>

      {/* Main Stock Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#121620] shadow-elevated-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#0C0F15]/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4 font-mono w-28">ID / SKU</th>
                <th className="py-3.5 px-4">Nama Barang Master</th>
                <th className="py-3.5 px-4 text-right font-mono">
                  Stok Masuk (+)
                </th>
                <th className="py-3.5 px-4 text-right font-mono">
                  Stok Keluar (-)
                </th>
                <th className="py-3.5 px-4 text-right font-mono">
                  Sisa Fisik Pusat
                </th>
                <th className="py-3.5 px-4 text-right font-mono">
                  Min. Stok
                </th>
                <th className="py-3.5 px-4 text-center">Status Stok</th>
                {role === "ADMIN_PUSAT" && (
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={role === "ADMIN_PUSAT" ? 8 : 7} className="py-12 text-center text-zinc-500 text-sm">
                    Tidak ditemukan barang yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isLow = item.status === "KRITIS";
                  const isZero = item.sisa_stok_realtime === 0;

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "transition-colors hover:bg-white/[0.02]",
                        isLow && "bg-rose-500/[0.03] hover:bg-rose-500/[0.06]"
                      )}
                    >
                      {/* ID / SKU */}
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-sky-400 tabular-nums">
                        {item.sku}
                      </td>

                      {/* Nama Barang */}
                      <td className="py-3.5 px-4 font-semibold text-zinc-100">
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                          {isZero && (
                            <span className="rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/25">
                              KOSONG
                            </span>
                          )}
                        </div>
                        <span className="block text-xs font-normal text-zinc-400 mt-0.5">
                          {item.category} • Satuan: {item.unit}
                        </span>
                      </td>

                      {/* Stok Masuk (+) */}
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-emerald-400 tabular-nums">
                        +{item.stok_masuk} <span className="text-[11px] font-normal text-zinc-500">{item.unit}</span>
                      </td>

                      {/* Stok Keluar (-) */}
                      <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-rose-400 tabular-nums">
                        -{item.stok_keluar} <span className="text-[11px] font-normal text-zinc-500">{item.unit}</span>
                      </td>

                      {/* Sisa Stok Realtime */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm tabular-nums">
                        <span
                          className={cn(
                            "inline-block rounded-lg px-2.5 py-1",
                            isLow
                              ? "bg-rose-500/15 text-rose-300 font-extrabold border border-rose-500/30"
                              : "text-zinc-100"
                          )}
                        >
                          {item.sisa_stok_realtime}{" "}
                          <span className="text-xs font-normal text-zinc-400">
                            {item.unit}
                          </span>
                        </span>
                      </td>

                      {/* Min Stok Pusat */}
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-zinc-400 tabular-nums">
                        {item.min_stock_central} {item.unit}
                      </td>

                      {/* Status Stok */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          {item.status === "KRITIS" ? (
                            <>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-subtle-pulse" />
                                Restock Supplier
                              </span>
                            </>
                          ) : item.status === "WARNING" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              Perlu Monitor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              Stok Aman
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Aksi Tambah Stok Datang */}
                      {role === "ADMIN_PUSAT" && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onOpenInflow?.(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all shadow-sm"
                            title={`Update Tambah Stok Masuk: ${item.name}`}
                          >
                            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>+ Stok Datang</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
