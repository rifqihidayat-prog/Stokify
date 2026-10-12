"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  PackageSearch,
  ShoppingBag,
  Plus,
  Send,
  Moon,
  Scale,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  Truck,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { StockChart } from "@/components/charts/StockChart";
import { LowStockTable } from "./LowStockTable";
import { SupplierInflowModal } from "@/components/operations/SupplierInflowModal";
import { SendStockModal } from "@/components/operations/SendStockModal";
import { PickingListModal } from "@/components/operations/PickingListModal";
import { DailyClosingModal } from "@/components/operations/DailyClosingModal";
import { StoreAdjustmentModal } from "@/components/operations/StoreAdjustmentModal";
import type { DashboardStats } from "@/actions/dashboard";
import type { PickingListItem } from "@/actions/requests";
import type { AutocompleteItem } from "@/components/ui/Autocomplete";
import type { AuthUser } from "@/actions/auth";
import { formatDate, type Role } from "@/lib/utils";

interface DashboardHubProps {
  stats: DashboardStats;
  pickingItems: PickingListItem[];
  autocompleteProducts: AutocompleteItem[];
  role: Role;
  user?: AuthUser;
}

export function DashboardHub({
  stats,
  pickingItems,
  autocompleteProducts,
  role,
  user,
}: DashboardHubProps) {
  const router = useRouter();

  // Modals
  const [isInflowOpen, setIsInflowOpen] = useState(false);
  const [isSendStockOpen, setIsSendStockOpen] = useState(false);
  const [isPickingOpen, setIsPickingOpen] = useState(false);
  const [isClosingOpen, setIsClosingOpen] = useState(false);
  const [isAdjOpen, setIsAdjOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  const isAdmin = role === "ADMIN_PUSAT";

  return (
    <div className="space-y-6">
      {/* 1. TOP CRITICAL LOW STOCK BANNER ALERT (Untuk Admin Pusat) */}
      {isAdmin && stats.criticalBannerItems.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-950/40 via-[#141824] to-[#121620] p-4 sm:p-5 shadow-elevated-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/25">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm sm:text-base text-zinc-100">
                    Peringatan Stok Menipis ({stats.criticalBannerItems.length} Item Kritis)
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-subtle-pulse" />
                    Perlu Reorder Vendor
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {stats.criticalBannerItems.slice(0, 4).map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C0F15] px-2.5 py-1 text-zinc-200 border border-white/[0.06] text-xs"
                    >
                      <span className="text-sky-400 font-mono text-[11px]">[{item.sku}]</span>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-rose-400 font-mono font-bold tabular-nums">
                        (Sisa: {item.sisa_stok_realtime} {item.unit})
                      </span>
                    </span>
                  ))}
                  {stats.criticalBannerItems.length > 4 && (
                    <span className="inline-flex items-center text-zinc-400 font-medium text-xs py-1">
                      +{stats.criticalBannerItems.length - 4} item lainnya...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsInflowOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-sm shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] transition"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Order Restock Vendor</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. QUICK ACTION HUB */}
      <div className="flex flex-wrap items-center gap-2 bg-[#121620] p-2.5 sm:p-3 rounded-2xl border border-white/[0.06] shadow-elevated-card">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 pl-2">
          Aksi Cepat:
        </span>

        {isAdmin ? (
          <>
            <button
              type="button"
              onClick={() => setIsInflowOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 active:scale-[0.98] transition"
            >
              <Plus className="h-4 w-4" />
              <span>+ Terima Barang Datang (Pusat)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSendStockOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 px-3.5 py-1.5 text-xs font-bold text-zinc-950 hover:from-amber-300 hover:to-amber-400 shadow-sm shadow-amber-500/20 active:scale-[0.98] transition"
            >
              <Send className="h-4 w-4" />
              <span>Kirim Surat Jalan</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPickingOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#161B26] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-[#1D2332] active:scale-[0.98] transition"
            >
              <ClipboardList className="h-4 w-4 text-sky-400" />
              <span>Picking List ({pickingItems.length})</span>
            </button>
          </>
        ) : (
          <>
            <Link
              href="/requests"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 px-3.5 py-1.5 text-xs font-bold text-zinc-950 hover:from-amber-300 hover:to-amber-400 shadow-sm shadow-amber-500/20 active:scale-[0.98] transition"
            >
              <PackageSearch className="h-4 w-4" />
              <span>Minta Barang ke Pusat</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsClosingOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#161B26] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-[#1D2332] active:scale-[0.98] transition"
            >
              <Moon className="h-4 w-4 text-amber-400" />
              <span>Input Closing Harian</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAdjOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#161B26] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-[#1D2332] active:scale-[0.98] transition"
            >
              <Scale className="h-4 w-4 text-sky-400" />
              <span>Stock Opname Fisik</span>
            </button>
          </>
        )}

        <Link
          href="/ledger"
          className="ml-auto flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-[#0C0F15] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-amber-400" />
          <span>Buku Kas Mutasi &rarr;</span>
        </Link>
      </div>

      {/* 3. METRIC STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Master Item"
          value={stats.totalItems}
          icon={Boxes}
          tone="blue"
          sub="Barang aktif di katalog master"
        />
        <StatCard
          title="Stok Kritis Pusat"
          value={stats.criticalCount}
          icon={AlertTriangle}
          tone="red"
          sub="Di bawah minimum aman pusat"
        />
        <StatCard
          title="Permintaan Pending"
          value={stats.pendingRequests}
          icon={PackageSearch}
          tone="amber"
          sub="Menunggu penerbitan Surat Jalan"
        />
        <StatCard
          title="Mutasi Bulan Ini"
          value={stats.totalMutationsThisMonth}
          icon={TrendingUp}
          tone="emerald"
          sub="Transaksi terverifikasi ledger"
        />
      </div>

      {/* 4. STOCK CHART & LOW STOCK TABLE */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card
          title="Level Stok Fisik Pusat vs Batas Minimum"
          subtitle="Kalkulasi dinamis real-time saldo gudang pusat dari mutasi ledger."
          className="p-5"
        >
          <StockChart data={stats.chartData} />
        </Card>

        <LowStockTable items={stats.lowStock} />
      </div>

      {/* 5. RECENT TRANSACTION STREAM */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#121620] p-5 shadow-elevated-card">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5 mb-3">
          <div>
            <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-400" />
              <span>Riwayat Transaksi Mutasi Terkini</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              5 transaksi terakhir yang tercatat dalam ledger
            </p>
          </div>
          <Link
            href="/ledger"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            Lihat Semua Ledger
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {stats.recentMutations.map((m) => (
            <div
              key={m.id}
              className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 tabular-nums">
                  {m.ref}
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{m.item}</p>
                  <p className="text-xs text-zinc-400">
                    {m.sender} &rarr; <span className="text-zinc-200 font-medium">{m.receiver}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                <span className="font-mono font-bold text-sm text-zinc-100 tabular-nums">
                  {m.qty} {m.unit}
                </span>
                <span className="text-xs text-zinc-500 font-mono tabular-nums">{formatDate(m.date)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODALS */}
      <SupplierInflowModal
        isOpen={isInflowOpen}
        onClose={() => setIsInflowOpen(false)}
        products={autocompleteProducts}
        onSuccess={handleRefresh}
      />

      <SendStockModal
        isOpen={isSendStockOpen}
        onClose={() => setIsSendStockOpen(false)}
        products={autocompleteProducts}
        onSuccess={handleRefresh}
      />

      <PickingListModal
        isOpen={isPickingOpen}
        onClose={() => setIsPickingOpen(false)}
        items={pickingItems}
      />

      <DailyClosingModal
        isOpen={isClosingOpen}
        onClose={() => setIsClosingOpen(false)}
        storeName={user?.store_name || "Toko Cabang Surabaya"}
        products={autocompleteProducts}
        onSuccess={handleRefresh}
      />

      <StoreAdjustmentModal
        isOpen={isAdjOpen}
        onClose={() => setIsAdjOpen(false)}
        storeName={user?.store_name || "Toko Cabang Surabaya"}
        products={autocompleteProducts}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
