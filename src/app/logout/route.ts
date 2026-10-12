import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

// Dipakai bila cookie sesi valid tapi user-nya sudah tidak ada (mis. akun dihapus):
// hapus cookie lalu kembali ke halaman login tanpa redirect loop.
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete("stokify_role");
  return response;
}
