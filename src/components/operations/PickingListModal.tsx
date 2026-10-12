"use client";

import React, { useState } from "react";
import { ClipboardList, Printer, X, CheckSquare, Square, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { type PickingListItem } from "@/actions/requests";
import { formatDate } from "@/lib/utils";

interface PickingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PickingListItem[];
  onApprove?: (id: string) => Promise<void>;
}

export function PickingListModal({
  isOpen,
  onClose,
  items,
  onApprove,
}: PickingListModalProps) {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-700/80 bg-[#161920] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-[#12141A] px-5 py-3 print:hidden">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-zinc-100 text-sm sm:text-base">
                Lembar Picking List Gudang Pusat
              </h3>
              <p className="text-xs text-zinc-400">
                Daftar pengeluaran barang untuk pemenuhan permintaan toko cabang
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="primary" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" />
              Cetak Lembar Picking
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-zinc-900 print:p-0 print:m-0" id="printable-picking-list">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-xs font-black tracking-widest text-amber-400">
                  STOKIFY
                </span>
                <span className="font-bold text-xs text-zinc-600 uppercase tracking-widest">
                  Warehouse Operations
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-950">
                LEMBAR PICKING LIST GUDANG
              </h1>
              <p className="text-xs text-zinc-500">
                Dokumen kerja tim picker untuk penyiapan item & cross-check fisik rak
              </p>
            </div>

            <div className="text-right">
              <p className="font-mono text-xs font-semibold text-zinc-500">TANGGAL CETAK</p>
              <p className="font-mono text-sm font-bold text-zinc-900">
                {formatDate(new Date())}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Total Antrean: <span className="font-bold">{items.length} Item</span>
              </p>
            </div>
          </div>

          {/* Table */}
          {items.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 border border-dashed border-zinc-300 rounded-xl">
              Tidak ada antrean picking request toko saat ini.
            </div>
          ) : (
            <div className="mb-8 overflow-hidden rounded-lg border border-zinc-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-900 text-white font-semibold">
                    <th className="py-2.5 px-3 w-10 text-center">Check</th>
                    <th className="py-2.5 px-3 w-28 font-mono">Kode Barang</th>
                    <th className="py-2.5 px-3">Nama Lengkap Barang</th>
                    <th className="py-2.5 px-3 w-40">Toko Peminta</th>
                    <th className="py-2.5 px-3 w-24 text-right">Qty Minta</th>
                    <th className="py-2.5 px-3 w-24 text-right">Stok Pusat</th>
                    <th className="py-2.5 px-3 w-28">No. Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {items.map((item) => {
                    const isChecked = !!checkedIds[item.id];

                    return (
                      <tr
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isChecked ? "bg-emerald-50/60" : "hover:bg-zinc-50"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheck(item.id)}
                            className="h-4 w-4 rounded border-zinc-400 text-amber-500 focus:ring-amber-400"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-sky-800 text-sm">
                          {item.sku}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-sm text-zinc-950 block">
                            {item.name}
                          </span>
                          {item.notes && (
                            <span className="text-[11px] text-zinc-500 block italic">
                              Catatan: {item.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-zinc-800">
                          {item.store_name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-sm text-zinc-950">
                          {item.quantity_requested} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-600">
                          {item.current_stock_central} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500">
                          {item.reference_no}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Picker Signature */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-zinc-300 text-xs">
            <div>
              <p className="font-semibold text-zinc-500 mb-1">Catatan Staf Picker Gudang:</p>
              <div className="h-16 rounded border border-dashed border-zinc-300 bg-zinc-50 p-2 text-zinc-400 italic">
                Tulis catatan nomor rak atau kondisi barang jika ada...
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold text-zinc-600 mb-12">Petugas Picker Gudang</p>
              <div className="border-b border-zinc-400 w-44 ml-auto mb-1"></div>
              <p className="font-bold text-zinc-900">Nama & Tanda Tangan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
