import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Local-first: tanpa env vars, pakai file database lokal (100% otomatis).
    // Untuk Turso cloud, isi TURSO_DATABASE_URL & TURSO_AUTH_TOKEN di .env
    url: process.env.DATABASE_URL ?? "file:./stokify.db",
  },
});
