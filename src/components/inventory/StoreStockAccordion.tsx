"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Store, Moon, Scale, PackagePlus, AlertCircle, CheckCircle2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EditMinStockModal, type MinStockEditableItem } from "./EditMinStockModal";
import type { StoreStockGroup } from "@/actions/mutations";
import type { Role } from "@/lib/utils";

interface StoreStockAccordionProps {
  stores: StoreStockGroup[];
  role: Role;
  onOpenClosing?: (storeName: string) => void;
  onOpenAdjustment?: (storeName: string) => void;
  onOpenRequest?: (storeName: string) => void;
}

export function StoreStockAccordion({
  stores,
  role,
  onOpenClosing,
  onOpenAdjustment,
  onOpenRequest,
}: StoreStockAccordionProps) {
  const [editMinStockItem, setEditMinStockItem] = useState<MinStockEditableItem | null>(null);

  // Untuk Admin Pusat: accordion tertutup secara default.
  // Untuk Staf Toko (hanya toko miliknya sendiri): otomatis terbuka agar stok langsung terlihat.
  const [openStores, setOpenStores] = useState<Record<string, boolean>>(() => {
    if ((role === "STAF_TOKO" || stores.length === 1) && stores[0]) {
      return { [stores[0].store_name]: true };
    }
    return {};
  });

  const toggleStore = (storeName: string) => {
    setOpenStores((prev) => ({
      ...prev,
      [storeName]: !prev[storeName],
    }));
  };

  if (stores.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-[#15181E] p-8 text-center text-zinc-400">
        <Store className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
        <p className="text-sm font-medium text-zinc-300">
          {role === "STAF_TOKO"
            ? "Belum ada data stok fisik untuk toko Anda"
            : "Belum ada data stok toko cabang"}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          {role === "STAF_TOKO"
            ? "Stok fisik akan bertambah otomatis saat barang dikirim dari Gudang Pusat melalui Surat Jalan."
            : "Kirim barang melalui menu Kirim Stok untuk memulai alokasi cabang."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stores.map((store) => {
        const isOpen = !!openStores[store.store_name];

        return (
          <div
            key={store.store_name}
            className="rounded-2xl border border-white/[0.07] bg-[#121620] shadow-elevated-card overflow-hidden transition-all duration-200"
          >
            {/* Accordion Header Bar (Clickable) */}
            <div
              onClick={() => toggleStore(store.store_name)}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 cursor-pointer bg-[#141924] hover:bg-[#181E2B] transition-colors select-none"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/25">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold tracking-tight text-zinc-100">
                      {store.store_name}
                    </h3>
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-zinc-300 border border-white/[0.08] font-mono tabular-nums">
                      {store.total_items} Item Terdaftar
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    {store.low_stock_count > 0 ? (
                      <span className="text-rose-300 font-semibold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-subtle-pulse" />
                        {store.low_stock_count} item di bawah batas minimum toko
                      </span>
                    ) : (
                      <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Kondisi stok fisik toko terpantau aman
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons & Expand Toggle */}
              <div
                className="flex items-center gap-2 self-end sm:self-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Store Action Buttons */}
                {onOpenClosing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenClosing(store.store_name)}
                    className="text-xs py-1.5 h-8 border-white/[0.08]"
                    title="Input Closing Pemakaian Harian"
                  >
                    <Moon className="h-3.5 w-3.5 mr-1 text-amber-400" />
                    <span className="hidden sm:inline">Closing Harian</span>
                  </Button>
                )}

                {onOpenAdjustment && role === "ADMIN_PUSAT" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenAdjustment(store.store_name)}
                    className="text-xs py-1.5 h-8 border-white/[0.08]"
                    title="Adjustment Selisih Opname Fisik (Admin Pusat)"
                  >
                    <Scale className="h-3.5 w-3.5 mr-1 text-sky-400" />
                    <span className="hidden sm:inline">Opname Fisik</span>
                  </Button>
                )}

                {onOpenRequest && role === "STAF_TOKO" && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenRequest(store.store_name)}
                    className="text-xs py-1.5 h-8"
                  >
                    <PackagePlus className="h-3.5 w-3.5 mr-1 stroke-[2.5]" />
                    <span className="hidden sm:inline">Minta Barang</span>
                  </Button>
                )}

                {/* Chevron Trigger */}
                <button
                  type="button"
                  onClick={() => toggleStore(store.store_name)}
                  className="rounded-lg border border-white/[0.08] bg-[#0C0F15] p-1.5 text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors ml-1"
                  title={isOpen ? "Ciutkan Accordion" : "Buka Detail Stok Toko"}
                >
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Accordion Body (Table) */}
            {isOpen && (
              <div className="border-t border-white/[0.06] bg-[#0C0F15]/40">
                {store.items.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500">
                    Belum ada riwayat mutasi stok untuk toko ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-[#0C0F15]/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                          <th className="py-3.5 px-4 font-mono w-28">Kode SKU</th>
                          <th className="py-3.5 px-4">Nama Barang</th>
                          <th className="py-3.5 px-4 text-right font-mono">
                            Stok Masuk (+)
                          </th>
                          <th className="py-3.5 px-4 text-right font-mono">
                            Stok Keluar (-)
                          </th>
                          <th className="py-3.5 px-4 text-right font-mono">
                            Sisa Fisik Toko
                          </th>
                          <th className="py-3.5 px-4 text-right font-mono">
                            Min. Toko
                          </th>
                          <th className="py-3.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] font-medium">
                        {store.items.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="py-3.5 px-4 font-mono text-xs font-semibold text-sky-400 tabular-nums">
                              {item.sku}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-zinc-100">
                              {item.name}
                              <span className="block text-xs font-normal text-zinc-400 mt-0.5">
                                Satuan: {item.unit}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-emerald-400 tabular-nums">
                              +{item.stok_masuk} <span className="text-[11px] font-normal text-zinc-500">{item.unit}</span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-rose-400 tabular-nums">
                              -{item.stok_keluar} <span className="text-[11px] font-normal text-zinc-500">{item.unit}</span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-zinc-100 tabular-nums">
                              <span
                                className={cn(
                                  "inline-block rounded-lg px-2.5 py-1",
                                  item.status === "KRITIS"
                                    ? "bg-rose-500/15 text-rose-300 font-extrabold border border-rose-500/30"
                                    : "text-zinc-100"
                                )}
                              >
                                {item.sisa_stok_realtime}{" "}
                                <span className="text-xs font-normal text-zinc-400">
                                  {item.unit}
                                </span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums">
                              {role === "ADMIN_PUSAT" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditMinStockItem({
                                      id: item.id,
                                      sku: item.sku,
                                      name: item.name,
                                      unit: item.unit,
                                      category: item.category,
                                      current_stock: item.sisa_stok_realtime,
                                      min_stock_central: item.min_stock_central ?? 10,
                                      min_stock_store: item.min_stock_store,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 group text-zinc-300 hover:text-amber-400 transition-colors cursor-pointer py-1 px-1.5 rounded-lg hover:bg-white/[0.04]"
                                  title="Klik untuk ubah batas minimum stok"
                                >
                                  <span>{item.min_stock_store} {item.unit}</span>
                                  <Pencil className="h-3 w-3 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                                </button>
                              ) : (
                                <span className="text-zinc-400">
                                  {item.min_stock_store} {item.unit}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {item.status === "KRITIS" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/25">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-subtle-pulse" />
                                  Kritis ({item.sisa_stok_realtime})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/20">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                  Aman
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal Dialog Ubah Minimum Stok */}
      <EditMinStockModal
        isOpen={Boolean(editMinStockItem)}
        onClose={() => setEditMinStockItem(null)}
        item={editMinStockItem}
      />
    </div>
  );
}
