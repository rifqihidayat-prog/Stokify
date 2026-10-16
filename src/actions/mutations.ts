"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, like, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  mutationLogs,
  products,
  storeStocks,
  users,
  purchaseRequests,
  type MutationLog,
  type Product,
} from "@/db/schema";
import { fail, ok, type ActionResult } from "./types";
import { authorize, requireUser, resolveStoreName } from "@/lib/authz";

export interface ActivePRInfo {
  id: string;
  pr_number: string;
  quantity: number;
  supplier_name: string | null;
  notes: string | null;
  created_at: Date;
}

export interface CentralStockCardItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  category: string;
  stok_masuk: number;
  stok_keluar: number;
  sisa_stok_realtime: number;
  min_stock_central: number;
  status: "KRITIS" | "WARNING" | "AMAN" | "PR_CREATED";
  status_text: string;
  active_pr?: ActivePRInfo | null;
}

export interface StoreStockCardItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  category: string;
  stok_masuk: number;
  stok_keluar: number;
  sisa_stok_realtime: number;
  min_stock_store: number;
  status: "KRITIS" | "WARNING" | "AMAN";
}

export interface StoreStockGroup {
  store_name: string;
  total_items: number;
  low_stock_count: number;
  items: StoreStockCardItem[];
}

export interface DateFilter {
  month?: number; // 1 - 12
  year?: number; // 2024 - 2027
}

function generateRef(prefix: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${rand}`;
}

/**
 * A. KARTU STOK PUSAT (Gudang Utama)
 * Menghitung Stok Masuk (+), Stok Keluar (-), dan Sisa Stok Realtime secara dinamis dari ledger transaksi.
 * WAJIB menampilkan SELURUH barang dari Master Barang, meskipun stoknya 0.
 */
export async function getCentralStockCard(filters?: DateFilter): Promise<CentralStockCardItem[]> {
  await requireUser();
  const [allProducts, allLogs, activePRs] = await Promise.all([
    db.select().from(products).all(),
    db.select().from(mutationLogs).all(),
    db.select().from(purchaseRequests).where(eq(purchaseRequests.status, "PENDING")).all(),
  ]);

  const prByProduct = new Map<string, ActivePRInfo>();
  for (const pr of activePRs) {
    if (!prByProduct.has(pr.product_id)) {
      prByProduct.set(pr.product_id, {
        id: pr.id,
        pr_number: pr.pr_number,
        quantity: pr.quantity,
        supplier_name: pr.supplier_name,
        notes: pr.notes,
        created_at: new Date(pr.created_at),
      });
    }
  }

  // Filter logs by month/year if provided
  const filteredLogs = allLogs.filter((log) => {
    if (!filters) return true;
    const date = new Date(log.transaction_date);
    if (filters.year && date.getFullYear() !== filters.year) return false;
    if (filters.month && date.getMonth() + 1 !== filters.month) return false;
    return true;
  });

  return allProducts.map((prod) => {
    const prodLogs = filteredLogs.filter((l) => l.item_id === prod.id);

    // Stok Masuk (+): IN-SUPPLIER + ADJ-PUSAT
    const stok_masuk = prodLogs
      .filter(
        (l) =>
          l.reference_no.startsWith("IN-SUPPLIER") ||
          l.reference_no.startsWith("ADJ-PUSAT")
      )
      .reduce((sum, l) => sum + l.qty, 0);

    // Stok Keluar (-): Surat Jalan SJ dari Pusat ke Toko Cabang
    const stok_keluar = prodLogs
      .filter((l) => l.reference_no.startsWith("SJ-"))
      .reduce((sum, l) => sum + l.qty, 0);

    const sisa_stok_realtime = Math.max(0, stok_masuk - stok_keluar);
    const active_pr = prByProduct.get(prod.id) || null;

    let status: "KRITIS" | "WARNING" | "AMAN" | "PR_CREATED" = "AMAN";
    let status_text = "STOK AMAN";

    const isLowStock = sisa_stok_realtime <= prod.min_stock_central;

    if (active_pr) {
      status = "PR_CREATED";
      status_text = `SUDAH DIBUAT PR (${active_pr.pr_number} • ${active_pr.quantity} ${prod.unit})`;
    } else if (isLowStock) {
      status = "KRITIS";
      status_text = "BELUM DIBUAT PR - SEGERA ORDER";
    } else if (sisa_stok_realtime <= Math.ceil(prod.min_stock_central * 1.25)) {
      status = "WARNING";
      status_text = "PERLU MONITOR";
    }

    return {
      id: prod.id,
      sku: prod.sku || "-",
      name: prod.name,
      unit: prod.unit,
      category: prod.category,
      stok_masuk,
      stok_keluar,
      sisa_stok_realtime,
      min_stock_central: prod.min_stock_central,
      status,
      status_text,
      active_pr,
    };
  });
}

/**
 * B. KARTU STOK TOKO (Multi-Store Accordion)
 * Stok Masuk (+): Akumulasi SJ dari Pusat ke Toko + ADJ-TOKO
 * Stok Keluar (-): MURNI akumulasi transaksi CLOSING Toko.
 */
export async function getStoreStockCards(filters?: DateFilter): Promise<StoreStockGroup[]> {
  const currentUser = await requireUser();
  const allProducts = await db.select().from(products).all();
  const allLogs = await db.select().from(mutationLogs).all();
  const allStoreStocks = await db.select().from(storeStocks).all();
  const allUsers = await db.select().from(users).all();

  // Ambil daftar toko unik: untuk STAF_TOKO HANYA toko miliknya sendiri
  const storeNames = new Set<string>();

  if (currentUser.role === "STAF_TOKO") {
    if (currentUser.store_name) {
      storeNames.add(currentUser.store_name);
    }
  } else {
    allLogs.forEach((l) => {
      if (l.receiver_location && !["GUDANG PUSAT", "CLOSING"].includes(l.receiver_location) && !l.receiver_location.startsWith("SUPPLIER")) {
        storeNames.add(l.receiver_location);
      }
      if (l.sender_location && !["GUDANG PUSAT", "CLOSING"].includes(l.sender_location) && !l.sender_location.startsWith("SUPPLIER")) {
        storeNames.add(l.sender_location);
      }
    });
    allStoreStocks.forEach((s) => {
      if (s.store_name) storeNames.add(s.store_name);
    });
    allUsers.forEach((u) => {
      if (u.role === "STAF_TOKO" && u.store_name) {
        storeNames.add(u.store_name);
      }
    });

    // Default pastikan toko cabang utama ada
    if (storeNames.size === 0) {
      storeNames.add("Toko Cabang Surabaya");
      storeNames.add("Toko Cabang Bandung");
    }
  }

  const result: StoreStockGroup[] = [];

  for (const storeName of Array.from(storeNames).sort()) {
    const items: StoreStockCardItem[] = [];
    let lowCount = 0;

    for (const prod of allProducts) {
      const storeLogs = allLogs.filter((l) => {
        if (l.item_id !== prod.id) return false;
        if (filters) {
          const date = new Date(l.transaction_date);
          if (filters.year && date.getFullYear() !== filters.year) return false;
          if (filters.month && date.getMonth() + 1 !== filters.month) return false;
        }
        return true;
      });

      // Stok Masuk (+): SJ- ke toko ini + ADJ-TOKO di toko ini
      const stok_masuk = storeLogs
        .filter(
          (l) =>
            (l.reference_no.startsWith("SJ-") && l.receiver_location === storeName) ||
            (l.reference_no.startsWith("ADJ-TOKO") && l.sender_location === storeName)
        )
        .reduce((sum, l) => sum + l.qty, 0);

      // Stok Keluar (-): MURNI transaksi CLOSING toko ini
      const stok_keluar = storeLogs
        .filter(
          (l) =>
            l.reference_no.startsWith("CLOSING") &&
            l.sender_location === storeName
        )
        .reduce((sum, l) => sum + l.qty, 0);

      const sisa_stok_realtime = Math.max(0, stok_masuk - stok_keluar);
      const isStoreItem = allStoreStocks.some(
        (s) => s.store_name === storeName && s.item_id === prod.id
      );

      // Tampilkan jika barang ini pernah dikirim, ada mutasi, terdaftar di store_stocks, atau jika akun staf toko
      if (stok_masuk > 0 || stok_keluar > 0 || sisa_stok_realtime > 0 || isStoreItem || currentUser.role === "STAF_TOKO") {
        let status: "KRITIS" | "WARNING" | "AMAN" = "AMAN";
        if (sisa_stok_realtime <= prod.min_stock_store) {
          status = "KRITIS";
          lowCount++;
        }

        items.push({
          id: prod.id,
          sku: prod.sku || "-",
          name: prod.name,
          unit: prod.unit,
          category: prod.category,
          stok_masuk,
          stok_keluar,
          sisa_stok_realtime,
          min_stock_store: prod.min_stock_store,
          status,
        });
      }
    }

    result.push({
      store_name: storeName,
      total_items: items.length,
      low_stock_count: lowCount,
      items,
    });
  }

  return result;
}

export interface SupplierInflowItem {
  itemId: string;
  qty: number;
}

/**
 * 1. Admin: "+ Barang Masuk Supplier / Inflow Vendor" (Single & Multi-Item)
 */
export async function createSupplierInflow(data: {
  supplierName: string;
  itemId?: string;
  qty?: number;
  items?: SupplierInflowItem[];
  notes?: string;
}): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  const { supplierName, itemId, qty, items, notes } = data;
  if (!supplierName?.trim()) return fail("Nama supplier/vendor wajib diisi.");

  // Normalisasi ke list item
  const itemList: SupplierInflowItem[] = [];
  if (items && items.length > 0) {
    for (const it of items) {
      if (it.itemId && Number(it.qty) > 0) {
        itemList.push({ itemId: it.itemId, qty: Number(it.qty) });
      }
    }
  } else if (itemId && qty && Number(qty) > 0) {
    itemList.push({ itemId, qty: Number(qty) });
  }

  if (itemList.length === 0) {
    return fail("Minimal harus ada 1 barang dengan Qty kedatangan > 0.");
  }

  // Validasi seluruh item di master data
  const productIds = itemList.map((i) => i.itemId);
  const foundProducts = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds))
    .all();

  const productMap = new Map(foundProducts.map((p) => [p.id, p]));
  for (const it of itemList) {
    if (!productMap.has(it.itemId)) {
      return fail("Ada barang yang tidak ditemukan di master data.");
    }
    if (!Number.isInteger(it.qty) || it.qty <= 0) {
      return fail("Qty setiap barang harus berupa angka positif > 0.");
    }
  }

  const refNo = generateRef("IN-SUPPLIER");
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const it of itemList) {
      const product = productMap.get(it.itemId)!;

      // 1. Catat ke mutation_logs
      await tx.insert(mutationLogs).values({
        id: randomUUID(),
        reference_no: refNo,
        transaction_date: now,
        sender_location: `SUPPLIER: ${supplierName.trim()}`,
        receiver_location: "GUDANG PUSAT",
        item_id: it.itemId,
        qty: it.qty,
        notes: notes?.trim() || `Penerimaan supplier ${supplierName.trim()}`,
        created_at: now,
      });

      // 2. Update snapshot central stock
      await tx
        .update(products)
        .set({
          current_stock_central: product.current_stock_central + it.qty,
        })
        .where(eq(products.id, it.itemId));

      // 3. Jika ada Purchase Request (PR) yang PENDING untuk item ini, otomatis tandai sebagai COMPLETED
      await tx
        .update(purchaseRequests)
        .set({
          status: "COMPLETED",
          completed_at: now,
        })
        .where(
          and(
            eq(purchaseRequests.product_id, it.itemId),
            eq(purchaseRequests.status, "PENDING")
          )
        );
    }
  });

  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/requests");
  revalidatePath("/ledger");

  const summary =
    itemList.length === 1
      ? `${itemList[0].qty} ${productMap.get(itemList[0].itemId)!.unit} ${productMap.get(itemList[0].itemId)!.name}`
      : `${itemList.length} jenis barang (${itemList.reduce((sum, i) => sum + i.qty, 0)} total unit)`;

  return ok(`Berhasil mencatat barang masuk (${refNo}): ${summary} dari ${supplierName.trim()}.`);
}

/**
 * 2. Admin: "Kirim Stok ke Toko (Multi-Item)" dengan Nomor Surat Jalan (SJ)
 */
export async function createStoreTransfer(data: {
  storeName: string;
  items: { itemId: string; qty: number }[];
  notes?: string;
}): Promise<{ ok: boolean; message: string; refNo?: string }> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  const { storeName, items, notes } = data;
  if (!storeName?.trim()) return { ok: false, message: "Pilih toko tujuan pengiriman." };
  if (!items || items.length === 0) return { ok: false, message: "Tambahkan minimal 1 baris barang." };

  const allProducts = await db.select().from(products).all();
  const prodMap = new Map(allProducts.map((p) => [p.id, p]));

  // Validasi kecukupan stok pusat untuk seluruh item
  for (const row of items) {
    if (!row.itemId) return { ok: false, message: "Terdapat baris barang yang belum dipilih." };
    if (!Number.isInteger(row.qty) || row.qty <= 0) return { ok: false, message: "Qty pengiriman harus angka positif." };

    const prod = prodMap.get(row.itemId);
    if (!prod) return { ok: false, message: "Barang tidak ditemukan di master data." };
    if (prod.current_stock_central < row.qty) {
      return {
        ok: false,
        message: `Stok pusat untuk "${prod.name}" tidak mencukupi (tersedia: ${prod.current_stock_central} ${prod.unit}, diminta: ${row.qty}).`,
      };
    }
  }

  const refNo = generateRef("SJ");
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const row of items) {
      const prod = prodMap.get(row.itemId)!;

      // 1. Catat ke mutation_logs
      await tx.insert(mutationLogs).values({
        id: randomUUID(),
        reference_no: refNo,
        transaction_date: now,
        sender_location: "GUDANG PUSAT",
        receiver_location: storeName.trim(),
        item_id: row.itemId,
        qty: row.qty,
        notes: notes?.trim() || `Pengiriman Surat Jalan ke ${storeName}`,
        created_at: now,
      });

      // 2. Potong stok pusat
      await tx
        .update(products)
        .set({
          current_stock_central: prod.current_stock_central - row.qty,
        })
        .where(eq(products.id, row.itemId));

      // 3. Tambah/update store_stocks
      const existingStoreStock = await tx
        .select()
        .from(storeStocks)
        .where(and(eq(storeStocks.store_name, storeName), eq(storeStocks.item_id, row.itemId)))
        .get();

      if (existingStoreStock) {
        await tx
          .update(storeStocks)
          .set({
            current_stock: existingStoreStock.current_stock + row.qty,
            updated_at: now,
          })
          .where(eq(storeStocks.id, existingStoreStock.id));
      } else {
        await tx.insert(storeStocks).values({
          id: randomUUID(),
          store_name: storeName,
          item_id: row.itemId,
          current_stock: row.qty,
          updated_at: now,
        });
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/requests");
  return {
    ok: true,
    message: `Surat Jalan ${refNo} berhasil diterbitkan (${items.length} item dikirim ke ${storeName}).`,
    refNo,
  };
}

/**
 * 3. Toko: "Input Closing Stok Harian (Multi-Item)"
 */
export async function createStoreDailyClosing(data: {
  storeName: string;
  items: { itemId: string; qtyUsed: number }[];
  notes?: string;
}): Promise<ActionResult> {
  const auth = await authorize();
  if (auth.error) return auth.error;

  const { items, notes } = data;
  // Staf Toko hanya boleh closing untuk tokonya sendiri
  if (auth.user.role === "STAF_TOKO") {
    if (data.storeName && data.storeName.trim() !== auth.user.store_name) {
      return fail(`Anda hanya dapat mencatat closing untuk toko Anda sendiri (${auth.user.store_name}).`);
    }
  }

  const storeName = resolveStoreName(auth.user, data.storeName);
  if (!storeName) return fail("Nama toko wajib disertakan.");
  if (!items || items.length === 0) return fail("Tambahkan minimal 1 baris item closing.");

  const refNo = generateRef("CLOSING");
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const row of items) {
      if (!row.itemId || !Number.isInteger(row.qtyUsed) || row.qtyUsed <= 0) continue;

      // 1. Catat transaksi CLOSING di ledger
      await tx.insert(mutationLogs).values({
        id: randomUUID(),
        reference_no: refNo,
        transaction_date: now,
        sender_location: storeName,
        receiver_location: "CLOSING",
        item_id: row.itemId,
        qty: row.qtyUsed,
        notes: notes?.trim() || `Closing pemakaian harian toko ${storeName}`,
        created_at: now,
      });

      // 2. Update saldo fisik toko
      const existing = await tx
        .select()
        .from(storeStocks)
        .where(and(eq(storeStocks.store_name, storeName), eq(storeStocks.item_id, row.itemId)))
        .get();

      if (existing) {
        await tx
          .update(storeStocks)
          .set({
            current_stock: Math.max(0, existing.current_stock - row.qtyUsed),
            updated_at: now,
          })
          .where(eq(storeStocks.id, existing.id));
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/inventory");
  return ok(`Berhasil mencatat closing harian (${refNo}) untuk ${storeName}.`);
}

/**
 * 4. Admin: "Stock Adjustment Toko (Opname Fisik)"
 * Hanya Admin Pusat yang memiliki wewenang penyesuaian/opname fisik stok toko.
 */
export async function createStoreAdjustment(data: {
  storeName: string;
  itemId: string;
  qtyAdjusted: number;
  reason: string;
}): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  const { itemId, qtyAdjusted, reason } = data;
  const storeName = resolveStoreName(auth.user, data.storeName);
  if (!storeName) return fail("Nama toko wajib diisi.");
  if (!itemId) return fail("Pilih barang yang disesuaikan.");
  if (!qtyAdjusted || !Number.isInteger(qtyAdjusted)) return fail("Nilai penyesuaian harus berupa angka bulat.");
  if (!reason?.trim()) return fail("Alasan / keterangan adjustment wajib diisi untuk keperluan audit.");

  const refNo = generateRef("ADJ-TOKO");
  const now = new Date();

  await db.transaction(async (tx) => {
    // 1. Catat ke ledger
    await tx.insert(mutationLogs).values({
      id: randomUUID(),
      reference_no: refNo,
      transaction_date: now,
      sender_location: storeName,
      receiver_location: storeName,
      item_id: itemId,
      qty: qtyAdjusted,
      notes: reason.trim(),
      created_at: now,
    });

    // 2. Update store_stocks
    const existing = await tx
      .select()
      .from(storeStocks)
      .where(and(eq(storeStocks.store_name, storeName), eq(storeStocks.item_id, itemId)))
      .get();

    if (existing) {
      await tx
        .update(storeStocks)
        .set({
          current_stock: Math.max(0, existing.current_stock + qtyAdjusted),
          updated_at: now,
        })
        .where(eq(storeStocks.id, existing.id));
    } else {
      await tx.insert(storeStocks).values({
        id: randomUUID(),
        store_name: storeName,
        item_id: itemId,
        current_stock: Math.max(0, qtyAdjusted),
        updated_at: now,
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/inventory");
  return ok(`Adjustment toko (${refNo}) berhasil dicatat.`);
}

/**
 * 5. Admin: "Stock Adjustment Pusat"
 */
export async function createCentralAdjustment(data: {
  itemId: string;
  qtyAdjusted: number;
  reason: string;
}): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  const { itemId, qtyAdjusted, reason } = data;
  if (!itemId) return fail("Pilih barang master.");
  if (!qtyAdjusted || !Number.isInteger(qtyAdjusted)) return fail("Nilai penyesuaian harus angka bulat.");
  if (!reason?.trim()) return fail("Alasan adjustment pusat wajib diisi.");

  const prod = await db.select().from(products).where(eq(products.id, itemId)).get();
  if (!prod) return fail("Barang tidak ditemukan.");

  const refNo = generateRef("ADJ-PUSAT");
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(mutationLogs).values({
      id: randomUUID(),
      reference_no: refNo,
      transaction_date: now,
      sender_location: "GUDANG PUSAT",
      receiver_location: "GUDANG PUSAT",
      item_id: itemId,
      qty: qtyAdjusted,
      notes: reason.trim(),
      created_at: now,
    });

    await tx
      .update(products)
      .set({
        current_stock_central: Math.max(0, prod.current_stock_central + qtyAdjusted),
      })
      .where(eq(products.id, itemId));
  });

  revalidatePath("/");
  revalidatePath("/inventory");
  return ok(`Adjustment gudang pusat (${refNo}) berhasil dicatat.`);
}

export interface MutationLedgerItem {
  id: string;
  reference_no: string;
  transaction_date: Date;
  sender_location: string;
  receiver_location: string;
  item_id: string;
  item_sku: string;
  item_name: string;
  item_unit: string;
  qty: number;
  notes: string | null;
  type: "IN-SUPPLIER" | "SJ" | "CLOSING" | "ADJ-TOKO" | "ADJ-PUSAT" | "OTHER";
}

/**
 * 6. Query Ledger Mutasi Terverifikasi dengan Sorting DESC & Pagination (20 baris/halaman)
 */
export async function getMutationLedger(
  filters?: {
    month?: number;
    year?: number;
    search?: string;
    type?: string;
    storeName?: string;
  },
  page: number = 1,
  pageSize: number = 20
): Promise<{
  data: MutationLedgerItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await requireUser();
  const allLogs = await db
    .select({
      log: mutationLogs,
      prod: products,
    })
    .from(mutationLogs)
    .innerJoin(products, eq(mutationLogs.item_id, products.id))
    .orderBy(desc(mutationLogs.transaction_date), desc(mutationLogs.created_at))
    .all();

  // Filter in-memory
  let filtered = allLogs.filter(({ log, prod }) => {
    if (!filters) return true;
    const date = new Date(log.transaction_date);

    if (filters.year && date.getFullYear() !== filters.year) return false;
    if (filters.month && date.getMonth() + 1 !== filters.month) return false;

    if (filters.type && filters.type !== "ALL") {
      if (!log.reference_no.startsWith(filters.type)) return false;
    }

    if (filters.storeName && filters.storeName !== "ALL") {
      if (log.sender_location !== filters.storeName && log.receiver_location !== filters.storeName) {
        return false;
      }
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchSku = prod.sku?.toLowerCase().includes(q) ?? false;
      const matchName = prod.name.toLowerCase().includes(q);
      const matchRef = log.reference_no.toLowerCase().includes(q);
      const matchSender = log.sender_location.toLowerCase().includes(q);
      const matchReceiver = log.receiver_location.toLowerCase().includes(q);
      if (!matchSku && !matchName && !matchRef && !matchSender && !matchReceiver) return false;
    }

    return true;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  const data: MutationLedgerItem[] = paginated.map(({ log, prod }) => {
    let type: MutationLedgerItem["type"] = "OTHER";
    if (log.reference_no.startsWith("IN-SUPPLIER")) type = "IN-SUPPLIER";
    else if (log.reference_no.startsWith("SJ-")) type = "SJ";
    else if (log.reference_no.startsWith("CLOSING")) type = "CLOSING";
    else if (log.reference_no.startsWith("ADJ-TOKO")) type = "ADJ-TOKO";
    else if (log.reference_no.startsWith("ADJ-PUSAT")) type = "ADJ-PUSAT";

    return {
      id: log.id,
      reference_no: log.reference_no,
      transaction_date: new Date(log.transaction_date),
      sender_location: log.sender_location,
      receiver_location: log.receiver_location,
      item_id: prod.id,
      item_sku: prod.sku || "-",
      item_name: prod.name,
      item_unit: prod.unit,
      qty: log.qty,
      notes: log.notes,
      type,
    };
  });

  return {
    data,
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

/**
 * 7. Admin: "Audit Log Riwayat Adjustment Toko" (ADJ-TOKO)
 */
export async function getAuditAdjustments(
  filters?: { month?: number; year?: number; storeName?: string },
  page: number = 1,
  pageSize: number = 20
) {
  return getMutationLedger(
    {
      ...filters,
      type: "ADJ-TOKO",
    },
    page,
    pageSize
  );
}

/**
 * 8. Admin: "Akses Hapus & Rollback Transaksi Mutasi"
 * Menghapus baris mutasi dan mengembalikan efek stok ke kondisi sebelumnya.
 */
export async function rollbackMutation(logId: string): Promise<ActionResult> {
  const auth = await authorize("ADMIN_PUSAT");
  if (auth.error) return auth.error;

  if (!logId) return fail("ID mutasi tidak valid.");

  const log = await db.select().from(mutationLogs).where(eq(mutationLogs.id, logId)).get();
  if (!log) return fail("Transaksi mutasi tidak ditemukan.");

  const prod = await db.select().from(products).where(eq(products.id, log.item_id)).get();

  await db.transaction(async (tx) => {
    // 1. Rollback efek saldo jika relevan
    if (prod) {
      if (log.reference_no.startsWith("IN-SUPPLIER") || log.reference_no.startsWith("ADJ-PUSAT")) {
        // Rollback: kurangi stok pusat kembali
        await tx
          .update(products)
          .set({
            current_stock_central: Math.max(0, prod.current_stock_central - log.qty),
          })
          .where(eq(products.id, prod.id));
      } else if (log.reference_no.startsWith("SJ-")) {
        // Rollback: kembalikan stok ke pusat, kurangi stok toko
        await tx
          .update(products)
          .set({
            current_stock_central: prod.current_stock_central + log.qty,
          })
          .where(eq(products.id, prod.id));

        const storeStock = await tx
          .select()
          .from(storeStocks)
          .where(
            and(
              eq(storeStocks.store_name, log.receiver_location),
              eq(storeStocks.item_id, log.item_id)
            )
          )
          .get();

        if (storeStock) {
          await tx
            .update(storeStocks)
            .set({
              current_stock: Math.max(0, storeStock.current_stock - log.qty),
              updated_at: new Date(),
            })
            .where(eq(storeStocks.id, storeStock.id));
        }
      } else if (log.reference_no.startsWith("CLOSING")) {
        // Rollback: kembalikan pemakaian closing ke stok toko
        const storeStock = await tx
          .select()
          .from(storeStocks)
          .where(
            and(
              eq(storeStocks.store_name, log.sender_location),
              eq(storeStocks.item_id, log.item_id)
            )
          )
          .get();

        if (storeStock) {
          await tx
            .update(storeStocks)
            .set({
              current_stock: storeStock.current_stock + log.qty,
              updated_at: new Date(),
            })
            .where(eq(storeStocks.id, storeStock.id));
        }
      } else if (log.reference_no.startsWith("ADJ-TOKO")) {
        const storeStock = await tx
          .select()
          .from(storeStocks)
          .where(
            and(
              eq(storeStocks.store_name, log.sender_location),
              eq(storeStocks.item_id, log.item_id)
            )
          )
          .get();

        if (storeStock) {
          await tx
            .update(storeStocks)
            .set({
              current_stock: Math.max(0, storeStock.current_stock - log.qty),
              updated_at: new Date(),
            })
            .where(eq(storeStocks.id, storeStock.id));
        }
      }
    }

    // 2. Hapus baris transaksi dari ledger
    await tx.delete(mutationLogs).where(eq(mutationLogs.id, logId));
  });

  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/requests");
  return ok(`Transaksi ${log.reference_no} berhasil dihapus dan saldo stok telah di-rollback.`);
}
