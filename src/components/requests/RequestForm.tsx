"use client";

import { useState } from "react";
import { Plus, Trash2, PackageSearch, AlertCircle, CheckCircle2 } from "lucide-react";
import { createMultiItemStoreRequest, type BookedStockMap } from "@/actions/requests";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Autocomplete, type AutocompleteItem } from "@/components/ui/Autocomplete";
import { Toast } from "@/components/ui/Toast";
import { DEFAULT_STORE, type Role } from "@/lib/utils";
import type { Product } from "@/db/schema";

interface ItemRow {
  id: string;
  productId: string;
  quantity: number | "";
}

export function RequestForm({
  products,
  role,
  defaultStoreName,
  bookedStockMap = {},
}: {
  products: Product[];
  role: Role;
  defaultStoreName?: string;
  bookedStockMap?: BookedStockMap;
}) {
  const [storeName, setStoreName] = useState<string>(
    defaultStoreName || DEFAULT_STORE[role] || "Toko Cabang Surabaya"
  );
  const [rows, setRows] = useState<ItemRow[]>([
    { id: "1", productId: "", quantity: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const autocompleteItems: AutocompleteItem[] = products.map((p) => {
    const booking = bookedStockMap[p.id];
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      unit: p.unit,
      current_stock: p.current_stock_central,
      is_orderable: p.is_orderable,
      booked_stock: booking ? booking.otherStoresBooked : 0,
      booked_details: booking ? booking.otherBreakdownText : undefined,
    };
  });

  const handleAddRow = () => {
    setRows((prev) => [...prev, { id: Math.random().toString(), productId: "", quantity: "" }]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRowChange = (id: string, field: "productId" | "quantity", value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg(null);

    const validRows = rows.filter((r) => r.productId && Number(r.quantity) > 0);
    if (validRows.length === 0) {
      setToastMsg({ ok: false, text: "Tambahkan minimal 1 baris barang dengan jumlah valid." });
      return;
    }

    setIsPending(true);
    const res = await createMultiItemStoreRequest({
      storeName: storeName.trim(),
      items: validRows.map((r) => ({
        productId: r.productId,
        quantity: Number(r.quantity),
      })),
      notes: notes.trim() || undefined,
    });
    setIsPending(false);

    if (res.ok) {
      setToastMsg({ ok: true, text: res.message });
      setRows([{ id: "1", productId: "", quantity: "" }]);
      setNotes("");
    } else {
      setToastMsg({ ok: false, text: res.message });
    }
  };

  return (
    <Card
      title="Pengajuan Permintaan Barang ke Pusat"
      subtitle="Pilih item barang & masukkan jumlah permintaan. Item yang ter-booked toko lain tetap dapat Anda pesan."
      className="p-4 sm:p-6"
    >
      {toastMsg && (
        <div className="mb-4">
          <Toast message={toastMsg.text} type={toastMsg.ok ? "success" : "error"} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Nama Toko Peminta <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0C0F15] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Catatan Pengajuan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Kebutuhan persiapan weekend / stok menipis..."
              className="w-full rounded-xl border border-white/[0.08] bg-[#0C0F15] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Dynamic Multi-Item Container */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0C0F15]/60 p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Daftar Barang yang Diminta
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Stok pusat yang sedang ter-booked oleh toko lain tetap dapat Anda pesan (masuk antrean pengadaan pusat).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="text-xs py-1 h-8 border-white/[0.08]"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Tambah Baris
            </Button>
          </div>

          <div className="space-y-3">
            {rows.map((row, idx) => {
              const selectedProd = products.find((p) => p.id === row.productId);
              const bookedInfo = selectedProd ? bookedStockMap[selectedProd.id] : undefined;

              return (
                <div
                  key={row.id}
                  className="rounded-xl bg-[#121620] p-3 border border-white/[0.06] space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <span className="text-xs font-mono font-bold text-zinc-500 w-5 text-center tabular-nums">
                      #{idx + 1}
                    </span>

                    {/* Autocomplete allows zero and booked stock */}
                    <div className="flex-1 w-full">
                      <Autocomplete
                        items={autocompleteItems}
                        value={row.productId}
                        disableZeroStock={false}
                        onChange={(id) => handleRowChange(row.id, "productId", id)}
                        placeholder="Ketik kode atau nama barang..."
                      />
                    </div>

                    {/* Qty Input without artificial max limit */}
                    <div className="w-full sm:w-36 flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={1}
                          required
                          value={row.quantity}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "quantity",
                              e.target.value ? parseInt(e.target.value, 10) : ""
                            )
                          }
                          placeholder="Qty..."
                          className="w-full rounded-xl border border-white/[0.08] bg-[#0C0F15] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-amber-400 focus:outline-none font-mono tabular-nums"
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
                          className="rounded-lg p-2 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          title="Hapus baris"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Realtime Booking / Stock Information Badge */}
                  {selectedProd && (
                    <div className="pt-2 border-t border-white/[0.04]">
                      {bookedInfo && bookedInfo.otherStoresBooked > 0 ? (
                        <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-200">
                          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                          <div className="flex-1 space-y-0.5">
                            <p className="font-semibold text-amber-300">
                              ⚠️ Ter-booked Toko Lain: {bookedInfo.otherStoresBooked} {selectedProd.unit}
                              {bookedInfo.otherBreakdownText && (
                                <span className="font-normal text-amber-200/90 ml-1">
                                  ({bookedInfo.otherBreakdownText})
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-amber-300/80">
                              Stok fisik gudang pusat: <strong>{selectedProd.current_stock_central} {selectedProd.unit}</strong>. Anda <strong>tetap dapat mengajukan pesanan</strong> (akan masuk antrean pusat).
                            </p>
                          </div>
                        </div>
                      ) : selectedProd.current_stock_central <= 0 ? (
                        <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-semibold text-rose-200">Stok Pusat Kosong (0 {selectedProd.unit}).</span>{" "}
                            <span className="text-[11px] text-rose-300/80">
                              Anda tetap dapat mengajukan pesanan ini untuk dimasukkan ke antrean pengadaan pusat.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-emerald-400/90 pl-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>
                            Stok Pusat Ready: <strong>{selectedProd.current_stock_central} {selectedProd.unit}</strong> (Belum ada booking aktif dari toko lain).
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          className="w-full sm:w-auto px-8"
        >
          <PackageSearch className="h-4 w-4 mr-2" />
          Kirim Pengajuan Permintaan Barang ({rows.filter((r) => r.productId).length} Item)
        </Button>
      </form>
    </Card>
  );
}
