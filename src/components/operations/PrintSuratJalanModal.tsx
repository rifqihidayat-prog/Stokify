"use client";

import React from "react";
import { Printer, X, Building2, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export interface SuratJalanItem {
  sku: string;
  name: string;
  qty: number;
  unit: string;
  notes?: string;
}

export interface SuratJalanData {
  referenceNo: string;
  storeName: string;
  date: Date;
  items: SuratJalanItem[];
  notes?: string;
  senderName?: string;
}

interface PrintSuratJalanModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SuratJalanData | null;
}

export function PrintSuratJalanModal({
  isOpen,
  onClose,
  data,
}: PrintSuratJalanModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-700/80 bg-[#161920] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Action Bar (Hidden on Print) */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-[#12141A] px-5 py-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-zinc-100 text-sm sm:text-base">
              Dokumen Resmi Surat Jalan ({data.referenceNo})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="primary" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" />
              Cetak Surat Jalan
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Content (A4-friendly) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-zinc-900 print:p-0 print:m-0" id="printable-surat-jalan">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-xs font-black tracking-widest text-amber-400">
                  STOKIFY
                </span>
                <span className="font-bold text-xs text-zinc-600 uppercase tracking-widest">
                  Logistics Distribution
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-950">
                SURAT JALAN PENGIRIMAN
              </h1>
              <p className="text-xs text-zinc-500">
                Gudang Pusat Logistik Nasional • Hub Distribusi Utama
              </p>
            </div>

            <div className="text-right">
              <p className="font-mono text-xs font-semibold text-zinc-500">NOMOR SURAT JALAN</p>
              <p className="font-mono text-base font-black text-zinc-950 tracking-wider">
                {data.referenceNo}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Tanggal: {formatDate(data.date)}
              </p>
            </div>
          </div>

          {/* Delivery Meta Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-zinc-100 p-4 mb-6 text-xs text-zinc-800 border border-zinc-300">
            <div>
              <p className="font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Pengirim:</p>
              <p className="font-bold text-sm text-zinc-900">GUDANG PUSAT (CENTRAL WAREHOUSE)</p>
              <p className="text-zinc-600">Alamat: Kawasan Pergudangan Logistik Blok A</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Toko Penerima / Cabang:</p>
              <p className="font-bold text-sm text-zinc-900">{data.storeName}</p>
              <p className="text-zinc-600">Catatan: {data.notes || "Pengiriman reguler alokasi toko"}</p>
            </div>
          </div>

          {/* Table of Goods */}
          <div className="mb-8 overflow-hidden rounded-lg border border-zinc-300">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-900 text-white font-semibold">
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-3 w-28 font-mono">Kode Barang</th>
                  <th className="py-2.5 px-3">Nama Deskripsi Barang</th>
                  <th className="py-2.5 px-3 w-24 text-right">Qty Kirim</th>
                  <th className="py-2.5 px-3 w-20">Satuan</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {data.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="py-2.5 px-3 text-center font-medium text-zinc-600">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">{item.sku || "-"}</td>
                    <td className="py-2.5 px-3 font-medium text-zinc-950">{item.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-950">{item.qty}</td>
                    <td className="py-2.5 px-3 text-zinc-700">{item.unit}</td>
                    <td className="py-2.5 px-3 text-zinc-500">{item.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total & Summary */}
          <div className="flex justify-between items-center mb-10 text-xs px-2">
            <p className="text-zinc-500 italic">
              * Pastikan jumlah fisik dan kondisi kemasan telah diperiksa sebelum menandatangani dokumen ini.
            </p>
            <p className="font-semibold text-zinc-900">
              Total Item: <span className="font-mono font-bold">{data.items.length} Barang</span>
            </p>
          </div>

          {/* Signature Columns (3 Columns: Pengirim, Ekspedisi, Penerima) */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-zinc-300 text-center text-xs">
            <div>
              <p className="font-semibold text-zinc-600 mb-14">Pengirim (Gudang Pusat)</p>
              <div className="border-b border-zinc-400 w-36 mx-auto mb-1"></div>
              <p className="font-bold text-zinc-900">Logistics Staff</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-600 mb-14">Kurir / Ekspedisi</p>
              <div className="border-b border-zinc-400 w-36 mx-auto mb-1"></div>
              <p className="font-bold text-zinc-900">Driver / Ekspedisi</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-600 mb-14">Penerima (Kepala Toko)</p>
              <div className="border-b border-zinc-400 w-36 mx-auto mb-1"></div>
              <p className="font-bold text-zinc-900">Store PIC</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
