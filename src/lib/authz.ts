// Helper otorisasi untuk server actions. Sengaja TIDAK memakai "use server"
// agar helper ini tidak ikut terekspos sebagai action yang bisa dipanggil client.

import { getCurrentUser, type AuthUser } from "@/actions/auth";
import { fail, type ActionResult } from "@/actions/types";
import type { Role } from "@/lib/utils";

export type AuthResult = { user: AuthUser; error?: undefined } | { user?: undefined; error: ActionResult };

/** Untuk action mutasi: kembalikan error ActionResult bila tidak berhak. */
export async function authorize(role?: Role): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) return { error: fail("Sesi Anda telah berakhir. Silakan login kembali.") };
  if (role && user.role !== role) {
    return { error: fail("Anda tidak memiliki izin untuk melakukan aksi ini.") };
  }
  return { user };
}

/** Untuk fungsi baca data: lempar error bila tidak berhak. */
export async function requireUser(role?: Role): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (role && user.role !== role) throw new Error("Forbidden");
  return user;
}

export function isAdmin(user: AuthUser): boolean {
  return user.role === "ADMIN_PUSAT";
}

/**
 * Admin Pusat boleh memilih toko mana pun; Staf Toko selalu dikunci ke toko
 * miliknya sendiri, apa pun nama toko yang dikirim dari client.
 */
export function resolveStoreName(user: AuthUser, requested: string | null | undefined): string {
  if (isAdmin(user)) return (requested ?? "").trim();
  return user.store_name;
}

/** Staf Toko hanya boleh menyentuh data milik tokonya sendiri. */
export function canAccessStore(user: AuthUser, storeName: string): boolean {
  return isAdmin(user) || user.store_name === storeName;
}
