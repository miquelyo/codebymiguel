import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Abaikan request untuk file statis, gambar, icon PWA, dsb
  if (
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|json|js|webmanifest|css|woff2?)$/) ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/models')
  ) {
    return NextResponse.next();
  }

  // Baca session cookie yang kita set saat login
  const session = request.cookies.get('admin_session')?.value;
  const isLoggedIn = !!session;
  const isPublic   = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  // Kalau belum login dan coba akses halaman protected → ke /login
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    // simpan halaman tujuan supaya bisa redirect balik setelah login
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Kalau sudah login tapi masih di /login → ke /dashboard
  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan proxy di semua route kecuali aset statis, icon, image, manifest, sw, & API Next.js
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|svg|webp|gif|json|js|webmanifest)$|api/).*)',
  ],
};
