// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/session';

// 1. DEFINE ZONES
const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings', '/wallet'];
const AUTH_ROUTES = ['/login', '/register', '/signin', '/signup'];
const PUBLIC_FILE_PATHS = [
  '/signin', '/signup', '/verify', '/forgot-password', '/reset-password', '/about',
  '/api/auth/signin', '/api/auth/signup', '/api/auth/verify', '/api/auth/forgot-password', '/api/auth/reset-password',
  '/api/setup_schema', // Temporary Admin Route
  '/api/dev/mfa-peek'  // DEV ONLY — delete after testing
];

export async function middleware(req: NextRequest) {
  const cookie = req.cookies.get('session')?.value || req.cookies.get('trueque_sid')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const { pathname } = req.nextUrl;

  // 2. ALLOW STATIC ASSETS
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 3. HELPER: HANDLE UNAUTHORIZED REQUESTS
  // If it's an API call, return JSON. If it's a page, redirect.
  const handleUnauthorized = () => {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  };

  // 4. REDIRECT RULES

  // RULE A: User IS Authenticated
  if (session?.user) {
    // Trying to access Login -> Go to Dashboard
    if (AUTH_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // MFA CHECK:
    // If NOT verified, force them to /verify-mfa (unless they are already there or calling the verify API)
    if (!session.mfaVerified) {
      if (pathname === '/verify-mfa' || pathname.startsWith('/api/auth')) {
        // Allow access to verification page and auth APIs
      } else if (pathname.startsWith('/api/')) {
        // Block other API calls with JSON 401 (Don't redirect to HTML!)
        return handleUnauthorized();
      } else {
        // Redirect pages to verification
        return NextResponse.redirect(new URL('/verify-mfa', req.url));
      }
    }

    // If Verified, block access to /verify-mfa
    if (session.mfaVerified && pathname === '/verify-mfa') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // RULE B: User is NOT Authenticated
  if (!session) {
    // Protected Routes -> Block
    if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
      return handleUnauthorized();
    }

    // Verify Page -> Block
    if (pathname === '/verify-mfa') {
      return handleUnauthorized();
    }

    // Explicit API Guard for non-public API routes (extra safety)
    if (pathname.startsWith('/api/') &&
      !pathname.startsWith('/api/auth') &&
      !pathname.startsWith('/api/health') &&
      !pathname.startsWith('/api/rate') &&
      !pathname.startsWith('/api/public') &&
      !pathname.startsWith('/api/offers') &&   // Dev console — offer creation & listing
      !pathname.startsWith('/api/matches') &&  // Dev console — match creation & listing
      !pathname.startsWith('/api/trades') &&   // Trade room — details & signal-funding
      !pathname.startsWith('/api/fx-rate') &&  // FX rate lookup (public read-only)
      !PUBLIC_FILE_PATHS.includes(pathname)) { // CHECK WHITELIST
      return handleUnauthorized();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/geo|_next/static|_next/image|favicon.ico).*)'],
};