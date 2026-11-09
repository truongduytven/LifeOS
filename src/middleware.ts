import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, Next.js internal paths, and static public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/icons/') ||
    /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/i.test(pathname) ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  const jwtSecret = process.env.JWT_SECRET;
  const sessionCookieName = process.env.SESSION_COOKIE_NAME;

  if (!jwtSecret || !sessionCookieName) {
    console.error('Missing required environment variables in middleware (JWT_SECRET, SESSION_COOKIE_NAME)');
    return NextResponse.json(
      { error: 'Server configuration error: missing required environment variables' },
      { status: 500 }
    );
  }

  const secretKey = new TextEncoder().encode(jwtSecret);

  // Allow public routes
  if (
    pathname === '/login' ||
    pathname.startsWith('/p/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/articles/public/')
  ) {
    // If authenticated user tries to visit /login, redirect to dashboard
    if (pathname === '/login') {
      const token = request.cookies.get(sessionCookieName)?.value;
      if (token) {
        try {
          await jwtVerify(token, secretKey);
          return NextResponse.redirect(new URL('/', request.url));
        } catch {
          // Token is invalid, let them view /login
        }
      }
    }
    return NextResponse.next();
  }

  // Check auth for protected routes
  const token = request.cookies.get(sessionCookieName)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, secretKey);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons/ (public icon assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/).*)',
  ],
};
