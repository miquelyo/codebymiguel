import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login'];
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 menit batas ketidakaktifan

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Abaikan request untuk file statis, gambar, icon PWA, manifest, robots, dsb
  if (
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|json|js|webmanifest|css|woff2?|txt|xml)$/) ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/models') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml')
  ) {
    return NextResponse.next();
  }

  // Baca session cookie & timestamp terakhir aktif
  const session = request.cookies.get('admin_session')?.value;
  const lastActiveStr = request.cookies.get('session_last_active')?.value;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  const now = Date.now();
  let isIdle = false;

  if (session && lastActiveStr) {
    const lastActive = parseInt(lastActiveStr, 10);
    if (!isNaN(lastActive) && now - lastActive > IDLE_TIMEOUT_MS) {
      isIdle = true;
    }
  }

  const isLoggedIn = !!session && !isIdle;

  // 1. Jika sesi sudah idle (tidak aktif > 15 menit) dan mencoba akses protected route
  if (session && isIdle && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('reason', 'idle');
    loginUrl.searchParams.set('from', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('admin_session');
    res.cookies.delete('session_last_active');
    return res;
  }

  // 2. Jika belum login sama sekali dan mencoba akses halaman protected → ke /login
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('admin_session');
    res.cookies.delete('session_last_active');
    return res;
  }

  // 3. Jika sesi aktif dan valid tapi masih di /login → ke /dashboard
  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 4. Sesi aktif pada protected route: perbarui timestamp session_last_active
  const res = NextResponse.next();
  if (isLoggedIn && !isPublic) {
    res.cookies.set('session_last_active', String(now), {
      path: '/',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 menit
    });
  }

  return res;
}

export const config = {
  // Jalankan proxy di semua route kecuali aset statis, icon, image, manifest, sw, & API Next.js
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|svg|webp|gif|json|js|webmanifest|txt|xml)$|api/).*)',
  ],
};
