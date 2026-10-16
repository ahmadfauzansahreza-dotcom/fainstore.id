import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Middleware hanya menangani proteksi rute /admin. Pengecekan mode maintenance
// dilakukan di root layout (server component) langsung ke database, BUKAN di
// sini, karena memanggil fetch() ke API sendiri dari edge middleware pada
// setiap request menambah latensi dan tidak reliable di semua platform hosting.
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
