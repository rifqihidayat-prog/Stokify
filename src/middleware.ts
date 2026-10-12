import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Cek tanda tangan cookie (bukan sekadar ada/tidaknya cookie).
  // Keberadaan user di database dicek lagi oleh getCurrentUser() di server.
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const isAuthenticated = session !== null;

  // Jika belum login dan mengakses halaman yang dilindungi
  if (!isAuthenticated && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url);
    // Simpan return url jika diperlukan nanti
    return NextResponse.redirect(loginUrl);
  }

  // Jika sudah login tapi mencoba mengakses halaman login
  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
