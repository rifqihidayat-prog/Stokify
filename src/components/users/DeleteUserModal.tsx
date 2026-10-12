"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { deleteUser, type SafeUser } from "@/actions/users";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToDelete: SafeUser | null;
  onSuccess: (message: string) => void;
}

export function DeleteUserModal({
  isOpen,
  onClose,
  userToDelete,
  onSuccess,
}: DeleteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!userToDelete) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await deleteUser(userToDelete.id);
      if (!res.ok) {
        setErrorMsg(res.message);
        setIsLoading(false);
        return;
      }
      onSuccess(res.message);
      onClose();
    } catch {
      setErrorMsg("Terjadi kesalahan saat menghapus pengguna.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Hapus Akun"
      size="sm"
    >
      <div className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-start gap-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="text-xs text-zinc-300 leading-relaxed">
            <p className="font-semibold text-rose-200">
              Apakah Anda yakin ingin menghapus akun ini?
            </p>
            <p className="mt-1 text-zinc-400">
              Akun <strong className="text-zinc-200">"{userToDelete.name}"</strong> (
              <code className="text-zinc-300 font-mono">{userToDelete.username}</code>) dari{" "}
              <span className="text-zinc-200">{userToDelete.store_name}</span> tidak akan dapat lagi masuk ke sistem Stokify.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Menghapus...
              </>
            ) : (
              "Hapus Akun Pengguna"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
