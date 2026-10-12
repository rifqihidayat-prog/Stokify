"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pencil, SlidersHorizontal, CheckCircle, Ban, Trash2 } from "lucide-react";
import { updateCentralStock, deleteCentralProduct } from "@/actions/stock";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { RestockBadge, StockStatusBadge } from "@/components/ui/StatusBadge";
import { Toast } from "@/components/ui/Toast";
import { SyncButton } from "./SyncButton";
import { getStockStatus } from "@/lib/utils";
import type { Product } from "@/db/schema";

export function InventoryTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>(
    { message: "", type: "success" }
  );
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(0);

  const openEdit = (p: Product) => {
    setEditing(p);
    setStock(p.current_stock_central);
    setMinStock(p.min_stock_central);
  };

  const save = () => {
    if (!editing) return;
    startTransition(async () => {
      const res = await updateCentralStock(editing.id, stock, minStock);
      setToast({ message: res.message, type: res.ok ? "success" : "error" });
      if (res.ok) setEditing(null);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deleteCentralProduct(deleting.id);
      setToast({ message: res.message, type: res.ok ? "success" : "error" });
      if (res.ok) setDeleting(null);
      router.refresh();
    });
  };


  return (
    <>
      <Toast message={toast.message} type={toast.type} />
      <Card
        title="Manajemen Stok Pusat"
        subtitle="Perbarui stok fisik dan ambang batas minimum untuk setiap item katalog."
        action={<SyncButton />}
        className="p-5 sm:p-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-400">
                <th className="pb-3 pr-4 font-medium">SKU</th>
                <th className="pb-3 pr-4 font-medium">Item</th>
                <th className="pb-3 pr-4 font-medium">Kategori</th>
                <th className="pb-3 pr-4 font-medium">Stok Fisik</th>
                <th className="pb-3 pr-4 font-medium">Min. Stok</th>
                <th className="pb-3 pr-4 font-medium">Status Stok</th>
                <th className="pb-3 pr-4 font-medium">Akses Toko</th>
                <th className="pb-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {products.map((p) => {
                const status = getStockStatus(
                  p.current_stock_central,
                  p.min_stock_central
                );
                return (
                  <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 pr-4 text-xs font-mono font-medium text-sky-400">
                      {p.sku ?? "-"}
                    </td>
                    <td className="py-3.5 pr-4">
                      <p className="font-semibold text-zinc-100">{p.name}</p>
                      <p className="text-xs text-zinc-400">{p.unit}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="text-xs font-medium text-zinc-300">
                        {p.category === "DAILY_CONSUMABLE"
                          ? "Daily Consumable"
                          : "Equipment"}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={
                          "text-base font-bold " +
                          (p.current_stock_central === 0
                            ? "text-rose-400"
                            : "text-zinc-100")
                        }
                      >
                        {p.current_stock_central}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-zinc-400">
                      {p.min_stock_central}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="space-y-1.5">
                        <StockStatusBadge status={status} showDot />
                        {status !== "AMAN" && (
                          <RestockBadge />
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      {p.is_orderable ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/60 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-700/60 border border-emerald-800/40">
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                          Bisa Dipesan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/90 px-2 py-0.5 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-zinc-700">
                          <Ban className="h-3 w-3" />
                          Tidak Dipesan
                        </span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          className="px-2.5 py-1.5 text-xs"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          className="px-2.5 py-1.5 text-xs"
                          onClick={() => setDeleting(p)}
                          title={`Hapus "${p.name}"`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 rounded-xl bg-[#181b22] border border-zinc-800/80 px-4 py-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500" /> Kritis: stok ≤ 80%
            min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500" /> Warning: stok ≤
            min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" /> Aman: stok di
            atas min
          </span>
        </div>
      </Card>

      <Modal
        open={!!editing}
        onClose={() => !pending && setEditing(null)}
        title={editing ? `Edit Stok — ${editing.name}` : ""}
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-stock">Stok Fisik</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="edit-min">Minimum Stock</Label>
                <Input
                  id="edit-min"
                  type="number"
                  min={0}
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button
                variant="outline"
                onClick={() => setEditing(null)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button onClick={save} disabled={pending}>
                <SlidersHorizontal className="h-4 w-4" />
                {pending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => !pending && setDeleting(null)}
        title={deleting ? `Hapus Item — ${deleting.name}` : ""}
      >
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">
              Apakah Anda yakin ingin menghapus item{" "}
              <strong className="text-white">{deleting.name}</strong>{" "}
              {deleting.sku ? `(SKU: ${deleting.sku})` : ""} dari katalog master stok pusat?
            </p>
            <p className="text-xs text-rose-300 bg-rose-950/60 p-3 rounded-xl border border-rose-800/60">
              Perhatian: Item ini tidak akan bisa dipesan lagi oleh toko. Jika sewaktu-waktu dibutuhkan kembali, Anda bisa menyinkronkannya kembali dari Google Sheets.
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
                <Trash2 className="h-4 w-4" />
                {pending ? "Menghapus..." : "Ya, Hapus Item"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}


