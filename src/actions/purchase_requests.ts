"use server";

import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products, purchaseRequests, type Product, type PurchaseRequest } from "@/db/schema";
import { fail, ok, type ActionResult } from "./types";
import { authorize } from "@/lib/authz";

function generateRef(prefix: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${rand}`;
}

export interface PurchaseRequestWithProduct extends PurchaseRequest {
  product: Product;
}

/**
 * Mengambil seluruh PR yang sedang aktif (berstatus PENDING)
 */
export async function getActivePurchaseRequests(): Promise<PurchaseRequestWithProduct[]> {
  const rows = await db
    .select({
      request: purchaseRequests,
      product: products,
    })
    .from(purchaseRequests)
    .innerJoin(products, eq(purchaseRequests.product_id, products.id))
    .where(eq(purchaseRequests.status, "PENDING"))
    .orderBy(desc(purchaseRequests.created_at))
    .all();

  return rows.map(({ request, product }) => ({
    ...request,
    product,
  }));
}

/**
 * Mengambil histori semua PR (PENDING, COMPLETED, CANCELLED)
 */
export async function getAllPurchaseRequests(): Promise<PurchaseRequestWithProduct[]> {
  const rows = await db
    .select({
      request: purchaseRequests,
      product: products,
    })
    .from(purchaseRequests)
    .innerJoin(products, eq(purchaseRequests.product_id, products.id))
    .orderBy(desc(purchaseRequests.created_at))
    .all();

  return rows.map(({ request, product }) => ({
    ...request,
    product,
  }));
}

/**
 * Membuat Purchase Request (PR) baru untuk item yang perlu diorder ke vendor
 */
export async function createPurchaseRequest(data: {
  productId: string;
  quantity: number;
  supplierName?: string;
  notes?: string;
}): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  const { productId, quantity, supplierName, notes } = data;

  if (!productId) return fail("Item barang harus dipilih.");
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return fail("Jumlah order pengadaan harus berupa angka bulat positif.");
  }

  const prod = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!prod) return fail("Item barang tidak ditemukan di sistem.");

  const prNumber = generateRef("PR");
  const now = new Date();

  await db.insert(purchaseRequests).values({
    id: randomUUID(),
    pr_number: prNumber,
    product_id: productId,
    quantity,
    supplier_name: supplierName?.trim() || null,
    notes: notes?.trim() || null,
    status: "PENDING",
    created_by: auth.user.name || auth.user.username,
    created_at: now,
  });

  revalidatePath("/inventory");
  revalidatePath("/requests");
  revalidatePath("/");

  return ok(`Purchase Request (${prNumber}) untuk "${prod.name}" sebanyak ${quantity} ${prod.unit} berhasil diterbitkan.`);
}

/**
 * Membatalkan Purchase Request (status CANCELLED)
 */
export async function cancelPurchaseRequest(prId: string): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  const pr = await db
    .select()
    .from(purchaseRequests)
    .where(eq(purchaseRequests.id, prId))
    .get();

  if (!pr) return fail("Purchase Request tidak ditemukan.");
  if (pr.status !== "PENDING") {
    return fail(`Purchase Request sudah berstatus "${pr.status}" dan tidak dapat dibatalkan.`);
  }

  await db
    .update(purchaseRequests)
    .set({ status: "CANCELLED" })
    .where(eq(purchaseRequests.id, prId));

  revalidatePath("/inventory");
  revalidatePath("/requests");
  revalidatePath("/");

  return ok(`Purchase Request (${pr.pr_number}) berhasil dibatalkan.`);
}

/**
 * Menyelesaikan Purchase Request secara manual (status COMPLETED)
 */
export async function completePurchaseRequest(prId: string): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  const pr = await db
    .select()
    .from(purchaseRequests)
    .where(eq(purchaseRequests.id, prId))
    .get();

  if (!pr) return fail("Purchase Request tidak ditemukan.");
  if (pr.status !== "PENDING") {
    return fail(`Purchase Request sudah berstatus "${pr.status}".`);
  }

  await db
    .update(purchaseRequests)
    .set({
      status: "COMPLETED",
      completed_at: new Date(),
    })
    .where(eq(purchaseRequests.id, prId));

  revalidatePath("/inventory");
  revalidatePath("/requests");
  revalidatePath("/");

  return ok(`Purchase Request (${pr.pr_number}) ditandai selesai.`);
}
