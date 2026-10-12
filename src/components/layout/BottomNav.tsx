"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, FileSpreadsheet, LayoutDashboard, PackageSearch, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Stok", icon: Boxes },
  { href: "/requests", label: "Permintaan", icon: PackageSearch },
  { href: "/ledger", label: "Mutasi", icon: FileSpreadsheet },
  { href: "/equipment", label: "Alat", icon: ShoppingBag },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[#0C0F15]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden shadow-elevated-card">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
                active ? "text-amber-300 font-semibold" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-all duration-150",
                  active
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-amber-glow-subtle"
                    : "bg-transparent"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

