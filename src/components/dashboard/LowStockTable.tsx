import { AlertTriangle, PackageX } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RestockBadge, StockStatusBadge } from "@/components/ui/StatusBadge";
import type { LowStockItem } from "@/actions/dashboard";

export function LowStockTable({ items }: { items: LowStockItem[] }) {
  return (
    <Card
      title="Peringatan Stok Rendah (Pusat)"
      subtitle="Item yang berada di bawah ambang batas minimum stock."
      className="overflow-x-auto"
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <PackageX className="h-10 w-10 text-emerald-400/80" />
          <p className="text-sm font-medium text-zinc-400">
            Semua stok pusat dalam kondisi aman di atas batas minimum.
          </p>
        </div>
      ) : (
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wider text-zinc-400 bg-[#0C0F15]/50">
              <th className="px-5 py-3.5">Item Master</th>
              <th className="px-5 py-3.5 text-right">Stok / Min</th>
              <th className="px-5 py-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {items.map((p) => {
              const ratio = p.min_stock_central > 0 ? Math.min(100, Math.round((p.current_stock_central / p.min_stock_central) * 100)) : 100;
              return (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="shrink-0">
                        {p.status === "KRITIS" ? (
                          <AlertTriangle className="h-4 w-4 text-rose-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                        )}
                      </span>
                      <div>
                        <p className="font-semibold text-zinc-100 text-sm">{p.name}</p>
                        <p className="text-xs text-zinc-400 font-mono">SKU: {p.sku || "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex flex-col items-end">
                      <div className="font-mono font-bold tabular-nums text-sm">
                        <span className={p.current_stock_central === 0 ? "text-rose-400 font-extrabold" : "text-zinc-100"}>
                          {p.current_stock_central}
                        </span>
                        <span className="text-zinc-500 font-normal"> / {p.min_stock_central} {p.unit}</span>
                      </div>
                      {/* Mini visual ratio bar */}
                      <div className="w-16 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.status === "KRITIS" ? "bg-rose-500" : "bg-amber-400"}`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                      <StockStatusBadge status={p.status} showDot />
                      {p.status === "KRITIS" && <RestockBadge />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}

