import { randomUUID } from "node:crypto";
import { count } from "drizzle-orm";
import { client, db } from "./index";
import { users } from "./schema";
import { MIN_PASSWORD_LENGTH, hashPassword } from "@/lib/password";

/**
 * Membuat tabel bila belum ada. Aman dijalankan berulang kali dan TIDAK
 * menghapus data apa pun (dipanggil otomatis saat server start).
 */
export async function ensureSchema() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL,
      store_name TEXT NOT NULL,
      created_at INTEGER
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'DAILY_CONSUMABLE',
      item_type TEXT NOT NULL DEFAULT 'CONSUMABLE',
      unit TEXT NOT NULL,
      min_stock_central INTEGER NOT NULL DEFAULT 10,
      min_stock_store INTEGER NOT NULL DEFAULT 5,
      current_stock_central INTEGER NOT NULL DEFAULT 0,
      is_orderable INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS store_stocks (
      id TEXT PRIMARY KEY,
      store_name TEXT NOT NULL,
      item_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      current_stock INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS mutation_logs (
      id TEXT PRIMARY KEY,
      reference_no TEXT NOT NULL,
      transaction_date INTEGER NOT NULL,
      sender_location TEXT NOT NULL,
      receiver_location TEXT NOT NULL,
      item_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      qty INTEGER NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS store_requests (
      id TEXT PRIMARY KEY,
      reference_no TEXT,
      store_name TEXT NOT NULL,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity_requested INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS equipment_requests (
      id TEXT PRIMARY KEY,
      store_name TEXT NOT NULL,
      equipment_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      description TEXT NOT NULL,
      image_url TEXT,
      urgency TEXT NOT NULL DEFAULT 'MEDIUM',
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at INTEGER NOT NULL
    );
  `);
}

/**
 * Bila belum ada user sama sekali, buat akun admin pertama dari
 * INITIAL_ADMIN_USERNAME (default "admin") + INITIAL_ADMIN_PASSWORD.
 * Tidak ada password bawaan: tanpa env tersebut, tidak ada akun yang dibuat.
 */
export async function ensureInitialAdmin() {
  const [{ total }] = await db.select({ total: count() }).from(users);
  if (total > 0) return;

  const username = (process.env.INITIAL_ADMIN_USERNAME ?? "admin").trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD ?? "";
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.warn(
      `[stokify] Belum ada user. Set INITIAL_ADMIN_PASSWORD (min ${MIN_PASSWORD_LENGTH} karakter) untuk membuat admin pertama.`
    );
    return;
  }

  await db.insert(users).values({
    id: randomUUID(),
    username,
    password: await hashPassword(password),
    name: "Administrator Gudang Pusat",
    email: null,
    role: "ADMIN_PUSAT",
    store_name: "Pusat Warehouse",
    created_at: new Date(),
  });
  console.log(`[stokify] Admin pertama "${username}" dibuat.`);
}

export async function bootstrapDatabase() {
  await ensureSchema();
  await ensureInitialAdmin();
}
