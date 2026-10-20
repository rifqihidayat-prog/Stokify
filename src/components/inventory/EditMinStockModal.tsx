"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Boxes, Store, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { updateProductMinStock } from "@/actions/stock";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

export interface MinStockEditableItem {
  id: string;
  sku?: string | null;
  name: string;
  unit: string;
  category?: string;
  current_stock?: number;
  min_stock_central: number;
  min_stock_store: number;
}

interface EditMinStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MinStockEditableItem | null;
  onSuccess?: () => void;
}

export function EditMinStockModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: EditMinStockModalProps) {
  const router = useRouter();
  const [minCentral, setMinCentral] = useState<number>(10);
  const [minStore, setMinStore] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (item) {
      setMinCentral(item.min_stock_central ?? 10);
      setMinStore(item.min_stock_store ?? 5);
      setToastMsg(null);
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (minCentral < 0 || !Number.isInteger(minCentral)) {
      setToastMsg({ ok: false, text: "Batas minimum stok pusat harus berupa bilangan bulat >= 0." });
      return;
    }

    if (minStore < 0 || !Number.isInteger(minStore)) {
      setToastMsg({ ok: false, text: "Batas minimum stok toko harus berupa bilangan bulat >= 0." });
      return;
    }

    setIsSubmitting(true);
    setToastMsg(null);

    const res = await updateProductMinStock({
      productId: item.id,
      minStockCentral: minCentral,
      minStockStore: minStore,
    });

    setIsSubmitting(false);

    if (res.ok) {
      setToastMsg({ ok: true, text: res.message });
      onSuccess?.();
      router.refresh();
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setToastMsg({ ok: false, text: res.message });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ubah Batas Minimum Stok"
      description="Konfigurasi ambang batas stok aman untuk Gudang Pusat dan Toko Cabang."
    >
      {toastMsg && (
        <div className="mb-4">
          <Toast message={toastMsg.text} type={toastMsg.ok ? "success" : "error"} />
        </div>
      )}

      {/* Ringkasan Barang Terpilih */}
      <div className="mb-5 rounded-2xl border border-white/[0.08] bg-[#0C0F15] p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sky-400 font-bold text-xs bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
            [{item.sku || "NO-SKU"}]
          </span>
          <span className="text-xs text-zinc-400">
            Satuan: <strong className="text-zinc-200">{item.unit}</strong>
          </span>
        </div>
        <div className="font-semibold text-sm sm:text-base text-zinc-100">{item.name}</div>
        <div className="flex items-center justify-between pt-2 text-xs text-zinc-400 border-t border-white/[0.06]">
          <span>Kategori: <strong className="text-zinc-300">{item.category || "DAILY_CONSUMABLE"}</strong></span>
          {item.current_stock !== undefined && (
            <span>
              Sisa Fisik Pusat:{" "}
              <strong className={item.current_stock <= (item.min_stock_central || 0) ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                {item.current_stock} {item.unit}
              </strong>
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input 1: Min Stok Pusat */}
        <div className="rounded-xl border border-white/[0.06] bg-[#141924]/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-200">
              <Boxes className="h-4 w-4 text-amber-400" />
              <span>Minimum Stok Gudang Pusat</span>
            </label>
            <span className="text-[11px] font-mono text-amber-400/90 font-medium">
              Ambang Kritis / PR
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="1"
              value={minCentral}
              onChange={(e) => setMinCentral(Math.max(0, parseInt(e.target.value) || 0))}
              required
              className="flex-1 rounded-xl border border-white/[0.1] bg-[#0C0F15] px-3.5 py-2.5 font-mono text-sm sm:text-base font-bold text-zinc-100 focus:border-amber-400 focus:outline-none transition-colors"
            />
            <span className="font-medium text-xs sm:text-sm text-zinc-400 px-2">
              {item.unit}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Jika sisa stok fisik pusat $\le$ angka ini, sistem otomatis memicu status <strong>🔴 Belum Dibuat PR</strong> pada dashboard dan kartu stok.
          </p>
        </div>

        {/* Input 2: Min Stok Toko */}
        <div className="rounded-xl border border-white/[0.06] bg-[#141924]/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-200">
              <Store className="h-4 w-4 text-sky-400" />
              <span>Minimum Stok Toko Cabang</span>
            </label>
            <span className="text-[11px] font-mono text-sky-400/90 font-medium">
              Standar Toko
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="1"
              value={minStore}
              onChange={(e) => setMinStore(Math.max(0, parseInt(e.target.value) || 0))}
              required
              className="flex-1 rounded-xl border border-white/[0.1] bg-[#0C0F15] px-3.5 py-2.5 font-mono text-sm sm:text-base font-bold text-zinc-100 focus:border-sky-400 focus:outline-none transition-colors"
            />
            <span className="font-medium text-xs sm:text-sm text-zinc-400 px-2">
              {item.unit}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Batas peringatan stok menipis pada kartu stok gerai cabang. Toko cabang akan ditandai kritis jika stoknya di bawah batas ini.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs border-white/[0.08]"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            className="text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
