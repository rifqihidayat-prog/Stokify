"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import {
  CheckCircle2,
  CircleX,
  Inbox,
  PackageCheck,
  Send,
  Truck,
  Trash2,
  Printer,
  ClipboardList,
} from "lucide-react";
import {
  approveStoreRequest,
  rejectStoreRequest,
  updateRequestStatus,
  deleteStoreRequest,
} from "@/actions/requests";
import type { ActionResult } from "@/actions/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { RequestStatusBadge } from "@/components/ui/StatusBadge";
import { Toast } from "@/components/ui/Toast";
import { PickingListModal } from "@/components/operations/PickingListModal";
import { cn, formatDate, type Role } from "@/lib/utils";
import type { StoreRequestWithProduct } from "@/actions/requests";

export function RequestList({
  requests,
  role,
}: {
  requests: StoreRequestWithProduct[];
  role: Role;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleting, setDeleting] = useState<StoreRequestWithProduct | null>(null);
  const [isPickingOpen, setIsPickingOpen] = useState(false);

  const isAdmin = role === "ADMIN_PUSAT";

  const run = (fn: () => Promise<ActionResult>) => {
    startTransition(async () => {
      const res = await fn();
      setToast({ message: res.message, type: res.ok ? "success" : "error" });
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deleteStoreRequest(deleting.id);
      setToast({ message: res.message, type: res.ok ? "success" : "error" });
      if (res.ok) setDeleting(null);
      router.refresh();
    });
  };

  // Convert to picking list format
  const pickingItems = requests
    .filter((r) => r.status === "PENDING" || r.status === "APPROVED")
    .map((r) => ({
      id: r.id,
      reference_no: r.reference_no || `REQ-${r.id.slice(0, 8)}`,
      store_name: r.store_name,
      product_id: r.product_id,
      sku: r.product.sku || "-",
      name: r.product.name,
      unit: r.product.unit,
      quantity_requested: r.quantity_requested,
      current_stock_central: r.product.current_stock_central,
      status: r.status,
      notes: r.notes,
      created_at: new Date(r.created_at),
    }));

  return (
    <>
      <Card
        title="Daftar Permintaan Barang Toko"
        subtitle="Tracking status pengajuan dari toko sampai penerimaan & penerbitan Surat Jalan."
        className="p-4 sm:p-6"
        headerAction={
          isAdmin && pickingItems.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPickingOpen(true)}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <ClipboardList className="h-4 w-4 mr-1.5" />
              Cetak Picking List ({pickingItems.length})
            </Button>
          ) : undefined
        }
      >
        {toast && (
          <div className="mb-4">
            <Toast message={toast.message} type={toast.type} />
          </div>
        )}

        {requests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Inbox className="h-10 w-10 text-zinc-600" />
            <p className="text-sm font-medium text-zinc-400">
              Belum ada permintaan barang dari toko saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wider text-zinc-400 bg-[#0C0F15]/50">
                  <th className="py-3.5 px-3 font-mono w-32">No. Ref</th>
                  <th className="py-3.5 px-3">Barang & SKU</th>
                  <th className="py-3.5 px-3">Toko Peminta</th>
                  <th className="py-3.5 px-3 text-right">Jumlah</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-3">Tanggal</th>
                  <th className="py-3.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-medium">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* No. Ref */}
                    <td className="py-3.5 px-3 font-mono text-xs font-bold text-amber-400 tabular-nums">
                      {r.reference_no || `REQ-${r.id.slice(0, 6)}`}
                    </td>

                    {/* Barang & SKU */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-sky-400 tabular-nums">
                          [{r.product.sku || "-"}]
                        </span>
                        <span className="font-semibold text-zinc-100">
                          {r.product.name}
                        </span>
                      </div>
                      {r.notes && (
                        <p className="mt-0.5 max-w-64 truncate text-xs text-zinc-400 italic">
                          &quot;{r.notes}&quot;
                        </p>
                      )}
                    </td>

                    {/* Toko */}
                    <td className="py-3.5 px-3 text-zinc-200 font-semibold">{r.store_name}</td>

                    {/* Jumlah */}
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-mono font-bold text-zinc-100 tabular-nums">
                        {r.quantity_requested}
                      </span>{" "}
                      <span className="text-xs text-zinc-400 font-normal">
                        {r.product.unit}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <RequestStatusBadge status={r.status} />
                    </td>

                    {/* Tanggal */}
                    <td className="py-3.5 px-3 text-xs text-zinc-400 font-mono tabular-nums">
                      {formatDate(r.created_at)}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {isAdmin && r.status === "PENDING" && (
                          <>
                            <Button
                              variant="success"
                              className="px-2.5 py-1 text-xs h-7"
                              disabled={pending}
                              onClick={() => run(() => approveStoreRequest(r.id))}
                              title="Setujui & Terbitkan Surat Jalan"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Setujui
                            </Button>
                            <Button
                              variant="danger"
                              className="px-2 py-1 text-xs h-7"
                              disabled={pending}
                              onClick={() => run(() => rejectStoreRequest(r.id))}
                              title="Tolak Pengajuan"
                            >
                              <CircleX className="h-3.5 w-3.5 mr-1" />
                              Tolak
                            </Button>
                          </>
                        )}

                        {isAdmin && r.status === "APPROVED" && (
                          <Button
                            variant="primary"
                            className="px-2.5 py-1 text-xs h-7"
                            disabled={pending}
                            onClick={() =>
                              run(() => updateRequestStatus(r.id, "SHIPPED"))
                            }
                          >
                            <Send className="h-3.5 w-3.5 mr-1" />
                            Kirim (SJ)
                          </Button>
                        )}

                        {r.status === "SHIPPED" && (
                          <Button
                            variant="secondary"
                            className="px-2.5 py-1 text-xs h-7"
                            disabled={pending}
                            onClick={() =>
                              run(() => updateRequestStatus(r.id, "RECEIVED"))
                            }
                          >
                            <Truck className="h-3.5 w-3.5 mr-1" />
                            Terima Barang
                          </Button>
                        )}

                        {(r.status === "RECEIVED" || r.status === "REJECTED") && (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                            <PackageCheck className="h-3.5 w-3.5 text-emerald-400" />
                            Selesai
                          </span>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition ml-1"
                            disabled={pending}
                            onClick={() => setDeleting(r)}
                            title="Hapus baris pengajuan ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Konfirmasi Hapus Pengajuan untuk Admin Pusat */}
        <Modal
          isOpen={!!deleting}
          onClose={() => !pending && setDeleting(null)}
          title="Hapus Riwayat Pengajuan Stok"
          size="md"
        >
          {deleting && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-300">
                Apakah Anda yakin ingin menghapus data pengajuan stok{" "}
                <strong className="text-white">{deleting.product.name}</strong>{" "}
                ({deleting.quantity_requested} {deleting.product.unit}) dari{" "}
                <strong className="text-white">{deleting.store_name}</strong>?
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <Button
                  variant="outline"
                  onClick={() => setDeleting(null)}
                  disabled={pending}
                >
                  Batal
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={pending}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  {pending ? "Menghapus..." : "Ya, Hapus Pengajuan"}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </Card>

      {/* Picking List Print Modal */}
      <PickingListModal
        isOpen={isPickingOpen}
        onClose={() => setIsPickingOpen(false)}
        items={pickingItems}
      />
    </>
  );
}



