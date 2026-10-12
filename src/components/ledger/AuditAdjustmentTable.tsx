"use client";

import React, { useState } from "react";
import { Scale, Search, ShieldAlert, AlertCircle, FileSpreadsheet } from "lucide-react";
import { PaginationControls } from "./PaginationControls";
import { DatePeriodFilter } from "./DatePeriodFilter";
import type { MutationLedgerItem } from "@/actions/mutations";
import { formatDate } from "@/lib/utils";

interface AuditAdjustmentTableProps {
  initialData: {
    data: MutationLedgerItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function AuditAdjustmentTable({ initialData }: AuditAdjustmentTableProps) {
  const [items, setItems] = useState<MutationLedgerItem[]>(initialData.data);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const pageSize = 20;

  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  const filtered = items.filter((item) => {
    // Only ADJ-TOKO
    if (item.type !== "ADJ-TOKO" && !item.reference_no.startsWith("ADJ-TOKO")) return false;

    // Date
    const d = new Date(item.transaction_date);
    if (selectedYear && d.getFullYear() !== selectedYear) return false;
    if (selectedMonth && d.getMonth() + 1 !== selectedMonth) return false;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchStore = item.sender_location.toLowerCase().includes(q);
      const matchName = item.item_name.toLowerCase().includes(q);
      const matchSku = item.item_sku.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q) ?? false;
      const matchRef = item.reference_no.toLowerCase().includes(q);
      if (!matchStore && !matchName && !matchSku && !matchNotes && !matchRef) return false;
    }

    return true;
  });

  const paginatedTotal = filtered.length;
  const paginatedTotalPages = Math.max(1, Math.ceil(paginatedTotal / pageSize));
  const pageIndex = Math.min(Math.max(1, currentPage), paginatedTotalPages);
  const paginatedRows = filtered.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

  return (
    <div className="space-y-4">
      {/* Header Info Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-[#141824] to-[#121620] p-4 text-xs text-zinc-300 flex items-start gap-3.5 shadow-elevated-card">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-zinc-100">
            Audit Trail & Log Riwayat Penyesuaian Toko (ADJ-TOKO)
          </h4>
          <p className="text-zinc-400 mt-1 leading-relaxed">
            Tab pengawasan khusus bagi Admin Pusat untuk mengaudit setiap penyesuaian selisih opname fisik di cabang beserta alasan audit wajib guna menjaga integritas stok.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121620] p-3 sm:p-4 rounded-2xl border border-white/[0.06] shadow-elevated-card">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama toko, kode SKU, alasan audit adjustment..."
            className="w-full rounded-xl border border-white/[0.08] bg-[#0C0F15] py-2 pl-10 pr-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>

        <DatePeriodFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onChange={(m, y) => {
            setSelectedMonth(m);
            setSelectedYear(y);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Audit Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#121620] shadow-elevated-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#0C0F15]/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4 font-mono w-40">No. Ref Audit</th>
                <th className="py-3.5 px-4 w-32">Waktu Transaksi</th>
                <th className="py-3.5 px-4 w-44">Nama Toko Cabang</th>
                <th className="py-3.5 px-4">Barang & SKU</th>
                <th className="py-3.5 px-4 text-right font-mono w-28">Qty Adjusted</th>
                <th className="py-3.5 px-4">Alasan / Catatan Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-medium">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 text-sm">
                    Tidak ditemukan riwayat adjustment toko pada periode ini.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((item) => {
                  const isPlus = item.qty > 0;

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-amber-400 tabular-nums">
                        {item.reference_no}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-400 font-mono tabular-nums">
                        {formatDate(item.transaction_date)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-200">
                        {item.sender_location}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-sky-400 tabular-nums">
                            [{item.item_sku}]
                          </span>
                          <span className="font-medium text-zinc-100">{item.item_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                        <span
                          className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-mono font-bold ${
                            isPlus
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                          }`}
                        >
                          {isPlus ? `+${item.qty}` : item.qty} {item.item_unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-300">
                        <span className="inline-block rounded-md bg-[#0C0F15] px-2.5 py-1 border border-white/[0.06] text-zinc-200">
                          {item.notes || "Tanpa keterangan"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          currentPage={pageIndex}
          totalPages={paginatedTotalPages}
          totalItems={paginatedTotal}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </div>
    </div>
  );
}
