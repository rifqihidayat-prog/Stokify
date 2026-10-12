"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Store, Plus, Send, Scale, Moon } from "lucide-react";
import { CentralStockCard } from "./CentralStockCard";
import { StoreStockAccordion } from "./StoreStockAccordion";
import { SupplierInflowModal } from "@/components/operations/SupplierInflowModal";
import { SendStockModal } from "@/components/operations/SendStockModal";
import { CentralAdjustmentModal } from "@/components/operations/CentralAdjustmentModal";
import { DailyClosingModal } from "@/components/operations/DailyClosingModal";
import { StoreAdjustmentModal } from "@/components/operations/StoreAdjustmentModal";
import type { CentralStockCardItem, StoreStockGroup } from "@/actions/mutations";
import type { AutocompleteItem } from "@/components/ui/Autocomplete";
import type { Role } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface InventoryHubProps {
  centralItems: CentralStockCardItem[];
  storeGroups: StoreStockGroup[];
  autocompleteProducts: AutocompleteItem[];
  role: Role;
}

export function InventoryHub({
  centralItems,
  storeGroups,
  autocompleteProducts,
  role,
}: InventoryHubProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"CENTRAL" | "STORE">("CENTRAL");

  // Modal States
  const [isInflowOpen, setIsInflowOpen] = useState(false);
  const [inflowInitialItemId, setInflowInitialItemId] = useState<string | undefined>(undefined);
  const [isSendStockOpen, setIsSendStockOpen] = useState(false);
  const [isCentralAdjOpen, setIsCentralAdjOpen] = useState(false);

  const [closingStore, setClosingStore] = useState<string | null>(null);
  const [adjStore, setAdjStore] = useState<string | null>(null);

  const storeNames = storeGroups.map((s) => s.store_name);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#121620] border border-white/[0.06] shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("CENTRAL")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150",
              activeTab === "CENTRAL"
                ? "bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            )}
          >
            <Boxes className="h-4 w-4" />
            <span>Stok Pusat (Gudang Utama)</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-mono tabular-nums",
                activeTab === "CENTRAL"
                  ? "bg-zinc-950/20 text-zinc-950 font-bold"
                  : "bg-white/[0.06] text-zinc-400"
              )}
            >
              {centralItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STORE")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150",
              activeTab === "STORE"
                ? "bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            )}
          >
            <Store className="h-4 w-4" />
            <span>Stok Toko (Multi-Store)</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-mono tabular-nums",
                activeTab === "STORE"
                  ? "bg-zinc-950/20 text-zinc-950 font-bold"
                  : "bg-white/[0.06] text-zinc-400"
              )}
            >
              {storeGroups.length} Cabang
            </span>
          </button>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {role === "ADMIN_PUSAT" && (
            <>
              <button
                type="button"
                onClick={() => setIsInflowOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 active:scale-[0.98] transition"
              >
                <Plus className="h-4 w-4" />
                <span>+ Barang Masuk Vendor</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSendStockOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:from-amber-300 hover:to-amber-400 shadow-sm shadow-amber-500/20 active:scale-[0.98] transition"
              >
                <Send className="h-4 w-4" />
                <span>Kirim Surat Jalan</span>
              </button>
            </>
          )}

          {role === "STAF_TOKO" && (
            <>
              <button
                type="button"
                onClick={() => setClosingStore(storeNames[0] || "Toko Cabang Surabaya")}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition"
              >
                <Moon className="h-4 w-4 text-amber-400" />
                <span>Input Closing Harian</span>
              </button>
              <button
                type="button"
                onClick={() => setAdjStore(storeNames[0] || "Toko Cabang Surabaya")}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition"
              >
                <Scale className="h-4 w-4 text-sky-400" />
                <span>Adjustment Opname</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab 1: Stok Pusat */}
      {activeTab === "CENTRAL" && (
        <CentralStockCard
          items={centralItems}
          role={role}
          onOpenInflow={(itemId) => {
            setInflowInitialItemId(itemId);
            setIsInflowOpen(true);
          }}
          onOpenSendStock={() => setIsSendStockOpen(true)}
          onOpenCentralAdjustment={() => setIsCentralAdjOpen(true)}
        />
      )}

      {/* Tab 2: Stok Toko (Multi-Store Accordion) */}
      {activeTab === "STORE" && (
        <StoreStockAccordion
          stores={storeGroups}
          role={role}
          onOpenClosing={(st) => setClosingStore(st)}
          onOpenAdjustment={(st) => setAdjStore(st)}
          onOpenRequest={() => router.push("/requests")}
        />
      )}

      {/* Modals */}
      <SupplierInflowModal
        isOpen={isInflowOpen}
        onClose={() => {
          setIsInflowOpen(false);
          setInflowInitialItemId(undefined);
        }}
        initialItemId={inflowInitialItemId}
        products={autocompleteProducts}
        onSuccess={handleRefresh}
      />

      <SendStockModal
        isOpen={isSendStockOpen}
        onClose={() => setIsSendStockOpen(false)}
        products={autocompleteProducts}
        stores={storeNames}
        onSuccess={handleRefresh}
      />

      <CentralAdjustmentModal
        isOpen={isCentralAdjOpen}
        onClose={() => setIsCentralAdjOpen(false)}
        products={autocompleteProducts}
        onSuccess={handleRefresh}
      />

      {closingStore && (
        <DailyClosingModal
          isOpen={!!closingStore}
          onClose={() => setClosingStore(null)}
          storeName={closingStore}
          products={autocompleteProducts}
          onSuccess={handleRefresh}
        />
      )}

      {adjStore && (
        <StoreAdjustmentModal
          isOpen={!!adjStore}
          onClose={() => setAdjStore(null)}
          storeName={adjStore}
          products={autocompleteProducts}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
