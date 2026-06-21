// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/session';

// 1. DEFINE ZONES
const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings', '/wallet'];
const AUTH_ROUTES = ['/login', '/register', '/signin', '/signup'];
const PUBLIC_FILE_PATHS = [
  '/signin', '/signup', '/verify', '/forgot-password', '/reset-password', '/about',
  '/api/auth/signin', '/api/auth/signup', '/api/auth/verify', '/api/auth/forgot-password', '/api/auth/reset-password',
  '/api/mobile/signin',   // Mobile JWT auth — no session cookie required
  '/api/mobile/signup',   // Mobile registration — no session cookie required
  '/api/setup_schema',    // Temporary Admin Route
  '/api/dev/mfa-peek',    // DEV ONLY — delete after testing
  '/social-card',         // OG image screenshotter — no auth required
  '/demo/retailer',       // Public retailer sales demo — no auth required
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── CORS — allow Flutter web dev (port 8080) and the mobile app ──────────
  // In production: replace '*' with your actual domain.
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  // Handle OPTIONS preflight immediately — no auth needed
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  // 2. ALLOW STATIC ASSETS — must run before session decryption for performance
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 3. MAIN ROUTE HANDLER
  async function routeHandler() {
    if (PUBLIC_FILE_PATHS.includes(pathname)) {
      return NextResponse.next();
    }

    const cookie = req.cookies.get('session')?.value || req.cookies.get('trueque_sid')?.value;
    const session = cookie ? await decrypt(cookie) : null;
    const hasBearerToken = req.headers.get('authorization')?.startsWith('Bearer ') ?? false;

    const handleUnauthorized = () => {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', req.url));
    };

    if (session?.user) {
      if (AUTH_ROUTES.includes(pathname)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      if (!session.mfaVerified) {
        if (pathname === '/verify-mfa' || pathname.startsWith('/api/auth')) {
          // Allow
        } else if (pathname.startsWith('/api/')) {
          return handleUnauthorized();
        } else {
          return NextResponse.redirect(new URL('/verify-mfa', req.url));
        }
      }
      if (session.mfaVerified && pathname === '/verify-mfa') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    if (!session) {
      if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
        return handleUnauthorized();
      }
      if (pathname === '/verify-mfa') {
        return handleUnauthorized();
      }
      if (pathname.startsWith('/api/') &&
        !pathname.startsWith('/api/auth') &&
        !pathname.startsWith('/api/health') &&
        !pathname.startsWith('/api/rate') &&
        !pathname.startsWith('/api/public') &&
        !pathname.startsWith('/api/offers') &&
        !pathname.startsWith('/api/matches') &&
        !pathname.startsWith('/api/trades') &&
        !pathname.startsWith('/api/fx-rate') &&
        !hasBearerToken &&
        !PUBLIC_FILE_PATHS.includes(pathname)) {
        return handleUnauthorized();
      }
    }

    const res = NextResponse.next();
    if (pathname.startsWith('/api/')) {
      res.headers.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
      res.headers.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
      res.headers.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
    }
    return res;
  }

  const finalResponse = await routeHandler();

  // MARKET ROUTING DETECTION (Law of Corporate Congruence)
  const searchParams = req.nextUrl.searchParams;
  const marketParam = searchParams.get('market');
  const regionParam = searchParams.get('region');
  const destParam = searchParams.get('dest');

  finalResponse.cookies.delete('trueque_market_origin');
  finalResponse.cookies.delete('trueque_market');

  let originMarket = 'US';
  let destRegion = 'MX';

  // 1. Evaluate explicit region parameters (e.g., ?region=es-do)
  if (regionParam) {
    const parts = regionParam.toLowerCase().split('-');
    if (parts.length === 2) {
      originMarket = parts[0] === 'es' ? 'ES' : 'US';
      destRegion = parts[1].toUpperCase();
    }
  } 
  // 2. Evaluate explicit market/dest parameters
  else if (marketParam || destParam) {
    if (marketParam) originMarket = marketParam.toLowerCase() === 'es' ? 'ES' : 'US';
    
    if (destParam) {
      destRegion = destParam.toUpperCase();
    } else {
      // Default dest if only market is provided
      destRegion = originMarket === 'ES' ? 'CO' : 'MX';
    }
  } 
  // 3. Fallback to existing cookies
  else {
    originMarket = req.cookies.get('symmetri_market')?.value || 'US';
    destRegion = req.cookies.get('symmetri_dest')?.value || (originMarket === 'ES' ? 'CO' : 'MX');
  }

  // Validate destRegion, apply defaults if invalid
  if (!['MX', 'CO', 'GT', 'DO'].includes(destRegion)) {
    destRegion = originMarket === 'ES' ? 'CO' : 'MX';
  }

  // Enforce strict bilateral state
  finalResponse.cookies.set('symmetri_market', originMarket, { path: '/', maxAge: 31536000 });
  finalResponse.cookies.set('symmetri_dest', destRegion, { path: '/', maxAge: 31536000 });

  return finalResponse;
}

export const config = {
  matcher: ['/((?!api/geo|_next/static|_next/image|favicon.ico).*)'],
};