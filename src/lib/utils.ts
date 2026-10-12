import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type StockLevel = "KRITIS" | "WARNING" | "AMAN";

/**
 * Status stok pusat:
 * - KRITIS : current <= 80% dari min_stock  -> "Perlu Restock Vendor"
 * - WARNING: 80% < current <= min_stock
 * - AMAN   : current > min_stock
 */
export function getStockStatus(current: number, min: number): StockLevel {
  if (current <= Math.ceil(min * 0.8)) return "KRITIS";
  if (current <= min) return "WARNING";
  return "AMAN";
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const DEFAULT_STORE = {
  ADMIN_PUSAT: "Pusat Warehouse",
  STAF_TOKO: "Toko Cabang Surabaya",
} as const;

export type Role = "ADMIN_PUSAT" | "STAF_TOKO";
