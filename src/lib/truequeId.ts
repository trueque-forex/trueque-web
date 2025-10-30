// src/lib/truequeId.ts
import crypto from 'crypto';

function base36Encode(n: number): string {
  return n.toString(36).toUpperCase();
}

function computeChecksum(payload: string): string {
  const hash = crypto.createHash('sha256').update(payload).digest();
  let value = 0;
  for (let i = 0; i < 5 && i < hash.length; i++) {
    value = (value << 8) + hash[i];
  }
  const mod = value % 36;
  return base36Encode(mod);
}

export function generateTruequeId(date: Date, countryCode: string, seq: number): string {
  const yyyy = date.getUTCFullYear().toString().padStart(4, '0');
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = date.getUTCDate().toString().padStart(2, '0');
  const seqStr = seq.toString().padStart(4, '0');
  const cc = (countryCode || 'XX').toUpperCase().slice(0, 2);
  const payload = `T${yyyy}${mm}${dd}${cc}${seqStr}`;
  const checksum = computeChecksum(payload);
  return `${payload}${checksum}`;
}
