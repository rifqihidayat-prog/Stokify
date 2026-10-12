"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Mail,
  Shield,
  Store,
  Warehouse,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createUser, updateUser, type SafeUser } from "@/actions/users";
import type { Role } from "@/lib/utils";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: SafeUser | null;
  onSuccess: (message: string) => void;
}

const STORE_PRESETS = [
  "Toko Cabang Surabaya",
  "Toko Cabang Bandung",
  "Toko Cabang Jakarta",
  "Toko Cabang Semarang",
  "Toko Cabang Medan",
];

export function UserModal({
  isOpen,
  onClose,
  userToEdit,
  onSuccess,
}: UserModalProps) {
  const isEdit = !!userToEdit;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("STAF_TOKO");
  const [storeName, setStoreName] = useState("Toko Cabang Surabaya");
  const [isCustomStore, setIsCustomStore] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username);
      setName(userToEdit.name);
      setEmail(userToEdit.email || "");
      setRole(userToEdit.role);
      setStoreName(userToEdit.store_name);
      setPassword("");
      setIsCustomStore(!STORE_PRESETS.includes(userToEdit.store_name) && userToEdit.store_name !== "Pusat Warehouse");
    } else {
      setUsername("");
      setPassword("");
      setName("");
      setEmail("");
      setRole("STAF_TOKO");
      setStoreName("Toko Cabang Surabaya");
      setIsCustomStore(false);
    }
    setErrorMsg(null);
  }, [userToEdit, isOpen]);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    if (newRole === "ADMIN_PUSAT") {
      setStoreName("Pusat Warehouse");
      setIsCustomStore(false);
    } else if (storeName === "Pusat Warehouse") {
      setStoreName("Toko Cabang Surabaya");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setIsLoading(true);
    try {
      if (isEdit && userToEdit) {
        const res = await updateUser(userToEdit.id, {
          name,
          email,
          role,
          store_name: storeName,
          password: password || undefined,
        });

        if (!res.ok) {
          setErrorMsg(res.message);
          setIsLoading(false);
          return;
        }

        onSuccess(res.message);
        onClose();
      } else {
        const res = await createUser({
          username,
          password,
          name,
          email,
          role,
          store_name: storeName,
        });

        if (!res.ok) {
          setErrorMsg(res.message);
          setIsLoading(false);
          return;
        }

        onSuccess(res.message);
        onClose();
      }
    } catch {
      setErrorMsg("Terjadi kesalahan sistem saat menyimpan data pengguna.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Pengguna: ${userToEdit?.name}` : "Tambah Pengguna Baru"}
      description={
        isEdit
          ? "Perbarui hak akses, nama, lokasi penugasan, atau ubah kata sandi akun."
          : "Buat akun login baru untuk staf toko cabang atau admin gudang pusat."
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs sm:text-sm text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Role Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Peran & Hak Akses (Role)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRoleChange("ADMIN_PUSAT")}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                role === "ADMIN_PUSAT"
                  ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30"
                  : "border-white/[0.08] bg-[#0A0D14] hover:bg-white/[0.02]"
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                  role === "ADMIN_PUSAT"
                    ? "border-amber-500/30 bg-amber-500/20 text-amber-300"
                    : "border-white/[0.06] bg-white/[0.04] text-zinc-400"
                }`}
              >
                <Warehouse className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold ${role === "ADMIN_PUSAT" ? "text-amber-300" : "text-zinc-200"}`}>
                  Admin Pusat
                </p>
                <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                  Akses penuh gudang pusat, PO, surat jalan, dan opname.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("STAF_TOKO")}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                role === "STAF_TOKO"
                  ? "border-sky-500/50 bg-sky-500/10 ring-1 ring-sky-500/30"
                  : "border-white/[0.08] bg-[#0A0D14] hover:bg-white/[0.02]"
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                  role === "STAF_TOKO"
                    ? "border-sky-500/30 bg-sky-500/20 text-sky-300"
                    : "border-white/[0.06] bg-white/[0.04] text-zinc-400"
                }`}
              >
                <Store className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold ${role === "STAF_TOKO" ? "text-sky-300" : "text-zinc-200"}`}>
                  Staf Toko
                </p>
                <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                  Pengajuan permintaan barang toko & closing harian.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Identity Information */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Username {isEdit && <span className="text-zinc-500">(Tidak dapat diubah)</span>}
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isEdit || isLoading}
                placeholder="Contoh: toko.jakarta"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-[#0A0D14] pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:border-amber-400/50 focus:bg-[#0E121B] focus:outline-none focus:ring-2 focus:ring-amber-400/20 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              {isEdit ? "Kata Sandi Baru (Opsional)" : "Kata Sandi"}
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? "Kosongkan bila tetap" : "Minimal 8 karakter"}
                required={!isEdit}
                disabled={isLoading}
                className="w-full rounded-xl border border-white/[0.08] bg-[#0A0D14] pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:border-amber-400/50 focus:bg-[#0E121B] focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Nama Lengkap Pengguna
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Rian - Supervisor Toko Jakarta"
              required
              disabled={isLoading}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0A0D14] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:border-amber-400/50 focus:bg-[#0E121B] focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Email (Opsional)
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@stokify.internal"
                disabled={isLoading}
                className="w-full rounded-xl border border-white/[0.08] bg-[#0A0D14] pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:border-amber-400/50 focus:bg-[#0E121B] focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
          </div>
        </div>

        {/* Store Assignment */}
        <div className="space-y-2 border-t border-white/[0.06] pt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
            <span>Penugasan Cabang / Lokasi</span>
            {role === "STAF_TOKO" && (
              <button
                type="button"
                onClick={() => setIsCustomStore(!isCustomStore)}
                className="text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                {isCustomStore ? "Pilih dari preset cabang" : "+ Tulis nama cabang kustom"}
              </button>
            )}
          </label>

          {role === "ADMIN_PUSAT" ? (
            <input
              type="text"
              value="Pusat Warehouse"
              disabled
              className="w-full rounded-xl border border-white/[0.08] bg-[#0A0D14] px-3.5 py-2.5 text-sm text-zinc-300 opacity-80 cursor-not-allowed"
            />
          ) : isCustomStore ? (
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Contoh: Toko Cabang Yogyakarta"
              required
              disabled={isLoading}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0A0D14] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:border-amber-400/50 focus:bg-[#0E121B] focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          ) : (
            <select
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0A0D14] px-3.5 py-2.5 text-sm text-zinc-100 transition-all focus:border-amber-400/50 focus:bg-[#0E121B] focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            >
              {STORE_PRESETS.map((preset) => (
                <option key={preset} value={preset} className="bg-[#121620] text-zinc-100">
                  {preset}
                </option>
              ))}
            </select>
          )}
          <p className="text-[11px] text-zinc-400">
            Penugasan ini menentukan filter otomatis pada form pengajuan permintaan barang, closing, dan opname stok.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold hover:brightness-110 shadow-md shadow-amber-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-zinc-950 mr-2" />
                Menyimpan...
              </>
            ) : isEdit ? (
              "Simpan Perubahan"
            ) : (
              "Buat Pengguna Baru"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
