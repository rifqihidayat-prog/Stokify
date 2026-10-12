"use client";

import React, { useState } from "react";
import { Scale, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Autocomplete, type AutocompleteItem } from "@/components/ui/Autocomplete";
import { createCentralAdjustment } from "@/actions/mutations";

interface CentralAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: AutocompleteItem[];
  onSuccess?: () => void;
}

export function CentralAdjustmentModal({
  isOpen,
  onClose,
  products,
  onSuccess,
}: CentralAdjustmentModalProps) {
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState<number | "">("");
  const [adjustmentType, setAdjustmentType] = useState<"PLUS" | "MINUS">("PLUS");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProd = products.find((p) => p.id === itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!itemId) {
      setError("Silakan pilih master barang.");
      return;
    }
    if (!qty || Number(qty) === 0) {
      setError("Masukkan nilai penyesuaian yang valid.");
      return;
    }
    if (!reason.trim()) {
      setError("Alasan penyesuaian stok pusat wajib diisi.");
      return;
    }

    const finalQty = adjustmentType === "PLUS" ? Math.abs(Number(qty)) : -Math.abs(Number(qty));

    setIsLoading(true);
    const res = await createCentralAdjustment({
      itemId,
      qtyAdjusted: finalQty,
      reason: reason.trim(),
    });
    setIsLoading(false);

    if (!res.ok) {
      setError(res.message);
    } else {
      setItemId("");
      setQty("");
      setReason("");
      onClose();
      onSuccess?.();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Adjustment Gudang Pusat"
      description="Penyesuaian saldo fisik stok di Gudang Utama (ADJ-PUSAT)."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Autocomplete
            label="Pilih Master Barang"
            required
            items={products}
            value={itemId}
            onChange={(id) => setItemId(id)}
            placeholder="Cari SKU atau nama barang..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Arah Penyesuaian <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdjustmentType("PLUS")}
              className={`rounded-xl border p-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                adjustmentType === "PLUS"
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                  : "border-zinc-800 bg-[#15181E] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>+ Tambah Stok Pusat</span>
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType("MINUS")}
              className={`rounded-xl border p-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                adjustmentType === "MINUS"
                  ? "border-rose-500 bg-rose-500/15 text-rose-400"
                  : "border-zinc-800 bg-[#15181E] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>- Koreksi Kurang Stok</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Jumlah Unit Penyesuaian <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              required
              value={qty}
              onChange={(e) => setQty(e.target.value ? parseInt(e.target.value, 10) : "")}
              placeholder="Jumlah unit..."
              className="w-full rounded-xl border border-zinc-800 bg-[#15181E] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500 focus:outline-none"
            />
            {selectedProd && (
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-zinc-400">
                {selectedProd.unit}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Alasan Adjustment Pusat <span className="text-rose-400">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Initial stock reconciliation, selisih kemasan pecah/rusak di gudang..."
            className="w-full rounded-xl border border-zinc-800 bg-[#15181E] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            <Scale className="h-4 w-4 mr-1.5" />
            Simpan Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
