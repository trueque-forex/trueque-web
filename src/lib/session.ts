// src/lib/session.ts
import type { IncomingMessage, ServerResponse } from 'http';
import { serialize, parse } from 'cookie';
import { v4 as uuidv4 } from 'uuid';

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const COOKIE_NAME = 'trueque_sid';
const redisClient: any = null; // TODO: Initialize Redis client if needed

const inMemoryStore: Map<string, string> =
  (global as any).__TRUEQUE_SESSION_STORE__ || ((global as any).__TRUEQUE_SESSION_STORE__ = new Map<string, string>());

// Helpers
function serializeCookie(name: string, value: string, maxAge: number) {
  return serialize(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

function parseCookieHeader(header?: string | null) {
  if (!header) return {};
  try {
    return parse(header);
  } catch {
    // fallback simple parse
    return header.split(';').map((p) => p.split('=')).reduce<Record<string, string>>((acc, [k, v]) => {
      if (!k) return acc;
      acc[k.trim()] = (v || '').trim();
      return acc;
    }, {});
  }
}

// Core functions

import { TruequeSession } from '../types/auth';

// ... imports remain the same ...

// createSession: persists payload and sets cookie on the response.
// Returns the canonical raw sid (e.g., "sess:...")
export async function createSession(res: ServerResponse, payload: TruequeSession) {
  const sid = 'sess:' + uuidv4();
  const raw = JSON.stringify(payload);

  if (redisClient) {
    try {
      await redisClient.set(sid, raw, { EX: TTL_SECONDS });
    } catch {
      // fallback to in-memory if Redis set fails
      inMemoryStore.set(sid, raw);
    }
  } else {
    inMemoryStore.set(sid, raw);
  }

  res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, sid, TTL_SECONDS));
  console.log('[SESSION] Created Session:', sid, 'Store Size:', inMemoryStore.size);
  return sid;
}

// getSessionById accepts either the raw sid or a cookie-like value and returns parsed payload or null.
// If a raw header value is passed in (from cookie parsing), it will handle either raw sid or encoded sid.
export async function getSessionById(sidLike?: string | null): Promise<TruequeSession | null> {
  if (!sidLike) return null;
  // FIX: Decode the SID to handle URL-encoded colons (%3A) from cookies
  const sid = decodeURIComponent(String(sidLike));

  // Accept both plain sid and cookie-serialized sid values.
  const candidate = sid;

  try {
    if (redisClient) {
      const v = await redisClient.get(candidate);
      if (v) return JSON.parse(v) as TruequeSession;
      return null;
    } else {
      const v = inMemoryStore.get(candidate);
      if (!v) return null;
      return JSON.parse(v) as TruequeSession;
    }
  } catch {
    return null;
  }
}

// getSession reads cookie from IncomingMessage and returns parsed session payload or null.
// Also supports Authorization: Bearer <token> for mobile/API clients.
export async function getSession(req: IncomingMessage): Promise<TruequeSession | null> {
  // 1. Check for Bearer token (Mobile/API)
  const authHeader = (req as any).headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const jwt = require('jsonwebtoken'); // Lazy load to avoid overhead if not needed
      const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
      const decoded = jwt.verify(token, secret) as TruequeSession;
      return decoded;
    } catch (err) {
      // Invalid token, fall through to cookie check or return null?
      // Usually if auth header is present but invalid, we should probably fail, 
      // but returning null allows mapped handling upstream (e.g. 401).
      return null;
    }
  }

  // 2. Check for Cookie (Web)
  const header = (req as any).headers?.cookie;
  if (!header) return null;
  const parsed = parseCookieHeader(header);
  const sid = parsed[COOKIE_NAME];
  if (!sid) return null;

  // DEBUG LOGGING requested by Directive
  console.log('[SESSION] Raw Cookie SID:', sid);
  const decoded = decodeURIComponent(sid); // Preview what getSessionById will do
  console.log('[SESSION] Decoded SID:', decoded);

  return getSessionById(sid);
}

// destroySession deletes the session payload and clears cookie on response if provided.
export async function destroySession(req: IncomingMessage | null, res: ServerResponse | null) {
  try {
    let sid: string | undefined;
    if (req) {
      const header = (req as any).headers?.cookie;
      const parsed = parseCookieHeader(header);
      sid = parsed[COOKIE_NAME];
    }

    if (sid) {
      if (redisClient) {
        try {
          await redisClient.del(sid);
        } catch {
          inMemoryStore.delete(sid);
        }
      } else {
        inMemoryStore.delete(sid);
      }
    }

    if (res) {
      // clear cookie
      res.setHeader(
        'Set-Cookie',
        serialize(COOKIE_NAME, '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        })
      );
    }
  } catch {
    // swallow errors to avoid crashing route handlers
  }
}

// Small debug helper (only exported in dev)
export function _DEBUG_getStoredKeys() {
  if (redisClient) return null;
  return Array.from(inMemoryStore.keys());
}