"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ok, fail, type ActionResult } from "./types";
import type { Role } from "@/lib/utils";
import { hashPassword, isPasswordHashed, verifyPassword } from "@/lib/password";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
} from "@/lib/session";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: Role;
  store_name: string;
}

// Batas percobaan login gagal per username (in-memory, per proses).
const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_MS = 15 * 60 * 1000;
const failedLogins = new Map<string, { count: number; firstAt: number }>();

function isLockedOut(username: string): boolean {
  const entry = failedLogins.get(username);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > LOCKOUT_MS) {
    failedLogins.delete(username);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedLogin(username: string) {
  const entry = failedLogins.get(username);
  if (!entry || Date.now() - entry.firstAt > LOCKOUT_MS) {
    failedLogins.set(username, { count: 1, firstAt: Date.now() });
  } else {
    entry.count++;
  }
}

/**
 * Mendapatkan user aktif saat ini dari session cookie bertanda tangan.
 * Data user selalu dibaca ulang dari database, jadi perubahan role / penghapusan
 * akun langsung berlaku tanpa menunggu cookie kedaluwarsa.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
    if (!session) return null;

    const user = await db.select().from(users).where(eq(users.id, session.uid)).get();
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      store_name: user.store_name,
    };
  } catch {
    return null;
  }
}

/**
 * Login dengan username dan password
 */
export async function loginWithCredentials(
  usernameInput: string,
  passwordInput: string
): Promise<ActionResult> {
  const username = (usernameInput || "").trim().toLowerCase();
  const password = (passwordInput || "").trim();

  if (!username || !password) {
    return fail("Username dan password wajib diisi.");
  }

  const lockKey = username.toLowerCase();
  if (isLockedOut(lockKey)) {
    return fail("Terlalu banyak percobaan login gagal. Coba lagi dalam 15 menit.");
  }

  try {
    const user = await db
      .select()
      .from(users)
      .where(sql`lower(${users.username}) = ${username}`)
      .get();

    if (!user || !(await verifyPassword(password, user.password))) {
      recordFailedLogin(lockKey);
      return fail("Username atau kata sandi salah. Silakan periksa kembali.");
    }

    failedLogins.delete(lockKey);

    // Migrasi otomatis password lama (plaintext) ke hash saat login berhasil
    if (!isPasswordHashed(user.password)) {
      await db
        .update(users)
        .set({ password: await hashPassword(password) })
        .where(eq(users.id, user.id));
    }

    const cookieStore = await cookies();

    // Set cookie session bertanda tangan (30 hari)
    cookieStore.set(SESSION_COOKIE_NAME, await createSessionToken(user.id), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
    });

    // Cookie role lama tidak dipakai lagi untuk otorisasi
    cookieStore.delete("stokify_role");

    revalidatePath("/", "layout");
    return ok(`Selamat datang kembali, ${user.name}!`);
  } catch (err: any) {
    console.error("Login error:", err);
    return fail("Terjadi kesalahan sistem saat proses autentikasi.");
  }
}

/**
 * Login menggunakan FormData
 */
export async function loginUser(formData: FormData): Promise<ActionResult> {
  const username = formData.get("username")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  return loginWithCredentials(username, password);
}

/**
 * Logout pengguna aktif dan hapus session
 */
export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete("stokify_role");
  revalidatePath("/", "layout");
  redirect("/login");
}
