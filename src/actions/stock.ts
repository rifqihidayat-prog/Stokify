"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products } from "@/db/schema";
import { fail, ok, type ActionResult } from "./types";
import { authorize } from "@/lib/authz";

/**
 * Admin Pusat memperbarui stok fisik & ambang batas minimum stok pusat.
 */
export async function updateCentralStock(
  productId: string,
  newStock: number,
  newMinStock: number
): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  if (!productId) return fail("Produk tidak ditemukan.");

  const stock = Number(newStock);
  const minStock = Number(newMinStock);

  if (!Number.isInteger(stock) || stock < 0)
    return fail("Stok fisik harus berupa angka bulat >= 0.");
  if (!Number.isInteger(minStock) || minStock < 0)
    return fail("Minimum stock harus berupa angka bulat >= 0.");

  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!product) return fail("Produk tidak ditemukan.");

  await db
    .update(products)
    .set({
      current_stock_central: stock,
      min_stock_central: minStock,
    })
    .where(eq(products.id, productId));

  revalidatePath("/inventory");
  revalidatePath("/requests");
  revalidatePath("/");
  return ok(`Stok "${product.name}" diperbarui (Stok: ${stock}, Min: ${minStock}).`);
}

/**
 * Admin Pusat menghapus item dari master stok pusat.
 * Jika item memiliki riwayat pengajuan, batalkan atau hapus relasi dengan aman.
 */
export async function deleteCentralProduct(productId: string): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  if (!productId) return fail("ID produk tidak valid.");

  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!product) return fail("Produk tidak ditemukan.");

  try {
    await db.delete(products).where(eq(products.id, productId));
    revalidatePath("/inventory");
    revalidatePath("/requests");
    revalidatePath("/");
    return ok(`Item "${product.name}" berhasil dihapus.`);
  } catch (err: any) {
    // Jika ada foreign key constraint dari store_requests
    return fail(
      `Tidak dapat menghapus "${product.name}" karena terdapat data riwayat pengajuan toko terkait.`
    );
  }
}

export interface UpdateMinStockInput {
  productId: string;
  minStockCentral?: number;
  minStockStore?: number;
}

/**
 * Admin Pusat memperbarui ambang batas minimum stok (Pusat dan/atau Toko Cabang).
 */
export async function updateProductMinStock(
  input: UpdateMinStockInput
): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  const { productId, minStockCentral, minStockStore } = input;
  if (!productId) return fail("ID produk tidak valid.");

  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!product) return fail("Produk tidak ditemukan.");

  const updates: { min_stock_central?: number; min_stock_store?: number } = {};

  if (minStockCentral !== undefined) {
    const val = Number(minStockCentral);
    if (!Number.isInteger(val) || val < 0) {
      return fail("Batas minimum stok pusat harus berupa bilangan bulat >= 0.");
    }
    updates.min_stock_central = val;
  }

  if (minStockStore !== undefined) {
    const val = Number(minStockStore);
    if (!Number.isInteger(val) || val < 0) {
      return fail("Batas minimum stok toko harus berupa bilangan bulat >= 0.");
    }
    updates.min_stock_store = val;
  }

  if (Object.keys(updates).length === 0) {
    return fail("Tidak ada perubahan batas minimum stok.");
  }

  await db
    .update(products)
    .set(updates)
    .where(eq(products.id, productId));

  revalidatePath("/inventory");
  revalidatePath("/requests");
  revalidatePath("/");

  const detailParts: string[] = [];
  if (updates.min_stock_central !== undefined) {
    detailParts.push(`Pusat: ${updates.min_stock_central} ${product.unit}`);
  }
  if (updates.min_stock_store !== undefined) {
    detailParts.push(`Toko: ${updates.min_stock_store} ${product.unit}`);
  }

  return ok(
    `Batas minimum stok "${product.name}" berhasil diubah (${detailParts.join(", ")}).`
  );
}

