"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { createPurchaseRequest } from "@/actions/purchase_requests";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import type { CentralStockCardItem } from "@/actions/mutations";

interface CreatePRModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CentralStockCardItem | null;
}

export function CreatePRModal({ isOpen, onClose, item }: CreatePRModalProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState<number>(10);
  const [supplierName, setSupplierName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Hitung rekomendasi order saat modal terbuka untuk item tertentu
  useEffect(() => {
    if (item) {
      const suggested = Math.max(
        item.min_stock_central * 2 - item.sisa_stok_realtime,
        item.min_stock_central,
        1
      );
      setQuantity(suggested);
      setSupplierName("");
      setNotes("");
      setToastMsg(null);
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setToastMsg({ ok: false, text: "Jumlah pengadaan harus lebih dari 0." });
      return;
    }

    setIsSubmitting(true);
    setToastMsg(null);

    const res = await createPurchaseRequest({
      productId: item.id,
      quantity,
      supplierName: supplierName.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.ok) {
      setToastMsg({ ok: true, text: res.message });
      router.refresh();
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setToastMsg({ ok: false, text: res.message });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Purchase Request (PR) ke Vendor"
      description="Catat pengajuan order pengadaan agar stok barang segera di-restock."
    >
      {toastMsg && (
        <div className="mb-4">
          <Toast message={toastMsg.text} type={toastMsg.ok ? "success" : "error"} />
        </div>
      )}

      {/* Info Ringkas Barang */}
      <div className="mb-4 rounded-xl border border-white/[0.08] bg-[#0C0F15] p-3 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sky-400 font-bold">[{item.sku}]</span>
          <span className="text-zinc-400">Satuan: <strong className="text-zinc-200">{item.unit}</strong></span>
        </div>
        <div className="font-semibold text-sm text-zinc-100">{item.name}</div>
        <div className="flex items-center gap-4 pt-1 text-[11px] text-zinc-400 border-t border-white/[0.04]">
          <div>
            Sisa Fisik:{" "}
            <span
              className={
                item.sisa_stok_realtime <= 0
                  ? "text-rose-400 font-bold"
                  : "text-amber-400 font-bold"
              }
            >
              {item.sisa_stok_realtime} {item.unit}
            </span>
          </div>
          <div>
            Min. Stok Aman:{" "}
            <span className="text-zinc-300 font-bold">
              {item.min_stock_central} {item.unit}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Jumlah Order */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Jumlah Pengadaan / Order <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-amber-400/90 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Rekomendasi Aman: {Math.max(item.min_stock_central * 2 - item.sisa_stok_realtime, item.min_stock_central, 1)} {item.unit}
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              min={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value, 10) : 0)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0C0F15] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 font-mono focus:border-amber-400 focus:outline-none transition-colors"
            />
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-zinc-400">
              {item.unit}
            </span>
          </div>
        </div>

        {/* Input Nama Vendor / Supplier Target */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Nama Supplier / Vendor (Opsional)
          </label>
          <input
            type="text"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="Contoh: PT Surya Jaya, Toko Plastik Maju..."
            className="w-full rounded-xl border border-white/[0.08] bg-[#0C0F15] px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Input Catatan PR */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Catatan Tambahan (Opsional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Order urgent untuk persiapan pesanan toko Surabaya..."
            className="w-full rounded-xl border border-white/[0.08] bg-[#0C0F15] px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-300/90 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <span>
            Setelah PR dibuat, status barang di kartu stok otomatis berubah menjadi <strong>&quot;Sudah Dibuat PR&quot;</strong> sehingga tim tidak lupa atau melakukan order ganda.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="text-xs px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold"
          >
            <ClipboardList className="h-4 w-4 mr-1.5" />
            Terbitkan PR Sekarang
          </Button>
        </div>
      </form>
    </Modal>
  );
}
