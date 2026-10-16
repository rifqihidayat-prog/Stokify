"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  PackageSearch,
  Plus,
  Send,
  Moon,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  Truck,
  CheckCircle2,
  Clock,
  Sparkles,
  ClipboardCheck,
  Building2,
  RefreshCw,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { StockChart } from "@/components/charts/StockChart";
import { LowStockTable } from "./LowStockTable";
import { SupplierInflowModal } from "@/components/operations/SupplierInflowModal";
import { SendStockModal } from "@/components/operations/SendStockModal";
import { PickingListModal } from "@/components/operations/PickingListModal";
import { DailyClosingModal } from "@/components/operations/DailyClosingModal";
import { CreatePRModal } from "@/components/inventory/CreatePRModal";
import { PurchaseRequestListModal } from "@/components/inventory/PurchaseRequestListModal";
import { SyncButton } from "@/components/inventory/SyncButton";
import type { DashboardStats } from "@/actions/dashboard";
import type { PickingListItem } from "@/actions/requests";
import type { PurchaseRequestWithProduct } from "@/actions/purchase_requests";
import type { AutocompleteItem } from "@/components/ui/Autocomplete";
import type { AuthUser } from "@/actions/auth";
import type { CentralStockCardItem } from "@/actions/mutations";
import { formatDate, type Role, cn } from "@/lib/utils";

interface DashboardHubProps {
  stats: DashboardStats;
  pickingItems: PickingListItem[];
  autocompleteProducts: AutocompleteItem[];
  activePRs?: PurchaseRequestWithProduct[];
  role: Role;
  user?: AuthUser;
}

export function DashboardHub({
  stats,
  pickingItems,
  autocompleteProducts,
  activePRs = [],
  role,
  user,
}: DashboardHubProps) {
  const router = useRouter();

  // Modals
  const [isInflowOpen, setIsInflowOpen] = useState(false);
  const [isSendStockOpen, setIsSendStockOpen] = useState(false);
  const [isPickingOpen, setIsPickingOpen] = useState(false);
  const [isClosingOpen, setIsClosingOpen] = useState(false);

  // PR Modals
  const [createPRItem, setCreatePRItem] = useState<CentralStockCardItem | null>(null);
  const [isPRListOpen, setIsPRListOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  const isAdmin = role === "ADMIN_PUSAT";

  return (
    <div className="space-y-6">
      {/* 1. HERO OPERATIONAL GREETING & STATUS RIBBON */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#151926] via-[#11141D] to-[#0D1017] p-5 sm:p-6 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 h-48 w-48 rounded-full bg-sky-500/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                {isAdmin ? "Admin Pusat Warehouse" : `Staff ${user?.store_name || "Toko Cabang"}`}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Google Sheets Live Sync
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Selamat Bertugas, {user?.name || user?.username || "Rekan"} 👋
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              {isAdmin
                ? "Pantau pergerakan logistik real-time, sisa fisik gudang pusat, status pemesanan vendor (PR), dan distribusi ke seluruh cabang."
                : `Portal pemesanan logistik mandiri dan pelaporan closing fisik harian untuk ${user?.store_name || "Toko Cabang"}.`}
            </p>
          </div>

          {/* Quick Sync & Health Pill */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {isAdmin && <SyncButton />}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0A0D14]/80 px-4 py-2.5 backdrop-blur-md">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Kesehatan Stok Pusat
              </div>
              <div className="text-lg font-black text-white font-mono flex items-center gap-1.5">
                <span>{stats.warehouseHealthPercent}%</span>
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {stats.safeCount}/{stats.totalItems} Aman
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Status Bar */}
        <div className="mt-5 pt-4 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Boxes className="h-4 w-4 text-sky-400 shrink-0" />
            <span className="font-semibold text-zinc-100">{stats.totalItems}</span>
            <span className="text-zinc-400">Master SKU Aktif</span>
          </div>

          <div className="flex items-center gap-2 text-zinc-300">
            <AlertTriangle
              className={cn(
                "h-4 w-4 shrink-0",
                stats.needPRCount > 0 ? "text-rose-400 animate-pulse" : "text-zinc-500"
              )}
            />
            <span
              className={cn(
                "font-bold",
                stats.needPRCount > 0 ? "text-rose-400" : "text-zinc-300"
              )}
            >
              {stats.needPRCount}
            </span>
            <span className="text-zinc-400">Perlu Order (Belum PR)</span>
          </div>

          <div className="flex items-center gap-2 text-zinc-300">
            <ClipboardCheck className="h-4 w-4 text-sky-400 shrink-0" />
            <span className="font-bold text-sky-300">{stats.activePRCount}</span>
            <span className="text-zinc-400">PR Menunggu Vendor</span>
          </div>

          <div className="flex items-center gap-2 text-zinc-300">
            <PackageSearch className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="font-bold text-amber-300">{stats.pendingRequests}</span>
            <span className="text-zinc-400">Antrean Surat Jalan</span>
          </div>
        </div>
      </div>

      {/* 2. COMMAND ACTION BAR (Aksi Cepat Interaktif) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121620] p-3 sm:p-4 rounded-2xl border border-white/[0.06] shadow-elevated-card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 pl-1 pr-2">
            Aksi Utama:
          </span>

          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => setIsInflowOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 active:scale-[0.98] transition-all shadow-sm"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>+ Terima Barang (Inflow)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSendStockOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-zinc-950 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] transition-all shadow-sm shadow-amber-500/20"
              >
                <Send className="h-4 w-4" />
                <span>Kirim Surat Jalan (SJ)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPickingOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#161B26] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-[#1D2332] active:scale-[0.98] transition-all"
              >
                <ClipboardList className="h-4 w-4 text-sky-400" />
                <span>Picking List ({pickingItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPRListOpen(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500/20 active:scale-[0.98] transition-all",
                  stats.activePRCount > 0 && "border-sky-500/50 shadow-sm shadow-sky-500/20"
                )}
              >
                <ClipboardCheck className="h-4 w-4 text-sky-400" />
                <span>Daftar PR ({stats.activePRCount})</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/requests"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-zinc-950 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] transition-all shadow-sm shadow-amber-500/20"
              >
                <PackageSearch className="h-4 w-4" />
                <span>Minta Barang ke Pusat</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsClosingOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#161B26] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-[#1D2332] active:scale-[0.98] transition-all"
              >
                <Moon className="h-4 w-4 text-amber-400" />
                <span>Input Closing Harian</span>
              </button>
            </>
          )}
        </div>

        <Link
          href="/ledger"
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-[#0C0F15] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-all"
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
          sub="100% Sinkron dengan Google Sheet"
        />

        <StatCard
          title="Butuh Order (Belum PR)"
          value={stats.needPRCount}
          icon={AlertTriangle}
          tone={stats.needPRCount > 0 ? "red" : "emerald"}
          sub={
            stats.needPRCount > 0
              ? "Stok kritis & belum dibuatkan PR"
              : "Seluruh stok aman / ter-cover PR"
          }
        />

        <StatCard
          title="Purchase Request (PR)"
          value={stats.activePRCount}
          icon={ClipboardCheck}
          tone="violet"
          sub="Pengadaan aktif menunggu supplier"
        />

        <StatCard
          title="Permintaan Cabang Pending"
          value={stats.pendingRequests}
          icon={PackageSearch}
          tone="amber"
          sub="Antrean penyiapan Surat Jalan"
        />
      </div>

      {/* 4. STOCK ANALYTICS & LOW STOCK ACTION TABLE */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1.1fr]">
        <Card
          title="Monitoring Saldo Fisik Pusat vs Batas Minimum"
          subtitle="Saldo realtime terverifikasi mutasi ledger. Menampilkan 10 item prioritas pantau."
          className="p-5"
        >
          <StockChart data={stats.chartData} />
        </Card>

        {/* Tabel Stok Rendah dengan Aksi Langsung Buat PR */}
        <LowStockTable
          items={stats.lowStock}
          onOpenCreatePR={(item) => {
            setCreatePRItem({
              ...item,
              category: "DAILY_CONSUMABLE",
              stok_masuk: 0,
              stok_keluar: 0,
              status: "KRITIS",
              status_text: "BELUM DIBUAT PR",
            });
          }}
          onOpenPRList={() => setIsPRListOpen(true)}
        />
      </div>

      {/* 5. RECENT TRANSACTION STREAM (LEDGER FEED) */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#121620] p-5 shadow-elevated-card">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5 mb-3">
          <div>
            <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-400" />
              <span>Aktivitas Mutasi Logistik Terkini</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Aliran barang masuk, distribusi surat jalan cabang, dan closing harian toko
            </p>
          </div>
          <Link
            href="/ledger"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            Buka Buku Ledger Lengkap
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {stats.recentMutations.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Belum ada riwayat transaksi mutasi tercatat di sistem.
            </div>
          ) : (
            stats.recentMutations.map((m) => {
              const isSupplier = m.type === "IN-SUPPLIER";
              const isSJ = m.type === "SURAT JALAN";
              const isClosing = m.type === "CLOSING";

              return (
                <div
                  key={m.id}
                  className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "font-mono text-xs font-bold px-2 py-0.5 rounded-lg border tabular-nums shrink-0",
                        isSupplier && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        isSJ && "bg-purple-500/10 text-purple-300 border-purple-500/20",
                        isClosing && "bg-amber-500/10 text-amber-300 border-amber-500/20",
                        !isSupplier && !isSJ && !isClosing && "bg-zinc-800 text-zinc-300 border-zinc-700"
                      )}
                    >
                      {m.ref}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{m.item}</p>
                      <p className="text-xs text-zinc-400 flex items-center gap-1">
                        <span>{m.sender}</span>
                        <span className="text-zinc-600">&rarr;</span>
                        <span className="text-zinc-200 font-medium">{m.receiver}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <span
                      className={cn(
                        "font-mono font-bold text-sm tabular-nums",
                        isSupplier ? "text-emerald-400" : isSJ ? "text-purple-300" : "text-zinc-100"
                      )}
                    >
                      {isSupplier ? "+" : isSJ || isClosing ? "-" : ""}
                      {m.qty} {m.unit}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono tabular-nums">
                      {formatDate(m.date)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
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

      {/* Modal Buat PR Langsung dari Dashboard */}
      <CreatePRModal
        isOpen={Boolean(createPRItem)}
        onClose={() => setCreatePRItem(null)}
        item={createPRItem}
      />

      {/* Modal Daftar PR Aktif */}
      <PurchaseRequestListModal
        isOpen={isPRListOpen}
        onClose={() => setIsPRListOpen(false)}
        requests={activePRs}
        onOpenInflowWithPR={(itemId) => {
          setIsInflowOpen(true);
        }}
      />
    </div>
  );
}
