// src/lib/truequeId.ts
import crypto from 'crypto';

function base36Encode(n: number): string {
  return n.toString(36).toUpperCase();
}

export function computeChecksum(payload: string): string {
  const normalized = payload.trim().toUpperCase();
  const hash = crypto.createHash('sha256').update(normalized).digest();
  let value = 0;
  for (let i = 0; i < 5 && i < hash.length; i++) {
    value = (value << 8) + hash[i];
  }
  const mod = Math.abs(value % 36);
  return base36Encode(mod);
}

export function generateTruequeId(date: Date, countryCode: string, seq: number): string {
  const yyyy = date.getUTCFullYear().toString().padStart(4, '0');
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = date.getUTCDate().toString().padStart(2, '0');
  const seqStr = seq.toString().padStart(4, '0');
  const cc = (countryCode || 'XX').toUpperCase().slice(0, 2);
  const payload = `S${yyyy}${mm}${dd}${cc}${seqStr}`;
  const checksum = computeChecksum(payload);
  return `${payload}${checksum}`;
}

export function parseTruequeId(id: string): { countryCode: string; seq: number } | null {
  if (!id || id.length !== 16 || !id.startsWith('S')) {
    return null;
  }
  // S YYYY MM DD CC SSSS K
  // 0 1234 56 78 90 1234 5
  const cc = id.slice(9, 11);
  const seqStr = id.slice(11, 15);
  const seq = parseInt(seqStr, 10);
  if (isNaN(seq)) {
    return null;
  }
  return { countryCode: cc, seq };
}

export function validateTruequeId(id: string): boolean {
  if (!parseTruequeId(id)) {
    return false;
  }
  const payload = id.slice(0, 15);
  const checksum = id.slice(15);
  const expectedChecksum = computeChecksum(payload);
  return checksum === expectedChecksum;
}
