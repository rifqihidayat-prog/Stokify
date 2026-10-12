"use client";

import { useState } from "react";
import Link from "next/link";
import { Warehouse, Store, LogOut, Loader2, Users } from "lucide-react";
import { logoutUser, type AuthUser } from "@/actions/auth";

export function TopBar({ user }: { user: AuthUser }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutUser();
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#0C0F15]/90 px-4 backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 shadow-sm shadow-amber-500/25 border border-amber-300/40">
          {user.role === "ADMIN_PUSAT" ? (
            <Warehouse className="h-4 w-4 stroke-[2.5]" />
          ) : (
            <Store className="h-4 w-4 stroke-[2.5]" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold tracking-tight text-zinc-100 truncate">{user.name}</p>
          </div>
          <p className="text-[11px] leading-tight text-zinc-400 truncate">
            {user.store_name} · {user.role === "ADMIN_PUSAT" ? "Admin Pusat" : "Staf Toko"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user.role === "ADMIN_PUSAT" && (
          <Link
            href="/users"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-amber-300 hover:border-amber-500/30 transition-colors"
            title="Kelola Pengguna"
          >
            <Users className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Pengguna</span>
          </Link>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
          title="Keluar Akun"
        >
          {isLoggingOut ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
}
