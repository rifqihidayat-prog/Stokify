import { randomUUID } from "node:crypto";
import { client, db } from "./index";
import { ensureSchema } from "./bootstrap";
import { hashPassword } from "@/lib/password";
import {
  products,
  storeStocks,
  mutationLogs,
  storeRequests,
  equipmentRequests,
  users,
  type Product,
} from "./schema";

async function main() {
  console.log("🌱 Seeding database Stokify (No-Beginning-Stock & Clean Slate 0 Stock)...");

  // Seed demo MENGHAPUS SEMUA DATA. Jangan pernah jalan di production / DB berisi data.
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Seed demo ditolak: NODE_ENV=production.");
    process.exit(1);
  }
  const hasUsersTable = await client.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'`
  );
  if (hasUsersTable.rows.length > 0 && !process.argv.includes("--reset")) {
    const existing = await client.execute(`SELECT COUNT(*) AS total FROM users`);
    if (Number(existing.rows[0]?.total ?? 0) > 0) {
      console.error(
        "❌ Database sudah berisi data. Seed demo akan MENGHAPUS SEMUA DATA.\n" +
          "   Jalankan `npm run db:reset-demo` bila memang ingin mereset ke data demo."
      );
      process.exit(1);
    }
  }

  // Drop old tables to ensure schema migration
  await client.execute(`DROP TABLE IF EXISTS mutation_logs;`);
  await client.execute(`DROP TABLE IF EXISTS store_stocks;`);
  await client.execute(`DROP TABLE IF EXISTS store_requests;`);
  await client.execute(`DROP TABLE IF EXISTS equipment_requests;`);
  await client.execute(`DROP TABLE IF EXISTS products;`);
  await client.execute(`DROP TABLE IF EXISTS users;`);

  // Create tables with full latest schema
  await ensureSchema();

  // Bersihkan data lama agar bisa dijalankan ulang (idempotent)
  await db.delete(mutationLogs);
  await db.delete(storeStocks);
  await db.delete(storeRequests);
  await db.delete(equipmentRequests);
  await db.delete(products);
  await db.delete(users);

  // ---------- Master Items (Stok Awal = 0) ----------
  const productRows: Omit<Product, "id" | "created_at">[] = [
    {
      sku: "STK-001",
      name: "Struk Thermal 80mm",
      category: "DAILY_CONSUMABLE",
      item_type: "CONSUMABLE",
      unit: "Roll",
      min_stock_central: 100,
      min_stock_store: 20,
      current_stock_central: 0,
      is_orderable: true,
    },
    {
      sku: "LKB-002",
      name: "Lakban Bening 2 Inch",
      category: "PACKAGING",
      item_type: "PACKAGING",
      unit: "Roll",
      min_stock_central: 50,
      min_stock_store: 10,
      current_stock_central: 0,
      is_orderable: true,
    },
    {
      sku: "CHM-003",
      name: "Chemical Pembersih Floor 5L",
      category: "DAILY_CONSUMABLE",
      item_type: "CONSUMABLE",
      unit: "Botol",
      min_stock_central: 30,
      min_stock_store: 5,
      current_stock_central: 0,
      is_orderable: true,
    },
    {
      sku: "RAF-004",
      name: "Tali Rafia Super Roll",
      category: "PACKAGING",
      item_type: "PACKAGING",
      unit: "Roll",
      min_stock_central: 20,
      min_stock_store: 5,
      current_stock_central: 0,
      is_orderable: true,
    },
    {
      sku: "CBL-005",
      name: "Cable Ties 20cm Black",
      category: "DAILY_CONSUMABLE",
      item_type: "CONSUMABLE",
      unit: "Pack",
      min_stock_central: 40,
      min_stock_store: 10,
      current_stock_central: 0,
      is_orderable: true,
    },
    {
      sku: "BBL-006",
      name: "Bubble Wrap Roll 100m",
      category: "PACKAGING",
      item_type: "PACKAGING",
      unit: "Roll",
      min_stock_central: 25,
      min_stock_store: 5,
      current_stock_central: 0,
      is_orderable: true,
    },
    {
      sku: "KRT-007",
      name: "Kardus Polos Packing M (30x20x15)",
      category: "PACKAGING",
      item_type: "PACKAGING",
      unit: "Pcs",
      min_stock_central: 200,
      min_stock_store: 50,
      current_stock_central: 0,
      is_orderable: true,
    },
  ];

  const insertedProducts = (
    await db
      .insert(products)
      .values(productRows.map((p) => ({ id: randomUUID(), ...p })))
      .returning()
  ) as Product[];

  // ---------- Users ---------- (password demo lokal: "password", disimpan ter-hash)
  const demoPassword = await hashPassword("password");
  await db.insert(users).values([
    {
      id: randomUUID(),
      username: "admin",
      password: demoPassword,
      name: "Administrator Gudang Pusat",
      email: "admin.pusat@stokify.internal",
      role: "ADMIN_PUSAT",
      store_name: "Pusat Warehouse",
      created_at: new Date(),
    },
    {
      id: randomUUID(),
      username: "toko.surabaya",
      password: demoPassword,
      name: "Staf Toko Surabaya",
      email: "surabaya@stokify.internal",
      role: "STAF_TOKO",
      store_name: "Toko Cabang Surabaya",
      created_at: new Date(),
    },
    {
      id: randomUUID(),
      username: "toko.bandung",
      password: demoPassword,
      name: "Staf Toko Bandung",
      email: "bandung@stokify.internal",
      role: "STAF_TOKO",
      store_name: "Toko Cabang Bandung",
      created_at: new Date(),
    },
  ]);

  // ---------- Initial Transactions Ledger (Mutation Logs) ----------
  // Stok awal 0: tidak ada mutasi dummy awal
  const initialMutations: (typeof mutationLogs.$inferInsert)[] = [];
  if (initialMutations.length > 0) {
    await db.insert(mutationLogs).values(initialMutations);
  }

  // ---------- Store Realtime Stocks Table (Stok Awal = 0) ----------
  const defaultStores = ["Toko Cabang Surabaya", "Toko Cabang Bandung"];
  const storeStockRows: (typeof storeStocks.$inferInsert)[] = [];

  for (const storeName of defaultStores) {
    for (const prod of insertedProducts) {
      storeStockRows.push({
        id: randomUUID(),
        store_name: storeName,
        item_id: prod.id,
        current_stock: 0,
        updated_at: new Date(),
      });
    }
  }

  await db.insert(storeStocks).values(storeStockRows);

  console.log("✅ Seeding selesai dengan sukses!");
  console.log(`   - ${insertedProducts.length} master items (seluruh stok pusat = 0)`);
  console.log(`   - ${storeStockRows.length} store stock records (seluruh stok toko = 0)`);
  console.log("   - User accounts (admin, toko.surabaya, toko.bandung) siap!");
  console.log("   - 0 mutasi awal (clean slate)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Gagal seeding:", err);
    process.exit(1);
  });
