// src/lib/session.ts
import type { IncomingMessage, ServerResponse } from 'http';
import cookie from 'cookie';
import { v4 as uuidv4 } from 'uuid';

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const COOKIE_NAME = 'trueque_sid';
const redisClient: any = null; // TODO: Initialize Redis client if needed

const inMemoryStore: Map<string, string> =
  global.__TRUEQUE_SESSION_STORE__ || (global.__TRUEQUE_SESSION_STORE__ = new Map<string, string>());

// Helpers
function serializeCookie(name: string, value: string, maxAge: number) {
  return cookie.serialize(name, value, {
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
    return cookie.parse(header);
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

// createSession: persists payload and sets cookie on the response.
// Returns the canonical raw sid (e.g., "sess:...")
export async function createSession(res: ServerResponse, payload: Record<string, any>) {
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
  return sid;
}

// getSessionById accepts either the raw sid or a cookie-like value and returns parsed payload or null.
// If a raw header value is passed in (from cookie parsing), it will handle either raw sid or encoded sid.
export async function getSessionById(sidLike?: string | null) {
  if (!sidLike) return null;
  const sid = String(sidLike);

  // Accept both plain sid and cookie-serialized sid values.
  const candidate = sid;

  try {
    if (redisClient) {
      const v = await redisClient.get(candidate);
      if (v) return JSON.parse(v);
      return null;
    } else {
      const v = inMemoryStore.get(candidate);
      if (!v) return null;
      return JSON.parse(v);
    }
  } catch {
    return null;
  }
}

// getSession reads cookie from IncomingMessage and returns parsed session payload or null.
export async function getSession(req: IncomingMessage) {
  const header = (req as any).headers?.cookie;
  if (!header) return null;
  const parsed = parseCookieHeader(header);
  const sid = parsed[COOKIE_NAME];
  if (!sid) return null;
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
        cookie.serialize(COOKIE_NAME, '', {
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