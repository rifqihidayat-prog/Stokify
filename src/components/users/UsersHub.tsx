"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  Warehouse,
  Store,
  Shield,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { UserModal } from "./UserModal";
import { DeleteUserModal } from "./DeleteUserModal";
import type { SafeUser } from "@/actions/users";
import { formatDate } from "@/lib/utils";

interface UsersHubProps {
  initialUsers: SafeUser[];
  currentUserId: string;
}

export function UsersHub({ initialUsers, currentUserId }: UsersHubProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN_PUSAT" | "STAF_TOKO">("ALL");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<SafeUser | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<SafeUser | null>(null);

  const [toastMsg, setToastMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleOpenCreate = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: SafeUser) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (user: SafeUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleSuccess = (message: string) => {
    setToastMsg({ ok: true, text: message });
    setTimeout(() => setToastMsg(null), 4000);
    router.refresh();
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return initialUsers.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.store_name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q));

      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [initialUsers, searchQuery, roleFilter]);

  const countTotal = initialUsers.length;
  const countAdmin = initialUsers.filter((u) => u.role === "ADMIN_PUSAT").length;
  const countStore = initialUsers.filter((u) => u.role === "STAF_TOKO").length;

  return (
    <div className="space-y-6">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#121620] p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Akun</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-100 font-tabular-nums">{countTotal}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#121620] p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Admin Gudang Pusat</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-100 font-tabular-nums">{countAdmin}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#121620] p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Staf Toko Cabang</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-100 font-tabular-nums">{countStore}</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Action Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, username, cabang..."
              className="w-full rounded-xl border border-white/[0.08] bg-[#121620] pl-10 pr-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:border-amber-400/50 focus:bg-[#0E121B] focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center rounded-xl border border-white/[0.06] bg-[#121620] p-1 shadow-inner text-xs">
            <button
              type="button"
              onClick={() => setRoleFilter("ALL")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                roleFilter === "ALL"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Semua ({countTotal})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("ADMIN_PUSAT")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                roleFilter === "ADMIN_PUSAT"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Admin Pusat ({countAdmin})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("STAF_TOKO")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                roleFilter === "STAF_TOKO"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Staf Toko ({countStore})
            </button>
          </div>
        </div>

        {/* Primary CTA */}
        <Button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold hover:brightness-110 shadow-md shadow-amber-500/20 shrink-0"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Tambah Pengguna Baru
        </Button>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden p-0 border border-white/[0.06] bg-[#121620]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Pengguna & Username</th>
                <th className="px-4 py-3.5 font-semibold">Hak Akses (Role)</th>
                <th className="px-4 py-3.5 font-semibold">Penugasan Lokasi</th>
                <th className="px-4 py-3.5 font-semibold hidden md:table-cell">Waktu Dibuat</th>
                <th className="px-5 py-3.5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-zinc-500">
                    <Users className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                    <p className="font-semibold text-zinc-300">Tidak ada pengguna yang cocok</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Coba sesuaikan kata kunci pencarian atau filter role.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUserId;
                  const isMasterAdmin = u.username === "admin";

                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-white/[0.02] group"
                    >
                      {/* Name & Username */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${
                              u.role === "ADMIN_PUSAT"
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/25"
                                : "bg-sky-500/10 text-sky-300 border-sky-500/25"
                            }`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-zinc-100 truncate">{u.name}</p>
                              {isCurrent && (
                                <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                                  Anda
                                </span>
                              )}
                              {isMasterAdmin && (
                                <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-400">
                                  Master
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 font-mono">
                              <span>@{u.username}</span>
                              {u.email && (
                                <>
                                  <span className="text-zinc-600">·</span>
                                  <span className="text-zinc-400 truncate">{u.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                            u.role === "ADMIN_PUSAT"
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                              : "bg-sky-500/10 border-sky-500/30 text-sky-300"
                          }`}
                        >
                          {u.role === "ADMIN_PUSAT" ? (
                            <Warehouse className="h-3.5 w-3.5" />
                          ) : (
                            <Store className="h-3.5 w-3.5" />
                          )}
                          {u.role === "ADMIN_PUSAT" ? "Admin Pusat" : "Staf Toko"}
                        </span>
                      </td>

                      {/* Store Assignment */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-zinc-200">
                          {u.role === "ADMIN_PUSAT" ? (
                            <Warehouse className="h-4 w-4 text-amber-400 shrink-0" />
                          ) : (
                            <Store className="h-4 w-4 text-sky-400 shrink-0" />
                          )}
                          <span className="font-medium text-xs sm:text-sm">{u.store_name}</span>
                        </div>
                      </td>

                      {/* Date Created */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-zinc-400 hidden md:table-cell font-mono">
                        {u.created_at ? formatDate(new Date(u.created_at)) : "-"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 transition-colors"
                            title="Edit Akun"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {isMasterAdmin || isCurrent ? (
                            <button
                              type="button"
                              disabled
                              className="rounded-lg p-1.5 text-zinc-600 cursor-not-allowed opacity-40"
                              title={isMasterAdmin ? "Akun master admin tidak dapat dihapus" : "Tidak dapat menghapus akun Anda sendiri"}
                            >
                              <Lock className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(u)}
                              className="rounded-lg p-1.5 text-rose-400/70 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                              title="Hapus Akun"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={userToEdit}
        onSuccess={handleSuccess}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        userToDelete={userToDelete}
        onSuccess={handleSuccess}
      />

      {toastMsg && (
        <Toast
          message={toastMsg.text}
          type={toastMsg.ok ? "success" : "error"}
        />
      )}
    </div>
  );
}
