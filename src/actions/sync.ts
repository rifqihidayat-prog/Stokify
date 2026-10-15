"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products, storeStocks, users, type Product } from "@/db/schema";
import { fail, ok, type ActionResult } from "./types";
import { authorize } from "@/lib/authz";

const DEFAULT_SHEET_ID = process.env.GOOGLE_SHEET_ID || "1-LakqsOxhn3jbUaizBuLjNVRk_0K8B8xbBLe0RmidaU";

let lastSyncTimestamp = 0;
let isSyncInProgress = false;

export type GSheetRow = {
  sku: string;
  name: string;
  unit: string;
  isOrderable: boolean;
};

export interface SyncCoreResult {
  ok: boolean;
  message: string;
  insertedCount: number;
  updatedCount: number;
  totalRows: number;
}

/**
 * Parsing sederhana baris CSV dengan penanganan tanda kutip
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

/**
 * Core sinkronisasi produk dari Google Sheets tanpa memerlukan session user.
 * Dipakai oleh background interval, instrumentation, webhook API route, dan server actions.
 */
export async function syncProductsCore(): Promise<SyncCoreResult> {
  if (isSyncInProgress) {
    return {
      ok: false,
      message: "Proses sinkronisasi sedang berjalan.",
      insertedCount: 0,
      updatedCount: 0,
      totalRows: 0,
    };
  }

  isSyncInProgress = true;
  const sheetId = DEFAULT_SHEET_ID;

  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Gagal mengakses Google Sheets (HTTP ${response.status}). Pastikan hak akses disetel ke 'Anyone with the link can view'.`,
        insertedCount: 0,
        updatedCount: 0,
        totalRows: 0,
      };
    }

    const csvText = await response.text();
    const lines = csvText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      return {
        ok: false,
        message: "Google Sheets kosong atau tidak memiliki data.",
        insertedCount: 0,
        updatedCount: 0,
        totalRows: 0,
      };
    }

    // Baris 1: Header (SKU, Nama Barang, Satuan 1, Satuan 2, Satuan 3, Status)
    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const skuIdx = header.findIndex((h) => h.includes("sku"));
    const nameIdx = header.findIndex((h) => h.includes("nama"));
    const unitIdx = header.findIndex((h) => h.includes("satuan 1") || h === "satuan");
    const statusIdx = header.findIndex((h) => h.includes("status"));

    if (nameIdx === -1) {
      return {
        ok: false,
        message: "Kolom 'Nama Barang' tidak ditemukan di baris pertama Google Sheet.",
        insertedCount: 0,
        updatedCount: 0,
        totalRows: 0,
      };
    }

    const itemsToSync: GSheetRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const name = cols[nameIdx] ?? "";
      if (!name) continue;

      const sku = skuIdx !== -1 ? cols[skuIdx] ?? "" : "";
      const unit = unitIdx !== -1 && cols[unitIdx] ? cols[unitIdx] : "Pcs";
      const statusText = statusIdx !== -1 ? cols[statusIdx] ?? "" : "";

      // Item dianggap orderable kecuali secara spesifik bertuliskan "Tidak"
      const isOrderable = !statusText.toLowerCase().includes("tidak");

      itemsToSync.push({
        sku,
        name,
        unit,
        isOrderable,
      });
    }

    if (itemsToSync.length === 0) {
      return {
        ok: false,
        message: "Tidak ada item barang valid yang ditemukan di Google Sheet.",
        insertedCount: 0,
        updatedCount: 0,
        totalRows: 0,
      };
    }

    // Ambil data produk yang sudah ada di database
    const existingProducts = await db.select().from(products).all();
    const bySku = new Map<string, Product>();
    const byName = new Map<string, Product>();

    for (const p of existingProducts) {
      if (p.sku) bySku.set(p.sku.trim().toLowerCase(), p);
      byName.set(p.name.trim().toLowerCase(), p);
    }

    // Ambil daftar seluruh toko yang ada
    const allUsers = await db.select().from(users).all();
    const storeNames = Array.from(
      new Set(
        allUsers
          .filter((u) => u.role === "STAF_TOKO" && u.store_name)
          .map((u) => u.store_name.trim())
      )
    );

    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of itemsToSync) {
      const existing =
        (item.sku ? bySku.get(item.sku.trim().toLowerCase()) : undefined) ??
        byName.get(item.name.trim().toLowerCase());

      if (existing) {
        // Update master data tanpa merusak current_stock_central & min_stock_central
        await db
          .update(products)
          .set({
            sku: item.sku || existing.sku,
            name: item.name,
            unit: item.unit,
            is_orderable: item.isOrderable,
          })
          .where(eq(products.id, existing.id));
        updatedCount++;
      } else {
        // Tentukan kategori default
        const cat =
          item.name.toLowerCase().includes("printer") ||
          item.name.toLowerCase().includes("scanner")
            ? "EQUIPMENT"
            : "DAILY_CONSUMABLE";

        const newProdId = randomUUID();

        // Tambah produk baru dengan nilai default
        await db.insert(products).values({
          id: newProdId,
          sku: item.sku || null,
          name: item.name,
          category: cat,
          unit: item.unit,
          min_stock_central: 20, // Default minimum stok aman
          current_stock_central: 0, // Default stok awal 0
          is_orderable: item.isOrderable,
        });

        // Inisialisasi stok toko cabang dengan stok 0
        for (const sName of storeNames) {
          try {
            await db.insert(storeStocks).values({
              id: randomUUID(),
              store_name: sName,
              item_id: newProdId,
              current_stock: 0,
            });
          } catch {
            // Ignore duplicate if any
          }
        }

        insertedCount++;
      }
    }

    lastSyncTimestamp = Date.now();

    try {
      revalidatePath("/inventory");
      revalidatePath("/requests");
      revalidatePath("/");
    } catch {
      // Ignore outside request context
    }

    return {
      ok: true,
      message: `Sinkronisasi berhasil! ${itemsToSync.length} produk diproses (${insertedCount} produk baru ditambahkan, ${updatedCount} produk diperbarui).`,
      insertedCount,
      updatedCount,
      totalRows: itemsToSync.length,
    };
  } catch (error: any) {
    console.error("Error in syncProductsCore:", error);
    return {
      ok: false,
      message: `Terjadi kesalahan saat sinkronisasi: ${error.message}`,
      insertedCount: 0,
      updatedCount: 0,
      totalRows: 0,
    };
  } finally {
    isSyncInProgress = false;
  }
}

/**
 * Pemicu sinkronisasi otomatis bila data sudah kadaluarsa (misal > 2 menit)
 */
export async function autoSyncIfStale(staleThresholdMs: number = 120_000): Promise<void> {
  const now = Date.now();
  if (isSyncInProgress) return;
  if (now - lastSyncTimestamp < staleThresholdMs) return;

  try {
    await syncProductsCore();
  } catch (err) {
    console.warn("[autoSyncIfStale] Gagal melakukan auto-sync Google Sheets:", err);
  }
}

/**
 * Mengunduh dan menyinkronkan master produk dari Google Sheets manual (Admin Pusat)
 */
export async function syncProductsFromGoogleSheet(): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  const result = await syncProductsCore();
  if (!result.ok) {
    return fail(result.message);
  }

  return ok(result.message);
}
