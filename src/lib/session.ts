<<<<<<< HEAD
import Redis from 'redis';
import { promisify } from 'util';
import cookie from 'cookie';
import { v4 as uuidv4 } from 'uuid';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const client = Redis.createClient({ url: redisUrl });
client.connect?.(); // modern redis client supports connect
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function createSession(res: any, payload: Record<string, any>) {
  const id = 'sess:' + uuidv4();
  await client.set(id, JSON.stringify(payload), { EX: TTL_SECONDS });
  const cookieValue = id;
  const cookieHeader = cookie.serialize('trueque_session', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TTL_SECONDS,
  });
  res.setHeader('Set-Cookie', cookieHeader);
  return id;
}

export async function getSession(req: any) {
  const header = req.headers?.cookie;
  if (!header) return null;
  const parsed = cookie.parse(header || '');
  const sid = parsed['trueque_session'];
  if (!sid) return null;
  const raw = await client.get(sid);
=======
// src/lib/session.ts
import type { IncomingMessage, ServerResponse } from 'http';

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const COOKIE_NAME = 'session_token';

// Very small, robust in-memory store for dev and tests.
declare global {
  // eslint-disable-next-line no-var
  var __TRUEQUE_IN_MEMORY_STORE__: Map<string, string> | undefined;
}
const inMemoryStore: Map<string, string> =
  global.__TRUEQUE_IN_MEMORY_STORE__ || (global.__TRUEQUE_IN_MEMORY_STORE__ = new Map<string, string>());

// Helpers: base64url encode/decode (URL-safe, no padding)
function base64urlEncode(s: string) {
  return Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64urlDecode(s: string) {
  const pad = (4 - (s.length % 4)) % 4;
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  return Buffer.from(b64, 'base64').toString('utf8');
}

// Minimal cookie parse/serialize helpers (avoids adding runtime deps)
function parseCookie(header: string | undefined | null): Record<string, string> {
  if (!header) return {};
  return header.split(';').map(p => p.split('=')).reduce<Record<string, string>>((acc, [k, v]) => {
    if (!k) return acc;
    acc[k.trim()] = (v || '').trim();
    return acc;
  }, {});
}
function serializeCookie(name: string, val: string, maxAgeSeconds: number) {
  return `${name}=${val}; Path=/; HttpOnly; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

// Normalize an incoming session identifier to canonical raw sid (sess:...)
function normalizeRawSid(sidLike?: string | null): string | null {
  if (!sidLike) return null;
  // Accept base64url encoded SID or raw "sess:..."
  try {
    const decoded = base64urlDecode(sidLike);
    if (decoded && decoded.startsWith('sess:')) return decoded;
  } catch {
    // ignore
  }
  if (sidLike.startsWith('sess:')) return sidLike;
  try {
    const pct = decodeURIComponent(sidLike);
    if (pct && pct.startsWith('sess:')) return pct;
  } catch {
    // ignore
  }
  return null;
}

// Create session: persist payload as JSON under a raw sid and set cookie (base64url-encoded)
export async function createSession(res: ServerResponse, payload: Record<string, any>) {
  const sid = 'sess:' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  const raw = JSON.stringify(payload);
  inMemoryStore.set(sid, raw);
  const cookieValue = base64urlEncode(sid);
  res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, cookieValue, TTL_SECONDS));
  return sid;
}

// Get session by a cookie-style value or raw sid. If resForRotation is provided and incoming
// value was not canonical, re-issue canonical cookie.
export async function getSessionById(sidLike?: string | null, resForRotation?: ServerResponse | null) {
  const rawSid = normalizeRawSid(sidLike);
  if (!rawSid) return null;

  // If rotation requested, ensure cookie contains canonical base64url(sid)
  if (resForRotation) {
    try {
      const incomingIsBase64url = base64urlEncode(rawSid) === (sidLike ?? '');
      if (!incomingIsBase64url) {
        resForRotation.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, base64urlEncode(rawSid), TTL_SECONDS));
      }
    } catch {
      // ignore
    }
  }

  const raw = inMemoryStore.get(rawSid);
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

<<<<<<< HEAD
export async function destroySession(req: any, res: any) {
  const header = req.headers?.cookie;
  if (!header) return;
  const parsed = cookie.parse(header || '');
  const sid = parsed['trueque_session'];
  if (!sid) return;
  await client.del(sid);
  res.setHeader('Set-Cookie', cookie.serialize('trueque_session', '', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0,
  }));
=======
// Read session from IncomingMessage (API route request). Does not rotate cookies by default.
export async function getSession(req: IncomingMessage) {
  const header = (req as any).headers?.cookie;
  if (!header) return null;
  const parsed = parseCookie(header);
  const rawSid = parsed[COOKIE_NAME];
  if (!rawSid) return null;
  return getSessionById(rawSid, null);
}

// Destroy session: remove stored value and clear cookie
export async function destroySession(req: IncomingMessage | null, res: ServerResponse | null) {
  let sidToDelete: string | null = null;
  if (req) {
    const header = (req as any).headers?.cookie;
    const parsed = parseCookie(header);
    const rawSid = parsed[COOKIE_NAME];
    sidToDelete = normalizeRawSid(rawSid);
  }
  if (sidToDelete) inMemoryStore.delete(sidToDelete);
  if (res) {
    // set cookie with maxAge=0 to clear it
    res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, '', 0));
  }
}

// Debug helper for local testing
export function _DEBUG_getInMemoryKeys() {
  return Array.from(inMemoryStore.keys());
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
}