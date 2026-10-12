"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Search,
  Trash2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Truck,
  Send,
  Moon,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "./PaginationControls";
import { DatePeriodFilter } from "./DatePeriodFilter";
import { rollbackMutation, type MutationLedgerItem } from "@/actions/mutations";
import { formatDate, cn, type Role } from "@/lib/utils";

interface MutationLedgerTableProps {
  initialData: {
    data: MutationLedgerItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  role: Role;
  onRefresh?: () => void;
}

export function MutationLedgerTable({
  initialData,
  role,
  onRefresh,
}: MutationLedgerTableProps) {
  const [items, setItems] = useState<MutationLedgerItem[]>(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const pageSize = 20;

  // Filters
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  // Rollback Modal State
  const [rollbackItem, setRollbackItem] = useState<MutationLedgerItem | null>(null);
  const [isRollbacking, setIsRollbacking] = useState(false);
  const [rollbackMsg, setRollbackMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // In-memory filtered data for the current view
  const filteredData = items.filter((item) => {
    // Type filter
    if (selectedType !== "ALL") {
      if (selectedType === "IN-SUPPLIER" && item.type !== "IN-SUPPLIER") return false;
      if (selectedType === "SJ" && item.type !== "SJ") return false;
      if (selectedType === "CLOSING" && item.type !== "CLOSING") return false;
      if (selectedType === "ADJ-TOKO" && item.type !== "ADJ-TOKO") return false;
      if (selectedType === "ADJ-PUSAT" && item.type !== "ADJ-PUSAT") return false;
    }

    // Month & Year Filter
    const d = new Date(item.transaction_date);
    if (selectedYear && d.getFullYear() !== selectedYear) return false;
    if (selectedMonth && d.getMonth() + 1 !== selectedMonth) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSku = item.item_sku.toLowerCase().includes(q);
      const matchName = item.item_name.toLowerCase().includes(q);
      const matchRef = item.reference_no.toLowerCase().includes(q);
      const matchSender = item.sender_location.toLowerCase().includes(q);
      const matchReceiver = item.receiver_location.toLowerCase().includes(q);
      if (!matchSku && !matchName && !matchRef && !matchSender && !matchReceiver) return false;
    }

    return true;
  });

  // Client pagination on filtered results
  const paginatedTotal = filteredData.length;
  const paginatedTotalPages = Math.max(1, Math.ceil(paginatedTotal / pageSize));
  const pageIndex = Math.min(Math.max(1, currentPage), paginatedTotalPages);
  const paginatedRows = filteredData.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

  const handleRollbackConfirm = async () => {
    if (!rollbackItem) return;

    setIsRollbacking(true);
    setRollbackMsg(null);
    const res = await rollbackMutation(rollbackItem.id);
    setIsRollbacking(false);

    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== rollbackItem.id));
      setRollbackItem(null);
      onRefresh?.();
    } else {
      setRollbackMsg({ ok: false, text: res.message });
    }
  };

  const getTypeBadge = (type: MutationLedgerItem["type"]) => {
    switch (type) {
      case "IN-SUPPLIER":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            IN-SUPPLIER
          </span>
        );
      case "SJ":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-300 border border-sky-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            SURAT JALAN
          </span>
        );
      case "CLOSING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-300 border border-rose-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            CLOSING TOKO
          </span>
        );
      case "ADJ-TOKO":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            ADJ-TOKO
          </span>
        );
      case "ADJ-PUSAT":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-300 border border-purple-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            ADJ-PUSAT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold text-zinc-300 border border-white/[0.08]">
            MUTASI
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Header Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#121620] p-3 sm:p-4 rounded-2xl border border-white/[0.06] shadow-elevated-card">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari no. ref, nama barang, pengirim, penerima..."
              className="w-full rounded-xl border border-white/[0.08] bg-[#0C0F15] py-2 pl-10 pr-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-white/[0.08] bg-[#0C0F15] px-3.5 py-2 text-xs sm:text-sm text-zinc-200 font-medium focus:border-amber-400 focus:outline-none transition-colors cursor-pointer"
          >
            <option value="ALL">Semua Jenis Transaksi</option>
            <option value="IN-SUPPLIER">📦 Inflow Supplier</option>
            <option value="SJ">🚚 Surat Jalan (Pusat ke Toko)</option>
            <option value="CLOSING">🌙 Closing Harian Toko</option>
            <option value="ADJ-TOKO">⚖️ Adjustment Toko</option>
            <option value="ADJ-PUSAT">⚖️ Adjustment Pusat</option>
          </select>
        </div>

        {/* Date Period Filter Component */}
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

      {/* Main Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#121620] shadow-elevated-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#0C0F15]/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4 font-mono w-40">No. Referensi</th>
                <th className="py-3.5 px-4 w-32">Waktu Transaksi</th>
                <th className="py-3.5 px-4 w-36">Tipe Mutasi</th>
                <th className="py-3.5 px-4">Barang & SKU</th>
                <th className="py-3.5 px-4 text-right font-mono w-24">Qty</th>
                <th className="py-3.5 px-4">Pengirim &rarr; Penerima</th>
                <th className="py-3.5 px-4">Keterangan / Catatan</th>
                {role === "ADMIN_PUSAT" && (
                  <th className="py-3.5 px-4 text-center w-24">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-medium">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={role === "ADMIN_PUSAT" ? 8 : 7}
                    className="py-12 text-center text-zinc-500 text-sm"
                  >
                    Tidak ada catatan mutasi transaksi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* No. Referensi */}
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-amber-400 tabular-nums">
                      {log.reference_no}
                    </td>

                    {/* Waktu Transaksi */}
                    <td className="py-3.5 px-4 text-xs text-zinc-400 font-mono tabular-nums">
                      {formatDate(log.transaction_date)}
                    </td>

                    {/* Tipe Mutasi */}
                    <td className="py-3.5 px-4">{getTypeBadge(log.type)}</td>

                    {/* Barang & SKU */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-sky-400 tabular-nums">
                          [{log.item_sku}]
                        </span>
                        <span className="font-semibold text-zinc-100">
                          {log.item_name}
                        </span>
                      </div>
                    </td>

                    {/* Qty */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-100 tabular-nums">
                      {log.qty} <span className="text-xs text-zinc-400 font-normal">{log.item_unit}</span>
                    </td>

                    {/* Pengirim -> Penerima */}
                    <td className="py-3.5 px-4 text-xs text-zinc-300">
                      <span className="text-zinc-400">{log.sender_location}</span>
                      <span className="text-amber-400 mx-1.5">&rarr;</span>
                      <span className="font-semibold text-zinc-100">
                        {log.receiver_location}
                      </span>
                    </td>

                    {/* Catatan */}
                    <td className="py-3.5 px-4 text-xs text-zinc-400">
                      {log.notes || "-"}
                    </td>

                    {/* Admin Rollback Action */}
                    {role === "ADMIN_PUSAT" && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setRollbackItem(log)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
                          title="Rollback / Hapus Transaksi Ini"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 20 Item Pagination Controls */}
        <PaginationControls
          currentPage={pageIndex}
          totalPages={paginatedTotalPages}
          totalItems={paginatedTotal}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </div>

      {/* Confirmation Modal for Rollback */}
      <Modal
        isOpen={!!rollbackItem}
        onClose={() => {
          if (!isRollbacking) setRollbackItem(null);
        }}
        title="Konfirmasi Rollback Transaksi"
        description="Transaksi ini akan dihapus dari buku besar ledger dan saldo stok terkait akan dikembalikan ke kondisi sebelumnya."
        size="md"
      >
        {rollbackItem && (
          <div className="space-y-4">
            {rollbackMsg && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{rollbackMsg.text}</span>
              </div>
            )}

            <div className="rounded-xl border border-zinc-800 bg-[#181B22] p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Nomor Referensi:</span>
                <span className="font-mono font-bold text-amber-400">
                  {rollbackItem.reference_no}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Barang:</span>
                <span className="font-semibold text-zinc-200">
                  {rollbackItem.item_name} ({rollbackItem.qty} {rollbackItem.item_unit})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Alur Lokasi:</span>
                <span className="text-zinc-200">
                  {rollbackItem.sender_location} &rarr; {rollbackItem.receiver_location}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Tanggal:</span>
                <span className="text-zinc-300">
                  {formatDate(rollbackItem.transaction_date)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRollbackItem(null)}
                disabled={isRollbacking}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={isRollbacking}
                onClick={handleRollbackConfirm}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Ya, Rollback Transaksi
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
