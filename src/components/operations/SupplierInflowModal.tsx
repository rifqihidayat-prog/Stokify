"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Trash2,
  PackageCheck,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Autocomplete, type AutocompleteItem } from "@/components/ui/Autocomplete";
import { createSupplierInflow } from "@/actions/mutations";

interface SupplierInflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: AutocompleteItem[];
  initialItemId?: string;
  onSuccess?: () => void;
}

interface InflowRow {
  id: string;
  itemId: string;
  qty: number | "";
}

export function SupplierInflowModal({
  isOpen,
  onClose,
  products,
  initialItemId,
  onSuccess,
}: SupplierInflowModalProps) {
  const [supplierName, setSupplierName] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<InflowRow[]>([
    { id: "1", itemId: "", qty: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSupplierName("");
      setNotes("");
      setError(null);
      if (initialItemId) {
        setRows([{ id: "1", itemId: initialItemId, qty: "" }]);
      } else {
        setRows([{ id: "1", itemId: "", qty: "" }]);
      }
    }
  }, [isOpen, initialItemId]);

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      { id: Math.random().toString(), itemId: "", qty: "" },
    ]);
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

    if (!supplierName.trim()) {
      setError("Nama supplier / vendor wajib diisi.");
      return;
    }

    const validRows = rows.filter((r) => r.itemId && Number(r.qty) > 0);
    if (validRows.length === 0) {
      setError("Pilih minimal 1 barang dan masukkan Qty kedatangan yang valid (> 0).");
      return;
    }

    setIsLoading(true);
    const res = await createSupplierInflow({
      supplierName: supplierName.trim(),
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
      onClose();
      onSuccess?.();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Penerimaan Barang Datang (Restock Gudang Pusat)"
      description="Catat barang masuk dari vendor/supplier untuk menambah saldo fisik stok pusat."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Informasi Vendor & No. Dokumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Nama Supplier / Vendor <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Contoh: PT Thermal Paper Nusantara, CV Mitra Jaya..."
              className="w-full rounded-xl border border-white/[0.08] bg-[#0A0D14] px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              No. PO / Faktur / Surat Jalan Vendor
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: PO-2026/10/091 atau DO-Vendor-881"
              className="w-full rounded-xl border border-white/[0.08] bg-[#0A0D14] px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
        </div>

        {/* Daftar Barang Datang */}
        <div className="space-y-3 border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Daftar Barang yang Diterima ({rows.length} Baris)
            </label>
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Tambah Baris Barang</span>
            </button>
          </div>

          <div className="space-y-3">
            {rows.map((row, idx) => {
              const selectedProduct = products.find((p) => p.id === row.itemId);
              const currentStock = selectedProduct?.current_stock ?? 0;
              const incomingQty = Number(row.qty) || 0;
              const stockAfter = currentStock + incomingQty;

              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/[0.06] bg-[#0A0D14] p-3.5 space-y-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-xs font-mono text-zinc-400 mt-1">
                      {idx + 1}
                    </span>

                    <div className="flex-1 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3">
                      {/* Autocomplete Master Barang */}
                      <div className="sm:col-span-8">
                        <Autocomplete
                          label=""
                          required
                          items={products}
                          value={row.itemId}
                          onChange={(id) => handleRowChange(row.id, "itemId", id)}
                          placeholder="Pilih master barang yang tiba..."
                        />
                      </div>

                      {/* Input Qty */}
                      <div className="sm:col-span-4">
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            required
                            value={row.qty}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "qty",
                                e.target.value ? parseInt(e.target.value, 10) : ""
                              )
                            }
                            placeholder="Qty datang..."
                            className="w-full rounded-xl border border-white/[0.08] bg-[#121620] px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20 tabular-nums font-mono font-semibold"
                          />
                          {selectedProduct && (
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-zinc-400">
                              {selectedProduct.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors shrink-0 mt-0.5"
                        title="Hapus baris"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Stock Calculation Preview Pill */}
                  {selectedProduct && (
                    <div className="ml-9 flex flex-wrap items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-1.5 text-xs text-zinc-400">
                      <span>Stok Saat Ini:</span>
                      <span className="font-mono font-bold text-zinc-200">
                        {currentStock} {selectedProduct.unit}
                      </span>
                      {incomingQty > 0 && (
                        <>
                          <ArrowRight className="h-3 w-3 text-amber-400" />
                          <span className="text-emerald-400 font-semibold font-mono">
                            +{incomingQty} {selectedProduct.unit}
                          </span>
                          <span className="text-zinc-600">|</span>
                          <span>Stok Akhir Menjadi:</span>
                          <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {stockAfter} {selectedProduct.unit}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold hover:brightness-110 shadow-md shadow-amber-500/20"
          >
            <PackageCheck className="h-4 w-4 mr-1.5 stroke-[2.5]" />
            {isLoading ? "Menyimpan Stok Masuk..." : "Simpan Penambahan Stok"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
