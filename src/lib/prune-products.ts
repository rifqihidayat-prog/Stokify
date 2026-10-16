// Pembersihan produk yang sudah tidak ada di Google Sheet (mis. produk dummy bawaan seed).
// Sengaja TIDAK memakai "use server" agar tidak ikut terekspos sebagai server action.
//
// Aturan keselamatan: tabel mutation_logs, store_stocks, store_requests, dan purchase_requests
// memakai ON DELETE CASCADE ke products, jadi menghapus produk = menghapus riwayatnya.
// Karena itu:
//  - produk TANPA riwayat sama sekali  -> dihapus
//  - produk yang punya riwayat / stok  -> TIDAK dihapus, hanya dinonaktifkan (is_orderable = false)
//  - bila terlalu banyak produk yang tampak "usang" (Sheet kemungkinan tidak lengkap / salah)
//    -> tidak ada yang disentuh sama sekali.

import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { mutationLogs, products, purchaseRequests, storeRequests, storeStocks } from "@/db/schema";

const MAX_STALE_RATIO = 0.25;
const MAX_STALE_MIN = 5;

export interface PruneResult {
  deleted: number;
  retired: number;
  skippedReason?: string;
}

export async function pruneStaleProducts(
  validSkus: Set<string>,
  validNames: Set<string>
): Promise<PruneResult> {
  const all = await db.select().from(products).all();

  const stale = all.filter((p) => {
    const matchSku = p.sku ? validSkus.has(p.sku.trim().toLowerCase()) : false;
    const matchName = validNames.has(p.name.trim().toLowerCase());
    return !matchSku && !matchName;
  });
  if (stale.length === 0) return { deleted: 0, retired: 0 };

  const limit = Math.max(MAX_STALE_MIN, Math.ceil(all.length * MAX_STALE_RATIO));
  if (stale.length > limit) {
    const skippedReason = `${stale.length} dari ${all.length} produk tidak ada di Sheet (batas ${limit}); pembersihan dilewati karena Sheet kemungkinan tidak lengkap.`;
    console.warn(`[pruneStaleProducts] ${skippedReason}`);
    return { deleted: 0, retired: 0, skippedReason };
  }

  let deleted = 0;
  let retired = 0;

  for (const p of stale) {
    const [mut] = await db.select({ n: count() }).from(mutationLogs).where(eq(mutationLogs.item_id, p.id));
    const [req] = await db.select({ n: count() }).from(storeRequests).where(eq(storeRequests.product_id, p.id));
    const [pr] = await db.select({ n: count() }).from(purchaseRequests).where(eq(purchaseRequests.product_id, p.id));
    const [stk] = await db
      .select({ n: count() })
      .from(storeStocks)
      .where(and(eq(storeStocks.item_id, p.id), ne(storeStocks.current_stock, 0)));

    const hasHistory =
      mut.n > 0 || req.n > 0 || pr.n > 0 || stk.n > 0 || p.current_stock_central !== 0;

    try {
      if (!hasHistory) {
        await db.delete(products).where(eq(products.id, p.id));
        deleted++;
      } else if (p.is_orderable) {
        await db.update(products).set({ is_orderable: false }).where(eq(products.id, p.id));
        retired++;
      }
    } catch (e) {
      console.warn(`[pruneStaleProducts] Gagal memproses produk usang ${p.name}:`, e);
    }
  }

  return { deleted, retired };
}
