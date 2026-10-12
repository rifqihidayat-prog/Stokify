"use server";

import { randomUUID } from "node:crypto";
import { eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products, type Product } from "@/db/schema";
import { fail, ok, type ActionResult } from "./types";
import { authorize } from "@/lib/authz";

const DEFAULT_SHEET_ID = process.env.GOOGLE_SHEET_ID || "1-LakqsOxhn3jbUaizBuLjNVRk_0K8B8xbBLe0RmidaU";

export type GSheetRow = {
  sku: string;
  name: string;
  unit: string;
  isOrderable: boolean;
};

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
 * Mengunduh dan menyinkronkan master produk dari Google Sheets
 */
export async function syncProductsFromGoogleSheet(): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  // Sheet ID hanya dari konfigurasi server, tidak dari input client
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
      return fail(
        `Gagal mengakses Google Sheets (HTTP ${response.status}). Pastikan hak akses disetel ke "Anyone with the link can view".`
      );
    }

    const csvText = await response.text();
    const lines = csvText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      return fail("Google Sheets kosong atau tidak memiliki data.");
    }

    // Baris 1: Header (SKU, Nama Barang, Satuan 1, Satuan 2, Satuan 3, Status)
    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const skuIdx = header.findIndex((h) => h.includes("sku"));
    const nameIdx = header.findIndex((h) => h.includes("nama"));
    const unitIdx = header.findIndex((h) => h.includes("satuan 1") || h === "satuan");
    const statusIdx = header.findIndex((h) => h.includes("status"));

    if (nameIdx === -1) {
      return fail("Kolom 'Nama Barang' tidak ditemukan di baris pertama Google Sheet.");
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
      return fail("Tidak ada item barang valid yang ditemukan di Google Sheet.");
    }

    // Ambil data produk yang sudah ada di database
    const existingProducts = await db.select().from(products).all();
    const bySku = new Map<string, Product>();
    const byName = new Map<string, Product>();

    for (const p of existingProducts) {
      if (p.sku) bySku.set(p.sku.trim().toLowerCase(), p);
      byName.set(p.name.trim().toLowerCase(), p);
    }

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
        // Tentukan kategori default: jika ada kata "chemical", "tali", "struk", "label", "plastik" -> DAILY_CONSUMABLE
        const cat =
          item.name.toLowerCase().includes("printer") ||
          item.name.toLowerCase().includes("scanner")
            ? "EQUIPMENT"
            : "DAILY_CONSUMABLE";

        // Tambah produk baru dengan nilai default
        await db.insert(products).values({
          id: randomUUID(),
          sku: item.sku || null,
          name: item.name,
          category: cat,
          unit: item.unit,
          min_stock_central: 20, // Default minimum stok aman
          current_stock_central: 50, // Default stok awal
          is_orderable: item.isOrderable,
        });
        insertedCount++;
      }
    }

    try {
      revalidatePath("/inventory");
      revalidatePath("/requests");
      revalidatePath("/");
    } catch {
      // Ignore when running outside Next.js request context
    }

    return ok(
      `Sinkronisasi berhasil! ${itemsToSync.length} produk diproses (${insertedCount} produk baru ditambahkan, ${updatedCount} produk diperbarui).`
    );

  } catch (error: any) {
    console.error("Error syncing Google Sheet:", error);
    return fail(`Terjadi kesalahan saat sinkronisasi: ${error.message}`);
  }
}
