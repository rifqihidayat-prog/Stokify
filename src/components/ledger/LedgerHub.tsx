"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, ShieldAlert } from "lucide-react";
import { MutationLedgerTable } from "./MutationLedgerTable";
import { AuditAdjustmentTable } from "./AuditAdjustmentTable";
import type { MutationLedgerItem } from "@/actions/mutations";
import type { Role } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LedgerHubProps {
  ledgerData: {
    data: MutationLedgerItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  auditData: {
    data: MutationLedgerItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  role: Role;
}

export function LedgerHub({ ledgerData, auditData, role }: LedgerHubProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"LEDGER" | "AUDIT">("LEDGER");

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#121620] border border-white/[0.06] shadow-inner w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("LEDGER")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150",
            activeTab === "LEDGER"
              ? "bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
          )}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Buku Kas Log Mutasi (Ledger)</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-mono tabular-nums",
              activeTab === "LEDGER"
                ? "bg-zinc-950/20 text-zinc-950 font-bold"
                : "bg-white/[0.06] text-zinc-400"
            )}
          >
            {ledgerData.total}
          </span>
        </button>

        {role === "ADMIN_PUSAT" && (
          <button
            type="button"
            onClick={() => setActiveTab("AUDIT")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150",
              activeTab === "AUDIT"
                ? "bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            )}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Audit Adjustment Toko (ADJ-TOKO)</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-mono tabular-nums",
                activeTab === "AUDIT"
                  ? "bg-zinc-950/20 text-zinc-950 font-bold"
                  : "bg-white/[0.06] text-zinc-400"
              )}
            >
              {auditData.total}
            </span>
          </button>
        )}
      </div>

      {/* Tab 1: All Mutations */}
      {activeTab === "LEDGER" && (
        <MutationLedgerTable
          initialData={ledgerData}
          role={role}
          onRefresh={handleRefresh}
        />
      )}

      {/* Tab 2: Audit Adjustments */}
      {activeTab === "AUDIT" && role === "ADMIN_PUSAT" && (
        <AuditAdjustmentTable initialData={auditData} />
      )}
    </div>
  );
}
