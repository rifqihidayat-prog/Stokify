"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { ok, fail, type ActionResult } from "./types";
import type { Role } from "@/lib/utils";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: Role;
  store_name: string;
}

const SESSION_COOKIE_NAME = "stokify_session";

/**
 * Mendapatkan user aktif saat ini dari session cookie
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const userData = JSON.parse(sessionCookie.value) as AuthUser;
    if (!userData.id || !userData.username || !userData.role) {
      return null;
    }

    return userData;
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
  const username = (usernameInput || "").trim();
  const password = (passwordInput || "").trim();

  if (!username || !password) {
    return fail("Username dan password wajib diisi.");
  }

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!user || user.password !== password) {
      return fail("Username atau kata sandi salah. Silakan periksa kembali.");
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      store_name: user.store_name,
    };

    const cookieStore = await cookies();

    // Set cookie session (30 hari)
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(authUser), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    // Sinkronkan juga cookie role untuk backward compatibility
    cookieStore.set("stokify_role", authUser.role, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    revalidatePath("/", "layout");
    return ok(`Selamat datang kembali, ${authUser.name}!`);
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
