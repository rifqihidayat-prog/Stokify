import { randomUUID } from "node:crypto";
import { count } from "drizzle-orm";
import { db } from "./index";
import {
  equipmentRequests,
  mutationLogs,
  products,
  storeRequests,
  storeStocks,
  users,
} from "./schema";

async function main() {
  console.log("=================================================");
  console.log("   STOKIFY - RESET STOK FISIK KE 0 (SAFE RESET)   ");
  console.log("=================================================\n");

  // 1. Verifikasi akun pengguna (DILINDUNGI & TIDAK DIHAPUS)
  const [{ userCount }] = await db
    .select({ userCount: count() })
    .from(users);
  console.log(`🔒 Data Akun Pengguna: ${userCount} akun terlindungi (TIDAK diubah).`);

  // 2. Nolkan stok gudang pusat pada tabel products
  await db.update(products).set({
    current_stock_central: 0,
  });
  const allProducts = await db.select().from(products).all();
  console.log(`📦 Master Barang: ${allProducts.length} item diset stok pusat = 0.`);

  // 3. Nolkan stok di semua cabang toko pada tabel store_stocks
  await db.update(storeStocks).set({
    current_stock: 0,
    updated_at: new Date(),
  });

  // Pastikan cabang toko default memiliki entri produk dengan stok 0
  const defaultStores = ["Toko Cabang Surabaya", "Toko Cabang Bandung"];
  const existingStoreStocks = await db.select().from(storeStocks).all();

  for (const storeName of defaultStores) {
    for (const prod of allProducts) {
      const exists = existingStoreStocks.some(
        (s) => s.store_name === storeName && s.item_id === prod.id
      );
      if (!exists) {
        await db.insert(storeStocks).values({
          id: randomUUID(),
          store_name: storeName,
          item_id: prod.id,
          current_stock: 0,
          updated_at: new Date(),
        });
      }
    }
  }

  const [{ storeStockCount }] = await db
    .select({ storeStockCount: count() })
    .from(storeStocks);
  console.log(`🏬 Stok Toko Cabang: ${storeStockCount} data item cabang diset stok = 0.`);

  // 4. Kosongkan riwayat mutasi demo (agar kalkulasi realtime ledger mulai dari 0)
  const [{ mutationCount }] = await db
    .select({ mutationCount: count() })
    .from(mutationLogs);
  await db.delete(mutationLogs);
  console.log(`📋 Buku Kas Mutasi: ${mutationCount} record transaksi demo dibersihkan.`);

  // 5. Kosongkan antrean permintaan lama (store_requests & equipment_requests)
  const [{ srCount }] = await db
    .select({ srCount: count() })
    .from(storeRequests);
  await db.delete(storeRequests);

  const [{ eqCount }] = await db
    .select({ eqCount: count() })
    .from(equipmentRequests);
  await db.delete(equipmentRequests);
  console.log(`🚚 Pengajuan Barang: ${srCount} store requests & ${eqCount} equipment requests dibersihkan.`);

  console.log("\n✅ Sukses! Seluruh stok sekarang bernilai 0.");
  console.log("   - Saldo Pusat: 0");
  console.log("   - Saldo Toko: 0");
  console.log("   - Akun Pengguna: Aman & Tidak Berubah\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Gagal mereset stok:", err);
    process.exit(1);
  });
