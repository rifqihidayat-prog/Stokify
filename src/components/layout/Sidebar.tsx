"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Boxes,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingBag,
  Store,
  Warehouse,
  Loader2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutUser, type AuthUser } from "@/actions/auth";

const BASE_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Stok & Multi-Store", icon: Boxes },
  { href: "/requests", label: "Permintaan & SJ", icon: PackageSearch },
  { href: "/ledger", label: "Buku Kas Mutasi", icon: FileSpreadsheet },
  { href: "/equipment", label: "Pengadaan Alat", icon: ShoppingBag },
];

const ADMIN_NAV = [
  { href: "/users", label: "Kelola Pengguna", icon: Users },
];

export function Sidebar({
  user,
  collapsed,
  onToggle,
}: {
  user: AuthUser;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutUser();
  };

  const navItems = BASE_NAV.map((item) => {
    if (item.href === "/inventory" && user.role === "STAF_TOKO") {
      return { ...item, label: "Stok Toko" };
    }
    return item;
  });

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/[0.06] bg-[#0C0F15]/95 backdrop-blur-md transition-all duration-300 lg:flex",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Brand Logo Header */}
      <div
        className={cn(
          "flex h-16 items-center gap-3 border-b border-white/[0.06] px-4",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 shadow-sm shadow-amber-500/25 border border-amber-300/40">
          <Warehouse className="h-5 w-5 stroke-[2.5]" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-bold tracking-tight text-zinc-100">Stokify</p>
              <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/25">
                OPS
              </span>
            </div>
            <p className="truncate text-xs text-zinc-400">Logistics Operations Hub</p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                collapsed && "justify-center",
                active
                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/25 font-semibold shadow-amber-glow-subtle"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active ? "text-amber-400" : "text-zinc-400")} />
              {!collapsed && label}
            </Link>
          );
        })}

        {user.role === "ADMIN_PUSAT" && (
          <div className="pt-3 mt-3 border-t border-white/[0.06] space-y-1.5">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Administrasi Sistem
              </p>
            )}
            {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    collapsed && "justify-center",
                    active
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/25 font-semibold shadow-amber-glow-subtle"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", active ? "text-amber-400" : "text-zinc-400")} />
                  {!collapsed && label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Profile & Account Footer */}
      <div className="border-t border-white/[0.06] p-3 space-y-2">
        {/* Logged in User Card */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl bg-[#121620] border border-white/[0.06] p-2.5",
            collapsed && "justify-center p-2"
          )}
          title={collapsed ? `${user.name} (${user.store_name})` : undefined}
        >
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
              user.role === "ADMIN_PUSAT"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-sky-500/10 text-sky-400 border-sky-500/30"
            )}
          >
            {user.role === "ADMIN_PUSAT" ? (
              <Warehouse className="h-4 w-4" />
            ) : (
              <Store className="h-4 w-4" />
            )}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="truncate text-xs font-bold text-zinc-100">{user.name}</p>
              </div>
              <p className="truncate text-[11px] text-zinc-400 font-medium">
                {user.store_name}
              </p>
              <div className="mt-1">
                <span
                  className={cn(
                    "inline-block rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider border",
                    user.role === "ADMIN_PUSAT"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                      : "bg-sky-500/10 text-sky-400 border-sky-500/25"
                  )}
                >
                  {user.role === "ADMIN_PUSAT" ? "Admin Pusat" : "Staf Toko"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400/80 transition-colors hover:bg-rose-500/10 hover:text-rose-300 border border-transparent hover:border-rose-500/20 disabled:opacity-50",
            collapsed && "justify-center"
          )}
          title="Keluar dari akun"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
          ) : (
            <LogOut className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          {!collapsed && <span>{isLoggingOut ? "Mengeluarkan..." : "Keluar Akun"}</span>}
        </button>

        {/* Collapse Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-200",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>Ciutkan Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
