import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Local-first: default `file:./stokify.db` (relatif terhadap cwd / root proyek).
// Untuk Turso cloud, set DATABASE_URL + TURSO_AUTH_TOKEN di .env.local.
const url = process.env.DATABASE_URL ?? "file:./stokify.db";

export const client = createClient({ url });

export const db = drizzle(client, { schema });

export { schema };
