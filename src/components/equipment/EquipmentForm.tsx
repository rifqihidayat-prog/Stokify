"use client";

import { useActionState, useState } from "react";
import { AlertCircle, ImagePlus, PackagePlus, ShoppingBag, Sparkles, X } from "lucide-react";
import { createEquipmentRequest } from "@/actions/equipment";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Form";
import { Toast } from "@/components/ui/Toast";
import { cn, DEFAULT_STORE, type Role } from "@/lib/utils";

const INITIAL = { ok: false, message: "" } as const;

const REASON_OPTIONS = [
  {
    value: "DAMAGED_REPLACEMENT",
    title: "Penggantian Alat Rusak",
    desc: "Alat lama sudah rusak, tidak berfungsi, atau tidak layak pakai dan perlu diganti unit baru.",
    icon: AlertCircle,
    color: "border-zinc-800 bg-[#181c24] text-zinc-300 peer-checked:border-rose-700/70 peer-checked:bg-rose-950/40 peer-checked:text-rose-200 peer-checked:ring-rose-500/30",
    iconColor: "text-rose-400",
  },
  {
    value: "NEW_PROCUREMENT",
    title: "Pengadaan Baru (Belum Punya)",
    desc: "Toko belum memiliki peralatan ini dan membutuhkannya untuk operasional.",
    icon: Sparkles,
    color: "border-zinc-800 bg-[#181c24] text-zinc-300 peer-checked:border-amber-500/60 peer-checked:bg-amber-950/40 peer-checked:text-amber-200 peer-checked:ring-amber-500/30",
    iconColor: "text-amber-400",
  },
] as const;

const URGENCY_OPTIONS = [
  { value: "LOW", label: "Low", desc: "Tidak mendesak", cls: "peer-checked:border-emerald-500 peer-checked:bg-emerald-950/40 peer-checked:text-emerald-300" },
  { value: "MEDIUM", label: "Medium", desc: "Perlu segera ditindaklanjuti", cls: "peer-checked:border-amber-500 peer-checked:bg-amber-950/40 peer-checked:text-amber-300" },
  { value: "HIGH", label: "High", desc: "Sangat mendesak (krusial operasional)", cls: "peer-checked:border-rose-500 peer-checked:bg-rose-950/40 peer-checked:text-rose-300" },
] as const;

export function EquipmentForm({
  role,
  defaultStoreName,
}: {
  role: Role;
  defaultStoreName?: string;
}) {
  const [state, formAction, pending] = useActionState(createEquipmentRequest, INITIAL);
  const [selectedReason, setSelectedReason] = useState<string>("DAMAGED_REPLACEMENT");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <Card
      title="Form Pengajuan Pembelian / Pengadaan Equipment"
      subtitle="Ajukan pembelian peralatan toko baru ke Admin Pusat karena alat lama rusak atau toko belum punya."
      className="p-5 sm:p-6"
    >
      <Toast message={state.message} type={state.ok ? "success" : "error"} />

      <form action={formAction} className="space-y-6">
        {/* Pilihan Alasan Kebutuhan */}
        <div>
          <Label>Alasan Kebutuhan Pengadaan</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {REASON_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <label
                  key={opt.value}
                  className={cn(
                    "relative flex cursor-pointer flex-col gap-1.5 rounded-xl border p-4 transition-all hover:border-zinc-700 peer-checked:ring-2",
                    opt.color
                  )}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={opt.value}
                    checked={selectedReason === opt.value}
                    onChange={() => setSelectedReason(opt.value)}
                    className="peer sr-only"
                  />
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4 shrink-0", opt.iconColor)} />
                    <span className="text-sm font-semibold text-white">
                      {opt.title}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{opt.desc}</p>
                </label>
              );
            })}
          </div>
        </div>

        {/* Informasi Toko & Nama Alat */}
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <Label htmlFor="eq_store_name">Nama Toko</Label>
            <Input
              id="eq_store_name"
              name="store_name"
              defaultValue={defaultStoreName || DEFAULT_STORE[role] || "Toko Cabang Surabaya"}
              required
            />
          </div>
          <div>
            <Label htmlFor="equipment_name">Nama Equipment / Alat</Label>
            <Input
              id="equipment_name"
              name="equipment_name"
              placeholder="Contoh: Barcode Scanner, Printer Kasir"
              required
            />
          </div>
          <div>
            <Label htmlFor="quantity">Jumlah Unit Dibutuhkan</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              defaultValue={1}
              required
            />
          </div>
        </div>

        {/* Urgensi */}
        <div>
          <Label>Level Urgensi Pembelian</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {URGENCY_OPTIONS.map((u) => (
              <label
                key={u.value}
                className={cn(
                  "flex cursor-pointer flex-col gap-0.5 rounded-xl border border-zinc-800 bg-[#181c24] p-3.5 transition-colors hover:border-zinc-700",
                  u.cls
                )}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={u.value}
                  defaultChecked={u.value === "MEDIUM"}
                  className="peer sr-only"
                />
                <span className="text-sm font-semibold text-zinc-100">
                  {u.label}
                </span>
                <span className="text-xs text-zinc-400">{u.desc}</span>
              </label>
            ))}
          </div>
        </div>


        {/* Detail Alasan / Spesifikasi */}
        <div>
          <Label htmlFor="description">
            {selectedReason === "DAMAGED_REPLACEMENT"
              ? "Keterangan Kerusakan & Alasan Penggantian"
              : "Spesifikasi / Alasan Pengadaan Baru"}
          </Label>
          <Textarea
            id="description"
            name="description"
            placeholder={
              selectedReason === "DAMAGED_REPLACEMENT"
                ? "Jelaskan mengapa alat lama rusak/tidak bisa dipakai lagi dan mengapa harus diganti unit baru..."
                : "Jelaskan spesifikasi alat yang dibutuhkan dan tujuan penggunaan di toko..."
            }
            required
          />
        </div>

        {/* Lampiran Foto (Opsional, sangat berguna untuk alat rusak) */}
        <div>
          <Label htmlFor="image">
            {selectedReason === "DAMAGED_REPLACEMENT"
              ? "Foto Bukti Alat Lama Rusak (opsional / disarankan)"
              : "Foto Referensi Alat (opsional)"}
          </Label>
          <label
            htmlFor="image"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-700/80 bg-[#181c24] p-5 text-sm text-zinc-400 transition-colors hover:border-amber-400 hover:bg-amber-950/15"
          >
            {preview ? (
              <img
                src={preview}
                alt="Pratinjau Foto"
                className="max-h-40 rounded-lg object-contain"
              />
            ) : (
              <>
                <ImagePlus className="h-5 w-5 text-zinc-400" />
                <span>
                  {fileName ? (
                    <span className="font-medium text-amber-400">{fileName}</span>
                  ) : (
                    "Klik untuk memilih foto referensi/bukti kerusakan"
                  )}
                </span>
              </>
            )}
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) {
                setFileName(null);
                setPreview(null);
                return;
              }
              setFileName(file.name);
              setPreview(URL.createObjectURL(file));
            }}
          />
          {fileName && (
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-rose-400"
              onClick={() => {
                setFileName(null);
                setPreview(null);
                const input = document.getElementById("image") as HTMLInputElement;
                if (input) input.value = "";
              }}
            >
              <X className="h-3.5 w-3.5" />
              Hapus foto
            </button>
          )}
        </div>

        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          <ShoppingBag className="h-4 w-4" />
          {pending ? "Mengirim Pengajuan..." : "Kirim Pengajuan Pengadaan"}
        </Button>
      </form>
    </Card>
  );
}

