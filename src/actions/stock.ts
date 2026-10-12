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

