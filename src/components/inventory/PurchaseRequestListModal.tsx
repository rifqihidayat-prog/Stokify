"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Inbox,
  XCircle,
  Plus,
  Loader2,
  Calendar,
  Building,
  User,
} from "lucide-react";
import { cancelPurchaseRequest, type PurchaseRequestWithProduct } from "@/actions/purchase_requests";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

interface PurchaseRequestListModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: PurchaseRequestWithProduct[];
  onOpenInflowWithPR?: (productId: string, supplierName?: string, suggestedQty?: number) => void;
}

export function PurchaseRequestListModal({
  isOpen,
  onClose,
  requests,
  onOpenInflowWithPR,
}: PurchaseRequestListModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toastMsg, setToastMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleCancel = (prId: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan Purchase Request ini?")) return;

    startTransition(async () => {
      const res = await cancelPurchaseRequest(prId);
      setToastMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        router.refresh();
      }
    });
  };

  const handleReceiveStock = (pr: PurchaseRequestWithProduct) => {
    onClose();
    if (onOpenInflowWithPR) {
      onOpenInflowWithPR(pr.product_id, pr.supplier_name || undefined, pr.quantity);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daftar Purchase Request (PR) Aktif"
      description="Monitoring barang yang sudah dibuatkan PR dan sedang menunggu pengiriman dari supplier."
    >
      {toastMsg && (
        <div className="mb-4">
          <Toast message={toastMsg.text} type={toastMsg.ok ? "success" : "error"} />
        </div>
      )}

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Inbox className="h-10 w-10 text-zinc-600 mb-2" />
          <p className="text-sm font-medium text-zinc-400">
            Tidak ada Purchase Request aktif saat ini.
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Seluruh item yang perlu di-restock dapat dibuatkan PR melalui tombol &quot;Buat PR&quot; di tabel stok pusat.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {requests.map((pr) => (
            <div
              key={pr.id}
              className="rounded-xl border border-white/[0.08] bg-[#0C0F15] p-3.5 space-y-2.5 transition-colors hover:border-white/[0.12]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {pr.pr_number}
                    </span>
                    <span className="font-mono text-xs text-zinc-400">
                      [{pr.product.sku || "-"}]
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-zinc-100 mt-1">
                    {pr.product.name}
                  </h4>
                </div>

                <div className="text-right">
                  <span className="inline-block font-mono text-sm font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20 tabular-nums">
                    {pr.quantity} {pr.product.unit}
                  </span>
                  <div className="text-[10px] text-amber-400/80 font-medium mt-0.5">
                    Menunggu Supplier
                  </div>
                </div>
              </div>

              {/* Detail Supplier & Info */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-1.5 truncate">
                  <Building className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">
                    {pr.supplier_name ? pr.supplier_name : "Supplier belum ditentukan"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <span>{formatDate(pr.created_at)}</span>
                </div>
              </div>

              {pr.notes && (
                <p className="text-xs text-zinc-400 italic bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                  &quot;{pr.notes}&quot;
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => handleCancel(pr.id)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Batalkan</span>
                </button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleReceiveStock(pr)}
                  className="text-xs py-1 h-7 bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Terima Barang (Inflow)
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-3 border-t border-white/[0.06] mt-4">
        <Button type="button" variant="outline" onClick={onClose} className="text-xs">
          Tutup
        </Button>
      </div>
    </Modal>
  );
}
