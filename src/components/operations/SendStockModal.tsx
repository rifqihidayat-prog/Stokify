"use client";

import React, { useState } from "react";
import { Send, Plus, Trash2, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Autocomplete, type AutocompleteItem } from "@/components/ui/Autocomplete";
import { createStoreTransfer } from "@/actions/mutations";
import { PrintSuratJalanModal, type SuratJalanData } from "./PrintSuratJalanModal";

interface SendStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: AutocompleteItem[];
  stores?: string[];
  onSuccess?: () => void;
}

interface ItemRow {
  id: string; // random local id
  itemId: string;
  qty: number | "";
}

const DEFAULT_STORES = ["Toko Cabang Surabaya", "Toko Cabang Bandung", "Toko Cabang Jakarta"];

export function SendStockModal({
  isOpen,
  onClose,
  products,
  stores = DEFAULT_STORES,
  onSuccess,
}: SendStockModalProps) {
  const [storeName, setStoreName] = useState(stores[0] || "Toko Cabang Surabaya");
  const [rows, setRows] = useState<ItemRow[]>([{ id: "1", itemId: "", qty: "" }]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for Print SJ Modal
  const [printData, setPrintData] = useState<SuratJalanData | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const handleAddRow = () => {
    setRows((prev) => [...prev, { id: Math.random().toString(), itemId: "", qty: "" }]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRowChange = (id: string, field: "itemId" | "qty", value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!storeName) {
      setError("Pilih toko tujuan pengiriman.");
      return;
    }

    const validRows = rows.filter((r) => r.itemId && Number(r.qty) > 0);
    if (validRows.length === 0) {
      setError("Isi minimal 1 baris barang dengan Qty yang valid.");
      return;
    }

    setIsLoading(true);
    const res = await createStoreTransfer({
      storeName,
      items: validRows.map((r) => ({
        itemId: r.itemId,
        qty: Number(r.qty),
      })),
      notes: notes.trim() || undefined,
    });
    setIsLoading(false);

    if (!res.ok) {
      setError(res.message);
    } else {
      // Prepare print data
      const sjItems = validRows.map((r) => {
        const prod = products.find((p) => p.id === r.itemId);
        return {
          sku: prod?.sku || "-",
          name: prod?.name || "Item",
          qty: Number(r.qty),
          unit: prod?.unit || "Pcs",
        };
      });

      setPrintData({
        referenceNo: res.refNo || "SJ-BARU",
        storeName,
        date: new Date(),
        items: sjItems,
        notes: notes || undefined,
      });

      // Reset
      setRows([{ id: "1", itemId: "", qty: "" }]);
      setNotes("");
      onClose();
      setIsPrintOpen(true);
      onSuccess?.();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Kirim Stok ke Toko (Multi-Item)"
        description="Penerbitan Surat Jalan (SJ) & transfer barang dari Gudang Pusat ke Toko Cabang."
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Toko Tujuan & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Toko Cabang Tujuan <span className="text-rose-400">*</span>
              </label>
              <select
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-[#15181E] px-3 py-2.5 text-sm text-zinc-100 transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {stores.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Catatan Pengiriman / Alokasi
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Alokasi mingguan toko..."
                className="w-full rounded-xl border border-zinc-800 bg-[#15181E] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Multi-Item Table Container */}
          <div className="rounded-xl border border-zinc-800/90 bg-[#13151A] p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Daftar Barang yang Dikirim
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="text-xs py-1 h-7"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Tambah Baris
              </Button>
            </div>

            <div className="space-y-3">
              {rows.map((row, idx) => {
                const selectedProd = products.find((p) => p.id === row.itemId);

                return (
                  <div
                    key={row.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-lg bg-[#181B22] p-2.5 border border-zinc-800/60"
                  >
                    <span className="text-xs font-mono font-bold text-zinc-500 w-5 text-center">
                      #{idx + 1}
                    </span>

                    {/* Autocomplete Input */}
                    <div className="flex-1 w-full">
                      <Autocomplete
                        items={products}
                        value={row.itemId}
                        onChange={(id) => handleRowChange(row.id, "itemId", id)}
                        placeholder="Ketik kode atau nama barang..."
                      />
                    </div>

                    {/* Qty Input */}
                    <div className="w-full sm:w-36 flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={1}
                          max={selectedProd ? selectedProd.current_stock : undefined}
                          required
                          value={row.qty}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "qty",
                              e.target.value ? parseInt(e.target.value, 10) : ""
                            )
                          }
                          placeholder="Qty..."
                          className="w-full rounded-xl border border-zinc-800 bg-[#15181E] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500 focus:outline-none"
                        />
                        {selectedProd && (
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-[11px] font-semibold text-zinc-400">
                            {selectedProd.unit}
                          </span>
                        )}
                      </div>

                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="rounded-lg p-2 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                          title="Hapus baris"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={isLoading}>
              <Send className="h-4 w-4 mr-1.5" />
              Proses & Terbitkan Surat Jalan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Direct Surat Jalan Preview & Print Modal */}
      <PrintSuratJalanModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        data={printData}
      />
    </>
  );
}
