"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import {
  CheckCircle2,
  Clock,
  ImageOff,
  PackageCheck,
  ShoppingBag,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { updateEquipmentRequestStatus } from "@/actions/equipment";
import type { ActionResult } from "@/actions/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  EquipmentReasonBadge,
  EquipmentStatusBadge,
} from "@/components/ui/StatusBadge";
import { Toast } from "@/components/ui/Toast";
import { cn, formatDate, type Role } from "@/lib/utils";
import type { EquipmentRequest } from "@/db/schema";

const URGENCY_CLS: Record<string, string> = {
  LOW: "bg-emerald-950/60 text-emerald-300 ring-emerald-700/60 border border-emerald-800/40",
  MEDIUM: "bg-amber-950/60 text-amber-300 ring-amber-700/60 border border-amber-800/40",
  HIGH: "bg-rose-950/60 text-rose-300 ring-rose-700/60 border border-rose-800/40",
};

export function EquipmentList({
  requests,
  role,
}: {
  requests: EquipmentRequest[];
  role: Role;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>(
    { message: "", type: "success" }
  );

  const run = (fn: () => Promise<ActionResult>) => {
    startTransition(async () => {
      const res = await fn();
      setToast({ message: res.message, type: res.ok ? "success" : "error" });
      router.refresh();
    });
  };

  const isAdmin = role === "ADMIN_PUSAT";

  return (
    <Card
      title="Daftar Pengajuan Pengadaan Equipment"
      subtitle="Pantau proses review, pemesanan, hingga penerimaan peralatan toko."
      className="p-5 sm:p-6"
    >
      <Toast message={toast.message} type={toast.type} />

      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <ShoppingBag className="h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-400">
            Belum ada pengajuan pengadaan equipment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/[0.07] bg-[#121620] p-5 transition-all duration-200 hover:border-white/[0.12] hover:bg-[#151a26] shadow-elevated-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-bold text-white tracking-tight">
                      {item.equipment_name}
                    </p>
                    <span className="rounded-md bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-xs font-semibold text-zinc-200 font-mono tabular-nums">
                      {item.quantity} Unit
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{item.store_name}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                    URGENCY_CLS[item.urgency] ?? "bg-zinc-800 text-zinc-300 ring-zinc-700"
                  )}
                >
                  Urgensi {item.urgency}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <EquipmentReasonBadge reason={item.reason} />
                <EquipmentStatusBadge status={item.status} />
                <span className="text-xs text-zinc-400 font-mono tabular-nums">
                  {formatDate(item.created_at)}
                </span>
              </div>

              {item.image_url ? (
                <div className="mt-3.5 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0C0F15]">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400">
                    <img
                      src={item.image_url}
                      alt={item.equipment_name}
                      className="h-14 w-14 rounded-lg border border-white/[0.08] object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span className="truncate">{item.image_url}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-dashed border-white/[0.08] bg-[#0C0F15] px-3 py-2 text-xs text-zinc-400">
                  <ImageOff className="h-4 w-4" />
                  Tanpa lampiran foto unit
                </div>
              )}

              <p className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {item.description}
              </p>

              {/* Aksi Berdasarkan Role dan Status */}
              <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-white/[0.06]">
                {/* ADMIN PUSAT: Approve / Reject saat PENDING */}
                {isAdmin && item.status === "PENDING" && (
                  <>
                    <Button
                      variant="primary"
                      className="px-3 py-1.5 text-xs"
                      disabled={pending}
                      onClick={() =>
                        run(() => updateEquipmentRequestStatus(item.id, "APPROVED"))
                      }
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Setujui Pengadaan
                    </Button>
                    <Button
                      variant="danger"
                      className="px-3 py-1.5 text-xs"
                      disabled={pending}
                      onClick={() =>
                        run(() => updateEquipmentRequestStatus(item.id, "REJECTED"))
                      }
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Tolak
                    </Button>
                  </>
                )}

                {/* ADMIN PUSAT: Saat APPROVED, tandai ORDERED */}
                {isAdmin && item.status === "APPROVED" && (
                  <Button
                    variant="success"
                    className="px-3 py-1.5 text-xs"
                    disabled={pending}
                    onClick={() =>
                      run(() => updateEquipmentRequestStatus(item.id, "ORDERED"))
                    }
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Proses Pembelian / Dipesan
                  </Button>
                )}

                {/* TOKO / ADMIN: Saat ORDERED, konfirmasi barang sudah diterima toko */}
                {item.status === "ORDERED" && (
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    disabled={pending}
                    onClick={() =>
                      run(() => updateEquipmentRequestStatus(item.id, "COMPLETED"))
                    }
                  >
                    <PackageCheck className="h-3.5 w-3.5" />
                    Konfirmasi Barang Diterima Toko
                  </Button>
                )}

                {/* Status Teks untuk Toko saat menunggu */}
                {!isAdmin && item.status === "PENDING" && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                    <Clock className="h-3.5 w-3.5" />
                    Menunggu persetujuan Admin Pusat
                  </span>
                )}
                {!isAdmin && item.status === "APPROVED" && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-sky-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Pengadaan disetujui pusat, menunggu proses pembelian
                  </span>
                )}
                {item.status === "COMPLETED" && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Peralatan telah selesai diadakan & diterima toko
                  </span>
                )}
                {item.status === "REJECTED" && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-rose-400">
                    <XCircle className="h-3.5 w-3.5" />
                    Pengajuan ditolak oleh Admin Pusat
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}

