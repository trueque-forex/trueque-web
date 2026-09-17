// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/session';

// 1. DEFINE ZONES
const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings', '/wallet'];
// AUTH_ROUTES: Authenticated users are redirected away from these to /dashboard.
// Includes both Pages Router routes (/signin, /signup) and new App Router routes (/login, /register).
const AUTH_ROUTES = ['/login', '/register', '/signin', '/signup'];

// PUBLIC_FILE_PATHS: No authentication required.
// Includes all new App Router marketing routes (Layers 2–3 of the merge plan).
const PUBLIC_FILE_PATHS = [
  // ── Pages Router auth (existing) ────────────────────────────────────────
  '/signin', '/signup', '/verify', '/forgot-password', '/reset-password',
  // ── App Router auth (new) ───────────────────────────────────────────────
  '/login', '/register',
  // ── App Router marketing (new) ──────────────────────────────────────────
  '/',                   // Consumer homepage
  '/about',              // Technology identity
  '/partners',           // B2B partner page
  '/faq',                // Consumer FAQ
  '/legal/privacy',      // Privacy Policy (Moov compliance)
  '/legal/terms',        // Terms of Service (Moov compliance)
  // ── API — Auth endpoints ────────────────────────────────────────────────
  '/api/auth/signin', '/api/auth/signup', '/api/auth/verify',
  '/api/auth/forgot-password', '/api/auth/reset-password',
  // ── API — Mobile (Bearer token, no session cookie) ──────────────────────
  '/api/mobile/signin',
  '/api/mobile/signup',
  // ── API — Admin / Dev ───────────────────────────────────────────────────
  '/api/setup_schema',   // Temporary Admin Route
  '/api/dev/mfa-peek',   // DEV ONLY — delete after testing
  // ── Public pages ────────────────────────────────────────────────────────
  '/social-card',        // OG image screenshotter
  '/demo/retailer',      // Public retailer sales demo — NO backend wiring
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

  // 2.5 INVESTOR ACCESS TOKEN URL
  // Lock the entire site behind a secret URL.
  if (!pathname.startsWith('/api/mobile/')) {
    const searchParams = req.nextUrl.searchParams;
    const accessCode = searchParams.get('access');
    const hasCookie = req.cookies.has('symmetri_investor_access');

    // If they have the correct secret link, set the cookie and redirect to clean URL
    if (accessCode === 'Kaszek2026' || accessCode === 'Vamos2026' || accessCode === 'Lattitude2026' || accessCode === 'Leap2026' || accessCode === 'Hustle2026' || accessCode === 'Magma2026') {
      const url = req.nextUrl.clone();
      url.searchParams.delete('access');
      if (url.pathname === '/') {
        url.pathname = '/signin';
      }
      const response = NextResponse.redirect(url);
      response.cookies.set('symmetri_investor_access', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      return response;
    }

    // If no cookie is present, show a completely blank 404 (except for marketing pages)
    const MARKETING_PATHS = ['/', '/about', '/partners', '/faq', '/legal/privacy', '/legal/terms', '/social-card'];
    if (!hasCookie && !MARKETING_PATHS.includes(pathname)) {
      return new NextResponse('Coming Soon', { status: 404 });
    }
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
  // 3. Fallback to existing cookies OR Vercel Geo-IP
  else {
    const cookieMarket = req.cookies.get('symmetri_market')?.value;
    const cookieDest = req.cookies.get('symmetri_dest')?.value;

    if (cookieMarket) {
      // TIER 2: Existing Session (Respect user's locked-in state)
      originMarket = cookieMarket;
      destRegion = cookieDest || (originMarket === 'ES' ? 'CO' : 'MX');
    } else {
      // TIER 3: Vercel Geo-IP Fallback (For first-time organic traffic)
      const country = req.headers.get('x-vercel-ip-country');
      if (country === 'ES') {
        originMarket = 'ES';
        destRegion = 'CO';
      } else {
        // Default to US architecture for all other unclassified traffic
        originMarket = 'US';
        destRegion = 'MX';
      }
    }
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