"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products, storeRequests, mutationLogs, storeStocks, type StoreRequest, type Product } from "@/db/schema";
import { fail, ok, type ActionResult } from "./types";
import { authorize, canAccessStore, isAdmin, requireUser, resolveStoreName } from "@/lib/authz";

const VALID_STATUSES = ["PENDING", "APPROVED", "SHIPPED", "RECEIVED", "REJECTED"] as const;
type RequestStatus = (typeof VALID_STATUSES)[number];

function generateRef(prefix: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${rand}`;
}

export interface StoreRequestWithProduct extends StoreRequest {
  product: Product;
}

export interface StoreBookingDetail {
  storeName: string;
  quantity: number;
}

export interface ProductBookedInfo {
  productId: string;
  totalBooked: number;
  otherStoresBooked: number;
  breakdownOther: StoreBookingDetail[];
  breakdownAll: StoreBookingDetail[];
  otherBreakdownText: string;
  allBreakdownText: string;
}

export type BookedStockMap = Record<string, ProductBookedInfo>;

/**
 * Menghitung stok yang sedang ter-booked (berstatus PENDING) oleh toko lain maupun seluruh toko.
 */
export async function getBookedStockMap(currentUserStoreName?: string): Promise<BookedStockMap> {
  const pendingRequests = await db
    .select()
    .from(storeRequests)
    .where(eq(storeRequests.status, "PENDING"))
    .all();

  const map: BookedStockMap = {};

  for (const req of pendingRequests) {
    if (!map[req.product_id]) {
      map[req.product_id] = {
        productId: req.product_id,
        totalBooked: 0,
        otherStoresBooked: 0,
        breakdownOther: [],
        breakdownAll: [],
        otherBreakdownText: "",
        allBreakdownText: "",
      };
    }

    const item = map[req.product_id];
    item.totalBooked += req.quantity_requested;

    // Breakdown all
    const existingStoreAll = item.breakdownAll.find(
      (b) => b.storeName.toLowerCase() === req.store_name.toLowerCase()
    );
    if (existingStoreAll) {
      existingStoreAll.quantity += req.quantity_requested;
    } else {
      item.breakdownAll.push({ storeName: req.store_name, quantity: req.quantity_requested });
    }

    // Breakdown other stores
    const isOther =
      !currentUserStoreName ||
      req.store_name.toLowerCase().trim() !== currentUserStoreName.toLowerCase().trim();

    if (isOther) {
      item.otherStoresBooked += req.quantity_requested;
      const existingStoreOther = item.breakdownOther.find(
        (b) => b.storeName.toLowerCase() === req.store_name.toLowerCase()
      );
      if (existingStoreOther) {
        existingStoreOther.quantity += req.quantity_requested;
      } else {
        item.breakdownOther.push({ storeName: req.store_name, quantity: req.quantity_requested });
      }
    }
  }

  // Format ringkasan breakdown teks
  for (const pid in map) {
    const item = map[pid];
    item.allBreakdownText = item.breakdownAll
      .map((b) => `${b.storeName}: ${b.quantity}`)
      .join(", ");
    item.otherBreakdownText = item.breakdownOther
      .map((b) => `${b.storeName}: ${b.quantity}`)
      .join(", ");
  }

  return map;
}

export async function getStoreRequests(): Promise<StoreRequestWithProduct[]> {
  const user = await requireUser();
  const query = db
    .select({
      request: storeRequests,
      product: products,
    })
    .from(storeRequests)
    .innerJoin(products, eq(storeRequests.product_id, products.id))
    .orderBy(desc(storeRequests.created_at));

  const rows =
    !isAdmin(user) && user.store_name
      ? await query.where(eq(storeRequests.store_name, user.store_name)).all()
      : await query.all();

  return rows.map(({ request, product }) => ({
    ...request,
    product,
  }));
}

export interface PickingListItem {
  id: string;
  reference_no: string;
  store_name: string;
  product_id: string;
  sku: string;
  name: string;
  unit: string;
  quantity_requested: number;
  current_stock_central: number;
  status: RequestStatus;
  notes: string | null;
  created_at: Date;
}

/**
 * 3. Fitur "Picking List Request" Gudang
 * Mengambil daftar permintaan toko aktif (PENDING / APPROVED) lengkap dengan SKU dan nama barang
 */
export async function getPickingList(): Promise<PickingListItem[]> {
  await requireUser();
  const allRequests = await getStoreRequests();
  return allRequests
    .filter((r) => r.status === "PENDING" || r.status === "APPROVED")
    .map((r) => ({
      id: r.id,
      reference_no: r.reference_no || `REQ-${r.id.slice(0, 8)}`,
      store_name: r.store_name,
      product_id: r.product_id,
      sku: r.product.sku || "-",
      name: r.product.name,
      unit: r.product.unit,
      quantity_requested: r.quantity_requested,
      current_stock_central: r.product.current_stock_central,
      status: r.status,
      notes: r.notes,
      created_at: new Date(r.created_at),
    }));
}

/**
 * Fitur Toko: "Minta Barang ke Pusat (Multi-Item)"
 * Validasi: hanya mengizinkan barang dengan stok pusat > 0.
 */
export async function createMultiItemStoreRequest(data: {
  storeName: string;
  items: { productId: string; quantity: number }[];
  notes?: string;
}): Promise<ActionResult> {
  const auth = await authorize();
  if (auth.error) return auth.error;

  const { items, notes } = data;
  // Staf Toko selalu mengajukan atas nama tokonya sendiri
  const storeName = resolveStoreName(auth.user, data.storeName);

  if (!storeName) return fail("Nama toko wajib diisi.");
  if (!items || items.length === 0) return fail("Tambahkan minimal 1 item pengajuan.");

  const allProducts = await db.select().from(products).all();
  const prodMap = new Map(allProducts.map((p) => [p.id, p]));

  // Validasi seluruh item
  for (const row of items) {
    if (!row.productId) return fail("Terdapat baris barang yang belum dipilih.");
    if (!Number.isInteger(row.quantity) || row.quantity <= 0) {
      return fail("Jumlah permintaan harus berupa angka bulat positif.");
    }

    const prod = prodMap.get(row.productId);
    if (!prod) return fail("Barang tidak ditemukan di sistem.");

    if (!prod.is_orderable) {
      return fail(`Item "${prod.name}" sedang dinonaktifkan untuk pemesanan.`);
    }

    // Catatan: Toko tetap diizinkan mengajukan pemesanan meskipun stok pusat sedang 0 atau telah di-booking oleh toko lain.
    // Pengajuan akan masuk sebagai antrean berstatus PENDING di Pusat.
  }

  const refNo = generateRef("REQ");
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const row of items) {
      await tx.insert(storeRequests).values({
        id: randomUUID(),
        reference_no: refNo,
        store_name: storeName.trim(),
        product_id: row.productId,
        quantity_requested: row.quantity,
        status: "PENDING",
        notes: notes?.trim() || null,
        created_at: now,
      });
    }
  });

  revalidatePath("/requests");
  revalidatePath("/");
  return ok(`Pengajuan stok (${refNo}) sebanyak ${items.length} item berhasil dikirim ke Pusat.`);
}

/**
 * Approve request -> Potong stok pusat & terbitkan transaksi Surat Jalan (SJ) di log mutasi.
 */
export async function approveStoreRequest(requestId: string): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  const request = await db
    .select()
    .from(storeRequests)
    .where(eq(storeRequests.id, requestId))
    .get();

  if (!request) return fail("Pengajuan tidak ditemukan.");
  if (request.status !== "PENDING") {
    return fail(`Pengajuan sudah berstatus "${request.status}" dan tidak dapat disetujui.`);
  }

  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, request.product_id))
    .get();

  if (!product) return fail("Item terkait tidak ditemukan.");

  if (product.current_stock_central < request.quantity_requested) {
    return fail(
      `Stok pusat tidak mencukupi (tersisa ${product.current_stock_central} ${product.unit}). Pengajuan tidak dapat disetujui.`
    );
  }

  const sjRef = generateRef("SJ");
  const now = new Date();

  await db.transaction(async (tx) => {
    // 1. Potong stok pusat
    await tx
      .update(products)
      .set({
        current_stock_central: product.current_stock_central - request.quantity_requested,
      })
      .where(eq(products.id, product.id));

    // 2. Update status request
    await tx
      .update(storeRequests)
      .set({ status: "APPROVED" })
      .where(eq(storeRequests.id, request.id));

    // 3. Catat di mutation_logs sebagai pengiriman Surat Jalan
    await tx.insert(mutationLogs).values({
      id: randomUUID(),
      reference_no: sjRef,
      transaction_date: now,
      sender_location: "GUDANG PUSAT",
      receiver_location: request.store_name,
      item_id: product.id,
      qty: request.quantity_requested,
      notes: `Approval Pengajuan ${request.reference_no || request.id.slice(0, 8)}`,
      created_at: now,
    });

    // 4. Tambah saldo toko
    const existingStoreStock = await tx
      .select()
      .from(storeStocks)
      .where(
        and(
          eq(storeStocks.store_name, request.store_name),
          eq(storeStocks.item_id, product.id)
        )
      )
      .get();

    if (existingStoreStock) {
      await tx
        .update(storeStocks)
        .set({
          current_stock: existingStoreStock.current_stock + request.quantity_requested,
          updated_at: now,
        })
        .where(eq(storeStocks.id, existingStoreStock.id));
    } else {
      await tx.insert(storeStocks).values({
        id: randomUUID(),
        store_name: request.store_name,
        item_id: product.id,
        current_stock: request.quantity_requested,
        updated_at: now,
      });
    }
  });

  revalidatePath("/requests");
  revalidatePath("/inventory");
  revalidatePath("/");
  return ok(
    `Pengajuan "${product.name}" disetujui. Surat Jalan ${sjRef} telah diterbitkan dan stok dikirim ke ${request.store_name}.`
  );
}

export async function rejectStoreRequest(requestId: string): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  const request = await db
    .select()
    .from(storeRequests)
    .where(eq(storeRequests.id, requestId))
    .get();

  if (!request || request.status !== "PENDING") {
    return fail("Pengajuan tidak ditemukan atau sudah diproses.");
  }

  await db
    .update(storeRequests)
    .set({ status: "REJECTED" })
    .where(eq(storeRequests.id, requestId));

  revalidatePath("/requests");
  revalidatePath("/");
  return ok("Pengajuan ditolak.");
}

export async function updateRequestStatus(
  requestId: string,
  status: string
): Promise<ActionResult> {
  const auth = await authorize();
  if (auth.error) return auth.error;

  if (!VALID_STATUSES.includes(status as RequestStatus)) return fail("Status tidak valid.");
  // APPROVED / REJECTED wajib lewat approveStoreRequest / rejectStoreRequest
  // agar potong stok & surat jalan tidak terlewati.
  if (status !== "SHIPPED" && status !== "RECEIVED") {
    return fail("Gunakan tombol Approve / Reject untuk mengubah status ini.");
  }

  const request = await db
    .select()
    .from(storeRequests)
    .where(eq(storeRequests.id, requestId))
    .get();

  if (!request) return fail("Pengajuan tidak ditemukan.");

  if (status === "SHIPPED" && !isAdmin(auth.user)) {
    return fail("Hanya Admin Pusat yang dapat menandai pengiriman.");
  }
  if (status === "RECEIVED" && !canAccessStore(auth.user, request.store_name)) {
    return fail("Anda hanya dapat mengonfirmasi penerimaan untuk toko Anda sendiri.");
  }
  if (status === "SHIPPED" && request.status !== "APPROVED") {
    return fail("Pengajuan harus di-approve dulu sebelum dikirim.");
  }
  if (status === "RECEIVED" && request.status !== "SHIPPED") {
    return fail("Pengajuan harus berstatus SHIPPED sebelum diterima.");
  }

  await db
    .update(storeRequests)
    .set({ status: status as RequestStatus })
    .where(eq(storeRequests.id, requestId));

  revalidatePath("/requests");
  revalidatePath("/");
  return ok(`Status pengajuan diperbarui menjadi "${status}".`);
}

/**
 * Admin Pusat menghapus riwayat pengajuan stok toko.
 */
export async function deleteStoreRequest(requestId: string): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  if (!requestId) return fail("ID pengajuan tidak valid.");

  const request = await db
    .select()
    .from(storeRequests)
    .where(eq(storeRequests.id, requestId))
    .get();

  if (!request) return fail("Pengajuan tidak ditemukan.");

  await db.delete(storeRequests).where(eq(storeRequests.id, requestId));

  revalidatePath("/requests");
  revalidatePath("/");
  return ok("Data pengajuan stok berhasil dihapus.");
}


