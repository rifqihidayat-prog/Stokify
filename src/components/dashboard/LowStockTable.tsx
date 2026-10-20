"use client";

import React from "react";
import { AlertTriangle, PackageX, ClipboardList, ClipboardCheck, Pencil, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { LowStockItem } from "@/actions/dashboard";
import type { Role } from "@/lib/utils";

interface LowStockTableProps {
  items: LowStockItem[];
  role?: Role;
  onOpenCreatePR?: (item: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    category?: string;
    sisa_stok_realtime: number;
    min_stock_central: number;
  }) => void;
  onOpenPRList?: () => void;
  onOpenEditMinStock?: (item: LowStockItem) => void;
}

export function LowStockTable({
  items,
  role,
  onOpenCreatePR,
  onOpenPRList,
  onOpenEditMinStock,
}: LowStockTableProps) {
  const needPRCount = items.filter((i) => i.status === "KRITIS").length;
  const prCreatedCount = items.filter((i) => i.status === "PR_CREATED").length;

  return (
    <Card
      title="Peringatan Reorder Stok Pusat"
      subtitle="Monitoring barang yang berada di bawah batas minimum dan status pengadaan PR."
      headerAction={
        needPRCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-subtle-pulse" />
            {needPRCount} Belum Dibuat PR
          </span>
        ) : prCreatedCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-bold text-sky-300 border border-sky-500/30">
            <ClipboardCheck className="h-3.5 w-3.5 text-sky-400" />
            {prCreatedCount} Sudah Dibuat PR
          </span>
        ) : undefined
      }
      className="p-5"
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <PackageX className="h-10 w-10 text-emerald-400/80" />
          <p className="text-sm font-semibold text-zinc-300">
            Kondisi Stok Gudang Pusat Prima
          </p>
          <p className="text-xs text-zinc-500 max-w-xs">
            Seluruh item fisik berada di atas batas minimum aman dan tidak ada antrean reorder darurat.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wider text-zinc-400 bg-[#0C0F15]/60">
                <th className="py-3 px-3">Item Barang</th>
                <th className="py-3 px-3 text-right">Fisik / Min</th>
                <th className="py-3 px-3 text-center">Status PR</th>
                <th className="py-3 px-3 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {items.map((p) => {
                const isKritis = p.status === "KRITIS";
                const isPRCreated = p.status === "PR_CREATED";
                const ratio =
                  p.min_stock_central > 0
                    ? Math.min(100, Math.round((p.current_stock_central / p.min_stock_central) * 100))
                    : 100;

                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "hover:bg-white/[0.02] transition-colors",
                      isKritis && "bg-rose-500/[0.02]"
                    )}
                  >
                    {/* Item */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-400">
                          [{p.sku || "-"}]
                        </span>
                        <span className="font-semibold text-zinc-100 text-sm truncate max-w-[160px]">
                          {p.name}
                        </span>
                      </div>
                      <div className="w-24 h-1 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isKritis ? "bg-rose-500" : isPRCreated ? "bg-sky-400" : "bg-amber-400"
                          )}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </td>

                    {/* Fisik / Min */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-mono font-bold tabular-nums text-sm">
                        <span
                          className={
                            p.current_stock_central <= 0
                              ? "text-rose-400 font-extrabold"
                              : isKritis
                              ? "text-rose-300"
                              : "text-zinc-100"
                          }
                        >
                          {p.current_stock_central}
                        </span>
                        {role === "ADMIN_PUSAT" && onOpenEditMinStock ? (
                          <button
                            type="button"
                            onClick={() => onOpenEditMinStock(p)}
                            className="inline-flex items-center gap-1 group text-zinc-400 hover:text-amber-400 font-normal text-xs transition-colors py-0.5 px-1 rounded hover:bg-white/[0.04] cursor-pointer"
                            title="Klik untuk ubah batas minimum stok"
                          >
                            <span>/ {p.min_stock_central} {p.unit}</span>
                            <Pencil className="h-2.5 w-2.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                          </button>
                        ) : (
                          <span className="text-zinc-500 font-normal text-xs">
                            {" "}
                            / {p.min_stock_central} {p.unit}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status PR */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isPRCreated ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-300 border border-sky-500/25">
                            <ClipboardCheck className="h-3 w-3 text-sky-400" />
                            Sudah Dibuat PR
                          </span>
                          {p.active_pr && (
                            <span className="text-[10px] text-sky-400/80 font-mono mt-0.5">
                              {p.active_pr.quantity} {p.unit}
                            </span>
                          )}
                        </div>
                      ) : isKritis ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-300 border border-rose-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-subtle-pulse" />
                          Belum Dibuat PR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/20">
                          Monitor
                        </span>
                      )}
                    </td>

                    {/* Aksi Cepat */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {role === "ADMIN_PUSAT" && onOpenEditMinStock && (
                          <button
                            type="button"
                            onClick={() => onOpenEditMinStock(p)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs text-zinc-300 hover:text-amber-300 hover:border-amber-500/30 hover:bg-amber-500/10 transition-colors"
                            title={`Ubah batas minimum stok: ${p.name}`}
                          >
                            <SlidersHorizontal className="h-3 w-3 text-amber-400" />
                            <span className="hidden sm:inline text-[11px]">Min</span>
                          </button>
                        )}

                        {isKritis && onOpenCreatePR ? (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenCreatePR({
                                id: p.id,
                                sku: p.sku,
                                name: p.name,
                                unit: p.unit,
                                sisa_stok_realtime: p.current_stock_central,
                                min_stock_central: p.min_stock_central,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/25 active:scale-95 transition-all shadow-sm"
                            title={`Buat PR untuk ${p.name}`}
                          >
                            <ClipboardList className="h-3.5 w-3.5 text-amber-400" />
                            <span>Buat PR</span>
                          </button>
                        ) : isPRCreated && onOpenPRList ? (
                          <button
                            type="button"
                            onClick={onOpenPRList}
                            className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                          >
                            <span>Lihat PR &rarr;</span>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
