// lib/mfaToken.ts
// DEV / TEST implementation for MFA pending tokens.
//
// Behavior (dev):
// - createMfaPendingToken({ userId, tid }) returns a short opaque token string.
// - Tokens are stored in an in-memory map (global.__DEV_MFA_PENDING) for lookup during challenge verification.
// - This is intentionally simple for local testing. Replace with a signed JWT or DB-backed persistent token before production.

import { v4 as uuidv4 } from 'uuid';

type CreateMfaArgs = { userId: string; tid?: string; expiresInSeconds?: number };

const DEFAULT_EXPIRES = 5 * 60; // 5 minutes

export function createMfaPendingToken({ userId, tid, expiresInSeconds }: CreateMfaArgs): string {
  const token = uuidv4(); // opaque token for dev
  const expiresAt = Date.now() + 1000 * (expiresInSeconds || DEFAULT_EXPIRES);

  const entry = { token, userId, tid: tid || null, createdAt: Date.now(), expiresAt };

  const g: any = global;
  if (!g.__DEV_MFA_PENDING) g.__DEV_MFA_PENDING = new Map<string, any>();
  g.__DEV_MFA_PENDING.set(token, entry);

  // For convenience in dev, also log the mapping (remove in prod)
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('DEV MFA PENDING CREATED', { token, userId, tid, expiresAt });
  }

  return token;
}

// Helper for verifying token in dev. Returns stored entry or null.
export function verifyMfaPendingToken(token: string) {
  const g: any = global;
  const map: Map<string, any> | undefined = g.__DEV_MFA_PENDING;
  if (!map) return null;
  const entry = map.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    map.delete(token);
    return null;
  }
  return entry;
}

// DEV -> PROD migration notes:
// - Replace createMfaPendingToken with a secure, signed JWT or a DB row in mfa_attempts/mfa_pending table.
// - Ensure the token encodes/associates the canonical tid and persists it in audit tables.
// - Do not use in-memory storage in production. Use a persistent store (DB or redis) and rotate signing keys.