"use server";

import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { getCurrentUser } from "./auth";
import { ok, fail, type ActionResult } from "./types";
import type { Role } from "@/lib/utils";
import { requireUser } from "@/lib/authz";
import { MIN_PASSWORD_LENGTH, hashPassword } from "@/lib/password";

export interface SafeUser {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: Role;
  store_name: string;
  created_at: Date | null;
}

export interface CreateUserInput {
  username: string;
  password: string;
  name: string;
  email?: string;
  role: Role;
  store_name: string;
}

export interface UpdateUserInput {
  name: string;
  email?: string;
  role: Role;
  store_name: string;
  password?: string;
}

/**
 * Mengambil daftar seluruh pengguna terdaftar
 */
export async function getUsers(): Promise<SafeUser[]> {
  await requireUser("ADMIN_PUSAT");
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      role: users.role,
      store_name: users.store_name,
      created_at: users.created_at,
    })
    .from(users)
    .orderBy(desc(users.created_at))
    .all();

  return rows as SafeUser[];
}

/**
 * Membuat akun pengguna baru (Hanya Admin Pusat)
 */
export async function createUser(input: CreateUserInput): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN_PUSAT") {
    return fail("Hanya Admin Pusat yang memiliki izin membuat akun baru.");
  }

  const username = input.username.trim().toLowerCase();
  const password = input.password.trim();
  const name = input.name.trim();
  const email = input.email?.trim() || null;
  const role = input.role;
  const storeName = input.store_name.trim();

  if (!username) return fail("Username wajib diisi.");
  if (username.length < 3) return fail("Username minimal 3 karakter.");
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return fail("Username hanya boleh berisi huruf, angka, titik, strip, dan underscore.");
  }
  if (!password) return fail("Kata sandi wajib diisi.");
  if (password.length < MIN_PASSWORD_LENGTH)
    return fail(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
  if (!name) return fail("Nama lengkap pengguna wajib diisi.");
  if (!storeName) return fail("Penugasan toko / gudang wajib diisi.");

  // Periksa apakah username sudah terdaftar
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (existing) {
    return fail(`Username "${username}" sudah digunakan. Silakan gunakan username lain.`);
  }

  try {
    await db.insert(users).values({
      id: randomUUID(),
      username,
      password: await hashPassword(password),
      name,
      email,
      role,
      store_name: storeName,
      created_at: new Date(),
    });

    revalidatePath("/users");
    revalidatePath("/");
    return ok(`Akun "${name}" (${username}) berhasil dibuat.`);
  } catch (err: any) {
    console.error("Error creating user:", err);
    return fail("Gagal membuat akun pengguna baru.");
  }
}

/**
 * Memperbarui akun pengguna (Hanya Admin Pusat)
 */
export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN_PUSAT") {
    return fail("Hanya Admin Pusat yang memiliki izin mengedit akun pengguna.");
  }

  const name = input.name.trim();
  const email = input.email?.trim() || null;
  const role = input.role;
  const storeName = input.store_name.trim();
  const password = input.password?.trim();

  if (!name) return fail("Nama lengkap pengguna wajib diisi.");
  if (!storeName) return fail("Penugasan toko / gudang wajib diisi.");

  const target = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .get();

  if (!target) {
    return fail("Pengguna tidak ditemukan.");
  }

  // Jika mengedit admin utama, jangan izinkan perubahan role menjadi STAF_TOKO
  if (target.username === "admin" && role !== "ADMIN_PUSAT") {
    return fail("Akun master admin tidak dapat diubah menjadi Staf Toko.");
  }

  try {
    const updateValues: Partial<User> = {
      name,
      email,
      role,
      store_name: storeName,
    };

    if (password && password.length > 0) {
      if (password.length < MIN_PASSWORD_LENGTH)
        return fail(`Kata sandi baru minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      updateValues.password = await hashPassword(password);
    }

    await db.update(users).set(updateValues).where(eq(users.id, id));

    revalidatePath("/users");
    revalidatePath("/");
    return ok(`Akun "${name}" berhasil diperbarui.`);
  } catch (err: any) {
    console.error("Error updating user:", err);
    return fail("Gagal memperbarui data akun pengguna.");
  }
}

/**
 * Menghapus akun pengguna (Hanya Admin Pusat)
 */
export async function deleteUser(id: string): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN_PUSAT") {
    return fail("Hanya Admin Pusat yang memiliki izin menghapus akun.");
  }

  // Proteksi: Tidak boleh menghapus akun sendiri
  if (currentUser.id === id) {
    return fail("Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.");
  }

  const target = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .get();

  if (!target) {
    return fail("Pengguna tidak ditemukan.");
  }

  // Proteksi: Tidak boleh menghapus akun master 'admin'
  if (target.username === "admin") {
    return fail("Akun master 'admin' dilindungi dan tidak dapat dihapus.");
  }

  try {
    await db.delete(users).where(eq(users.id, id));

    revalidatePath("/users");
    revalidatePath("/");
    return ok(`Akun "${target.name}" (${target.username}) berhasil dihapus.`);
  } catch (err: any) {
    console.error("Error deleting user:", err);
    return fail("Gagal menghapus akun pengguna.");
  }
}
