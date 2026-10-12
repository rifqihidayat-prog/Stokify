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
  console.log("🌱 Seeding database Stokify (No-Beginning-Stock & Ledger Model)...");

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

  // ---------- Master Items ----------
  const productRows: Omit<Product, "id" | "created_at">[] = [
    {
      sku: "STK-001",
      name: "Struk Thermal 80mm",
      category: "DAILY_CONSUMABLE",
      item_type: "CONSUMABLE",
      unit: "Roll",
      min_stock_central: 100,
      min_stock_store: 20,
      current_stock_central: 120,
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
      current_stock_central: 80,
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
      current_stock_central: 25, // Low stock (<= min)
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
      current_stock_central: 15, // Low stock (<= min)
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
      current_stock_central: 100,
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
      current_stock_central: 0, // STOK KOSONG PUSAT (Untuk uji order lagi / disabled)
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
      current_stock_central: 350,
      is_orderable: true,
    },
  ];

  const insertedProducts = (
    await db
      .insert(products)
      .values(productRows.map((p) => ({ id: randomUUID(), ...p })))
      .returning()
  ) as Product[];

  const bySku = new Map(insertedProducts.map((p) => [p.sku, p]));
  const byName = new Map(insertedProducts.map((p) => [p.name, p]));

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
  // 1. IN-SUPPLIER (Penerimaan dari Vendor ke Gudang Pusat)
  const thermal = bySku.get("STK-001")!;
  const lakban = bySku.get("LKB-002")!;
  const chemical = bySku.get("CHM-003")!;
  const rafia = bySku.get("RAF-004")!;
  const cable = bySku.get("CBL-005")!;
  const kardus = bySku.get("KRT-007")!;

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const initialMutations = [
    // Inflow Supplier
    {
      id: randomUUID(),
      reference_no: "IN-SUPPLIER-20261001-0001",
      transaction_date: daysAgo(8),
      sender_location: "SUPPLIER: PT Thermal Paper Nusantara",
      receiver_location: "GUDANG PUSAT",
      item_id: thermal.id,
      qty: 200,
      notes: "Penerimaan PO-2026/09/881 dari vendor",
    },
    {
      id: randomUUID(),
      reference_no: "IN-SUPPLIER-20261001-0002",
      transaction_date: daysAgo(8),
      sender_location: "SUPPLIER: CV Mitra Lakban Jaya",
      receiver_location: "GUDANG PUSAT",
      item_id: lakban.id,
      qty: 120,
      notes: "Pengiriman batch 1 Lakban Bening",
    },
    {
      id: randomUUID(),
      reference_no: "IN-SUPPLIER-20261002-0003",
      transaction_date: daysAgo(7),
      sender_location: "SUPPLIER: PT Chemical Hygiene Indonesia",
      receiver_location: "GUDANG PUSAT",
      item_id: chemical.id,
      qty: 40,
      notes: "Penerimaan restock bulanan chemical",
    },
    {
      id: randomUUID(),
      reference_no: "IN-SUPPLIER-20261002-0004",
      transaction_date: daysAgo(7),
      sender_location: "SUPPLIER: UD Tali Perkasa",
      receiver_location: "GUDANG PUSAT",
      item_id: rafia.id,
      qty: 25,
      notes: "Restock tali rafia roll besar",
    },
    {
      id: randomUUID(),
      reference_no: "IN-SUPPLIER-20261003-0005",
      transaction_date: daysAgo(6),
      sender_location: "SUPPLIER: PT Fastener Supply",
      receiver_location: "GUDANG PUSAT",
      item_id: cable.id,
      qty: 150,
      notes: "Cable ties batch masuk",
    },
    {
      id: randomUUID(),
      reference_no: "IN-SUPPLIER-20261003-0006",
      transaction_date: daysAgo(6),
      sender_location: "SUPPLIER: Pabrik Kardus Box Indo",
      receiver_location: "GUDANG PUSAT",
      item_id: kardus.id,
      qty: 500,
      notes: "PO Kardus M 500 pcs",
    },

    // Pengiriman Surat Jalan SJ dari Pusat ke Toko Cabang Surabaya
    {
      id: randomUUID(),
      reference_no: "SJ-20261004-0012",
      transaction_date: daysAgo(5),
      sender_location: "GUDANG PUSAT",
      receiver_location: "Toko Cabang Surabaya",
      item_id: thermal.id,
      qty: 50,
      notes: "Pengiriman alokasi mingguan Surabaya",
    },
    {
      id: randomUUID(),
      reference_no: "SJ-20261004-0012",
      transaction_date: daysAgo(5),
      sender_location: "GUDANG PUSAT",
      receiver_location: "Toko Cabang Surabaya",
      item_id: lakban.id,
      qty: 20,
      notes: "Pengiriman alokasi mingguan Surabaya",
    },
    {
      id: randomUUID(),
      reference_no: "SJ-20261004-0012",
      transaction_date: daysAgo(5),
      sender_location: "GUDANG PUSAT",
      receiver_location: "Toko Cabang Surabaya",
      item_id: chemical.id,
      qty: 10,
      notes: "Pengiriman alokasi mingguan Surabaya",
    },
    {
      id: randomUUID(),
      reference_no: "SJ-20261004-0012",
      transaction_date: daysAgo(5),
      sender_location: "GUDANG PUSAT",
      receiver_location: "Toko Cabang Surabaya",
      item_id: kardus.id,
      qty: 100,
      notes: "Pengiriman alokasi mingguan Surabaya",
    },

    // Pengiriman Surat Jalan SJ dari Pusat ke Toko Cabang Bandung
    {
      id: randomUUID(),
      reference_no: "SJ-20261005-0015",
      transaction_date: daysAgo(4),
      sender_location: "GUDANG PUSAT",
      receiver_location: "Toko Cabang Bandung",
      item_id: thermal.id,
      qty: 30,
      notes: "Pengiriman alokasi Bandung",
    },
    {
      id: randomUUID(),
      reference_no: "SJ-20261005-0015",
      transaction_date: daysAgo(4),
      sender_location: "GUDANG PUSAT",
      receiver_location: "Toko Cabang Bandung",
      item_id: lakban.id,
      qty: 20,
      notes: "Pengiriman alokasi Bandung",
    },
    {
      id: randomUUID(),
      reference_no: "SJ-20261005-0015",
      transaction_date: daysAgo(4),
      sender_location: "GUDANG PUSAT",
      receiver_location: "Toko Cabang Bandung",
      item_id: chemical.id,
      qty: 5,
      notes: "Pengiriman alokasi Bandung",
    },
    {
      id: randomUUID(),
      reference_no: "SJ-20261005-0015",
      transaction_date: daysAgo(4),
      sender_location: "GUDANG PUSAT",
      receiver_location: "Toko Cabang Bandung",
      item_id: rafia.id,
      qty: 10,
      notes: "Pengiriman alokasi Bandung",
    },
    {
      id: randomUUID(),
      reference_no: "SJ-20261005-0015",
      transaction_date: daysAgo(4),
      sender_location: "GUDANG PUSAT",
      receiver_location: "Toko Cabang Bandung",
      item_id: cable.id,
      qty: 50,
      notes: "Pengiriman alokasi Bandung",
    },
    {
      id: randomUUID(),
      reference_no: "SJ-20261005-0015",
      transaction_date: daysAgo(4),
      sender_location: "GUDANG PUSAT",
      receiver_location: "Toko Cabang Bandung",
      item_id: kardus.id,
      qty: 50,
      notes: "Pengiriman alokasi Bandung",
    },

    // Toko Cabang Surabaya - Input Closing Pemakaian Harian
    {
      id: randomUUID(),
      reference_no: "CLOSING-20261006-0001",
      transaction_date: daysAgo(3),
      sender_location: "Toko Cabang Surabaya",
      receiver_location: "CLOSING",
      item_id: thermal.id,
      qty: 15,
      notes: "Closing pemakaian struk kasir 1-3",
    },
    {
      id: randomUUID(),
      reference_no: "CLOSING-20261006-0001",
      transaction_date: daysAgo(3),
      sender_location: "Toko Cabang Surabaya",
      receiver_location: "CLOSING",
      item_id: lakban.id,
      qty: 5,
      notes: "Closing pemakaian lakban packing",
    },

    // Toko Cabang Surabaya - Stock Adjustment (Audit Log Sample)
    {
      id: randomUUID(),
      reference_no: "ADJ-TOKO-20261007-0001",
      transaction_date: daysAgo(2),
      sender_location: "Toko Cabang Surabaya",
      receiver_location: "Toko Cabang Surabaya",
      item_id: thermal.id,
      qty: 2,
      notes: "Ditemukan selisih fisik lebih 2 roll di rak cadangan",
    },
  ];

  await db.insert(mutationLogs).values(initialMutations);

  // ---------- Store Realtime Stocks Table ----------
  // Store Surabaya Stock:
  // Thermal: Masuk (50 SJ + 2 ADJ) - Keluar (15 CLOSING) = 37
  // Lakban: Masuk (20 SJ) - Keluar (5 CLOSING) = 15
  // Chemical: Masuk (10 SJ) - Keluar 0 = 10
  // Kardus: Masuk (100 SJ) - Keluar 0 = 100
  await db.insert(storeStocks).values([
    {
      id: randomUUID(),
      store_name: "Toko Cabang Surabaya",
      item_id: thermal.id,
      current_stock: 37,
      updated_at: new Date(),
    },
    {
      id: randomUUID(),
      store_name: "Toko Cabang Surabaya",
      item_id: lakban.id,
      current_stock: 15,
      updated_at: new Date(),
    },
    {
      id: randomUUID(),
      store_name: "Toko Cabang Surabaya",
      item_id: chemical.id,
      current_stock: 10,
      updated_at: new Date(),
    },
    {
      id: randomUUID(),
      store_name: "Toko Cabang Surabaya",
      item_id: kardus.id,
      current_stock: 100,
      updated_at: new Date(),
    },

    // Store Bandung Stock
    {
      id: randomUUID(),
      store_name: "Toko Cabang Bandung",
      item_id: thermal.id,
      current_stock: 30,
      updated_at: new Date(),
    },
    {
      id: randomUUID(),
      store_name: "Toko Cabang Bandung",
      item_id: lakban.id,
      current_stock: 20,
      updated_at: new Date(),
    },
    {
      id: randomUUID(),
      store_name: "Toko Cabang Bandung",
      item_id: chemical.id,
      current_stock: 5,
      updated_at: new Date(),
    },
    {
      id: randomUUID(),
      store_name: "Toko Cabang Bandung",
      item_id: rafia.id,
      current_stock: 10,
      updated_at: new Date(),
    },
    {
      id: randomUUID(),
      store_name: "Toko Cabang Bandung",
      item_id: cable.id,
      current_stock: 50,
      updated_at: new Date(),
    },
    {
      id: randomUUID(),
      store_name: "Toko Cabang Bandung",
      item_id: kardus.id,
      current_stock: 50,
      updated_at: new Date(),
    },
  ]);

  // ---------- Store Requests (Sample Picking List) ----------
  await db.insert(storeRequests).values([
    {
      id: randomUUID(),
      reference_no: "REQ-20261008-0001",
      store_name: "Toko Cabang Surabaya",
      product_id: chemical.id,
      quantity_requested: 10,
      status: "PENDING",
      notes: "Stok chemical toko tersisa 10 botol, persiapan akhir pekan.",
      created_at: daysAgo(1),
    },
    {
      id: randomUUID(),
      reference_no: "REQ-20261008-0002",
      store_name: "Toko Cabang Bandung",
      product_id: thermal.id,
      quantity_requested: 40,
      status: "PENDING",
      notes: "Kebutuhan kertas struk untuk pos kasir.",
      created_at: daysAgo(1),
    },
  ]);

  // ---------- Equipment Requests ----------
  await db.insert(equipmentRequests).values([
    {
      id: randomUUID(),
      store_name: "Toko Cabang Surabaya",
      equipment_name: "Printer Struk Kasir Pos 1",
      reason: "DAMAGED_REPLACEMENT",
      quantity: 1,
      description:
        "Thermal head aus dan tidak dapat menarik kertas. Penggantian mendesak.",
      image_url: null,
      urgency: "HIGH",
      status: "PENDING",
      created_at: daysAgo(2),
    },
    {
      id: randomUUID(),
      store_name: "Toko Cabang Surabaya",
      equipment_name: "Handheld Barcode Scanner Wireless",
      reason: "NEW_PROCUREMENT",
      quantity: 2,
      description:
        "Pengadaan baru untuk percepatan proses stock opname dan receiving barang.",
      image_url: null,
      urgency: "MEDIUM",
      status: "PENDING",
      created_at: daysAgo(1),
    },
  ]);

  console.log("✅ Seeding selesai dengan sukses!");
  console.log(`   - ${insertedProducts.length} master items`);
  console.log(`   - ${initialMutations.length} transaction ledger records`);
  console.log("   - User accounts (admin, toko.surabaya, toko.bandung) siap!");
  console.log("   - Store realtime stocks & pending picking requests siap!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Gagal seeding:", err);
    process.exit(1);
  });

